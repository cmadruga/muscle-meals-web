'use client'

import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { processCheckout, processMembershipOrder, validateCart, purchaseMembership } from '@/app/actions/checkout'
import { validateDiscount } from '@/app/actions/discounts'
import { validateReferralCode, checkReferrerRewards } from '@/app/actions/referrals'
import type { ValidatedDiscount } from '@/lib/types/discount'
import { createPaymentPreference } from '@/app/actions/payment'
import type { MembershipDiscounts } from '@/lib/db/settings'
import type { CartItem } from '@/lib/store/cart'
import { trackInitiateCheckout } from '@/lib/pixel'
import type { PickupSpot } from '@/lib/db/pickup-spots'
import { checkMembershipMatch } from '@/lib/utils/membership'
import LoginBanner from '@/components/LoginBanner'
import ReferralBanner from '@/components/ReferralBanner'
import {
  isValidPostalCode,
  getZoneByPostalCode,
  buildFullAddress,
  validateCP,
  validatePhone,
  formatPhoneForWhatsApp,
  type Address
} from '@/lib/address-validation'
import Image from 'next/image'
import Link from 'next/link'

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  page:    '#0a0908',
  panel:   '#0c0a09',
  card:    '#191614',
  orange:  '#F79138',
  orangeHover: '#ffa252',
  onOrange: '#17140f',
  text:    '#F5F1EC',
  textSub: 'rgba(245,241,236,.6)',
  textDim: 'rgba(245,241,236,.45)',
  textFaint: 'rgba(245,241,236,.4)',
  success: '#7ac77a',
  errBorder: '#ff8080',
  errText:   '#ff9b9b',
  border:  'rgba(255,255,255,.1)',
  borderSub: 'rgba(255,255,255,.08)',
  cardBg:  'rgba(255,255,255,.03)',
}
const F = {
  display: `'Franchise','Big Shoulders Display',sans-serif`,
  body:    'Barlow,system-ui,sans-serif',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ShippingType = 'standard' | 'pickup' | 'priority'

type MembershipInfo = {
  is_member: boolean
  membership_weeks_left: number
  membership_qty: number | null
  membership_size_id: string | null
  membership_items: { size_id: string; qty: number }[] | null
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CheckoutClient({
  pickupSpots,
  prefill,
  deliveryDateStr,
  membership,
  shippingStandard = 4900,
  membershipDiscounts,
}: {
  pickupSpots: PickupSpot[]
  prefill?: { customerId?: string; name: string; email?: string; phone: string; address: string | null } | null
  deliveryDateStr?: string
  membership?: MembershipInfo | null
  shippingStandard?: number
  membershipDiscounts?: MembershipDiscounts | null
}) {
  const { items, getTotal, getDiscountedTotal } = useCartStore()
  const isEmpty = items.length === 0
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Descuentos
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<ValidatedDiscount | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [autoDiscountNotif, setAutoDiscountNotif] = useState<string | null>(null)
  // Referidos
  const [referrerCustomerId, setReferrerCustomerId] = useState<string | null>(null)
  const [pendingReferrerRewards, setPendingReferrerRewards] = useState(0)

  // Envío
  const [shippingType, setShippingType] = useState<ShippingType>('standard')
  const [selectedPickupSpot, setSelectedPickupSpot] = useState<string>('')

  // Contacto
  const [customerName, setCustomerName] = useState(prefill?.name ?? '')
  const customerEmail = prefill?.email ?? ''
  const [customerPhone, setCustomerPhone] = useState(prefill?.phone ?? '')
  const [countryCode, setCountryCode] = useState<'+52' | '+1'>('+52')

  // Dirección
  const savedAddress = prefill?.address ?? null
  const [addressOption, setAddressOption] = useState<'saved' | 'new'>(savedAddress ? 'saved' : 'new')
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')

  const isPostalCodeValid = validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
  const zone = isPostalCodeValid ? getZoneByPostalCode(codigoPostal) : null
  const ciudad = zone ?? ''
  const estado = 'Nuevo León'

  const isAddressComplete = Boolean(
    calle.trim() && numeroExterior.trim() && colonia.trim() && isPostalCodeValid
  )
  const addressValidated = shippingType === 'pickup'
    ? true
    : addressOption === 'saved' ? true : isAddressComplete

  // Membresía
  const [membershipMode, setMembershipMode] = useState(false)
  const [membershipWeeks, setMembershipWeeks] = useState<4 | 8 | 12>(4)

  useEffect(() => {
    if (!canPurchaseMembership) return
    try {
      const stored = localStorage.getItem('mm_membership_intent')
      if (stored) {
        const intent = JSON.parse(stored)
        if (intent.enabled && [4, 8, 12].includes(intent.weeks)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMembershipMode(true)
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMembershipWeeks(intent.weeks as 4 | 8 | 12)
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (membershipMode) {
      // Membership mode clears discount state — setState in effect is intentional
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppliedDiscount(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoDiscountNotif(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscountCode('')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscountError('')
      // Priority not available with membership — fall back to standard
      setShippingType(prev => prev === 'priority' ? 'standard' : prev)
    }
  }, [membershipMode])

  // Auto-descuentos al cargar
  useEffect(() => {
    const subtotalNow = getTotal()
    if (subtotalNow === 0) return
    const customerId = prefill?.customerId ?? null
    async function autoApply() {
      try {
        const stored = localStorage.getItem('mm_membership_intent')
        if (stored) { const intent = JSON.parse(stored); if (intent.enabled) return }
      } catch {}
      if (customerId) {
        const { count, discount } = await checkReferrerRewards({ customerId, subtotal: subtotalNow })
        if (discount) {
          setPendingReferrerRewards(count)
          setAppliedDiscount(discount)
          setAutoDiscountNotif(discount.name)
          return
        }
      }
      const { discount } = await validateDiscount({
        customerId,
        subtotal: subtotalNow,
        itemCount: items.reduce((n, i) => n + i.qty, 0),
        shippingCost: shippingStandard,
      })
      if (discount) { setAppliedDiscount(discount); setAutoDiscountNotif(discount.name) }
    }
    autoApply()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const subtotalIndividual = getTotal()
  const subtotal = getDiscountedTotal()
  const totalQty = items.reduce((n, i) => n + i.qty, 0)
  const isPackageActive = totalQty >= 5
  const packageDiscountAmount = subtotalIndividual - subtotal
  const SHIPPING_COSTS = { standard: shippingStandard, priority: 0, pickup: 0 }
  const shippingCost = membershipMode ? 0 : SHIPPING_COSTS[shippingType]
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'free_shipping' ? shippingCost : appliedDiscount.discountAmount
    : 0
  const total = subtotal + shippingCost - discountAmount

  const discountMap: Record<number, number> = {
    4:  membershipDiscounts?.w4  ?? 10,
    8:  membershipDiscounts?.w8  ?? 13,
    12: membershipDiscounts?.w12 ?? 15,
  }
  const membershipDiscountPct = discountMap[membershipWeeks]
  const membershipTotal = Math.round(subtotal * membershipWeeks * (1 - membershipDiscountPct / 100))

  // ── Membership flow ──────────────────────────────────────────────────────────
  const isMembershipMatch = Boolean(
    membership?.is_member &&
    (membership.membership_weeks_left ?? 0) > 0 &&
    membership && checkMembershipMatch(
      items.map(i => ({ sizeId: i.sizeId, qty: i.qty })),
      membership
    )
  )
  const canPurchaseMembership = Boolean(
    prefill?.customerId &&
    (!membership?.is_member || (membership.membership_weeks_left ?? 0) === 0)
  )

  // ── Validación ───────────────────────────────────────────────────────────────
  const isPickupSpotValid = shippingType !== 'pickup' || selectedPickupSpot !== ''
  const phoneValid = validatePhone(customerPhone) && customerPhone.replace(/\D/g, '').length <= 10
  const nameValid = customerName.trim().length > 0

  const ctaDisabledReason = (): string | null => {
    if (!nameValid) return 'Completa tu nombre'
    if (!phoneValid) return 'Teléfono inválido (10 dígitos)'
    if (shippingType === 'pickup' && !selectedPickupSpot) return 'Elige un pickup spot'
    if (!addressValidated) {
      if (shippingType !== 'pickup' && addressOption === 'new' && codigoPostal.length === 5 && !isPostalCodeValid)
        return 'CP fuera del area de entrega'
      if (shippingType !== 'pickup' && addressOption === 'new' && codigoPostal.length < 5)
        return 'Falta el CP'
      return 'Completa la direccion'
    }
    return null
  }
  const ctaReason = ctaDisabledReason()
  const ctaDisabled = isProcessing || ctaReason !== null

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleApplyDiscount() {
    const code = discountCode.trim()
    if (!code) return
    setDiscountError('')
    setDiscountLoading(true)
    const customerId = prefill?.customerId ?? null
    try {
      const { discount, error: dErr } = await validateDiscount({
        customerId, code, subtotal,
        itemCount: totalQty, shippingCost,
      })
      if (discount) { setAppliedDiscount(discount); setReferrerCustomerId(null); setDiscountError(''); return }
      const { discount: refDiscount, referrerCustomerId: refId, error: refErr } = await validateReferralCode({
        code, customerId, subtotal,
      })
      if (refDiscount && refId) {
        setAppliedDiscount(refDiscount); setReferrerCustomerId(refId); setDiscountError('')
      } else if (refErr === 'referral_needs_account') {
        setDiscountError('Crea una cuenta para usar códigos de referido'); setAppliedDiscount(null)
      } else if (refErr) {
        setDiscountError(refErr); setAppliedDiscount(null)
      } else if (dErr) {
        setDiscountError(dErr); setAppliedDiscount(null)
      } else {
        setDiscountError('Código no encontrado'); setAppliedDiscount(null)
      }
    } finally { setDiscountLoading(false) }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null); setReferrerCustomerId(null)
    setDiscountCode(''); setDiscountError('')
  }

  function getFullAddress() {
    if (shippingType === 'pickup') return null
    if (addressOption === 'saved') return savedAddress
    return buildFullAddress({ calle, numeroExterior, numeroInterior, colonia, codigoPostal, ciudad, estado } as Address)
  }

  const handleMembershipCheckout = async () => {
    setIsProcessing(true); setError(null)
    try {
      const result = await processMembershipOrder({
        customerId: prefill?.customerId,
        customerName, customerPhone: formatPhoneForWhatsApp(customerPhone, countryCode),
        customerAddress: getFullAddress(),
        totalAmount: total, shippingType,
        pickupSpotId: shippingType === 'pickup' ? selectedPickupSpot : null,
        shippingCost,
        items: items.map(item => ({
          mealId: item.mealId, mealName: item.mealName, sizeId: item.sizeId, sizeName: item.sizeName,
          qty: item.qty, unitPrice: item.unitPrice, packageInstanceId: item.packageInstanceId,
        })),
        discountId: appliedDiscount?.id ?? null, discountAmount,
      })
      if (result.error) throw new Error(result.error)
      window.location.href = `/order-success?our_order_id=${result.orderId}&value=${total}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la orden')
      setIsProcessing(false)
    }
  }

  const handleMembershipPurchase = async () => {
    setIsProcessing(true); setError(null)
    try {
      const result = await purchaseMembership({
        customerId: prefill!.customerId!,
        customerName, customerPhone: formatPhoneForWhatsApp(customerPhone, countryCode),
        customerAddress: getFullAddress(), shippingType,
        pickupSpotId: shippingType === 'pickup' ? selectedPickupSpot : null,
        membershipWeeks,
        items: items.map(item => ({
          mealId: item.mealId, mealName: item.mealName, sizeId: item.sizeId, sizeName: item.sizeName,
          qty: item.qty, unitPrice: item.unitPrice, packageInstanceId: item.packageInstanceId,
        })),
      })
      if (result.error) throw new Error(result.error)
      if (result.checkoutUrl) window.location.href = result.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la membresía')
      setIsProcessing(false)
    }
  }

  const handleCheckout = async () => {
    setIsProcessing(true); setError(null)
    try {
      const validation = await validateCart(items.map(item => ({
        mealId: item.mealId, mealName: item.mealName, sizeId: item.sizeId, sizeName: item.sizeName,
        qty: item.qty, unitPrice: item.unitPrice, packageInstanceId: item.packageInstanceId,
      })))
      if (!validation.valid) { setError(validation.errors[0].message); setIsProcessing(false); return }

      const whatsappPhone = formatPhoneForWhatsApp(customerPhone, countryCode)
      const isReferralDiscount = appliedDiscount?.id.startsWith('referral:') || appliedDiscount?.id.startsWith('referrer_reward:')
      const isReferrerReward = appliedDiscount?.id.startsWith('referrer_reward:') ?? false

      const checkoutResult = await processCheckout({
        customerId: prefill?.customerId,
        customerName, customerPhone: whatsappPhone,
        customerAddress: getFullAddress(),
        totalAmount: total, shippingType,
        pickupSpotId: shippingType === 'pickup' ? selectedPickupSpot : null,
        shippingCost,
        items: items.map(item => ({
          mealId: item.mealId, sizeId: item.sizeId, qty: item.qty,
          unitPrice: isPackageActive && item.packagePrice ? item.packagePrice : item.unitPrice,
          packageInstanceId: item.packageInstanceId,
        })),
        discountId: isReferralDiscount ? null : (appliedDiscount?.id ?? null),
        discountAmount,
        referrerCustomerId: referrerCustomerId ?? null,
        isReferrerReward,
      })
      if (checkoutResult.error) throw new Error(checkoutResult.error)

      let mpItems: Array<{ name: string; unit_price: number; quantity: number }>
      if (discountAmount > 0 || packageDiscountAmount > 0) {
        mpItems = [{ name: 'Pedido Muscle Meals', unit_price: total, quantity: 1 }]
      } else {
        mpItems = items.map(item => ({
          name: `${item.mealName} (${item.sizeName})`,
          unit_price: isPackageActive && item.packagePrice ? item.packagePrice : item.unitPrice,
          quantity: item.qty,
        }))
        if (shippingCost > 0) mpItems.push({ name: 'Envío Estándar', unit_price: shippingCost, quantity: 1 })
        else if (shippingType === 'priority') mpItems.push({ name: 'Envío Prioritario (A cotizar)', unit_price: 0, quantity: 1 })
        else if (shippingType === 'pickup') {
          const spot = pickupSpots.find(s => s.id === selectedPickupSpot)
          mpItems.push({ name: `Recoger en: ${spot?.name || 'Pickup Spot'}`, unit_price: 0, quantity: 1 })
        }
      }

      const result = await createPaymentPreference({
        orderId: checkoutResult.orderId, customerName, customerEmail,
        customerPhone: whatsappPhone, items: mpItems,
      })
      if (result.success && result.checkoutUrl) {
        trackInitiateCheckout(total, totalQty)
        window.location.href = result.checkoutUrl
      } else {
        setError(result.error || 'Error al procesar el pago')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al procesar el pago')
      setIsProcessing(false)
    }
  }

  function handleCTA() {
    if (isMembershipMatch) return handleMembershipCheckout()
    if (membershipMode && canPurchaseMembership) return handleMembershipPurchase()
    return handleCheckout()
  }

  // CTA label
  const ctaLabel = isProcessing
    ? 'Procesando…'
    : isMembershipMatch   ? 'Confirmar con membresia'
    : membershipMode      ? 'Activar membresia'
    :                       'Proceder al pago'

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <main style={{
        minHeight: '100vh', background: C.page, color: C.text,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', gap: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, color: C.orange, fontFamily: F.display, letterSpacing: '.05em' }}>[ ]</div>
        <h2 style={{ fontFamily: F.display, fontSize: 32, textTransform: 'uppercase', margin: 0, color: C.text }}>
          Tu carrito esta vacio
        </h2>
        <p style={{ fontFamily: F.body, color: C.textSub, margin: 0 }}>Agrega platillos para continuar</p>
        <Link href="/menu" style={{
          marginTop: 8, fontFamily: F.display, fontSize: 20, textTransform: 'uppercase',
          letterSpacing: '.1em', color: C.onOrange, background: C.orange,
          padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
        }}>
          Ver menu →
        </Link>
      </main>
    )
  }

  // ── Page ──────────────────────────────────────────────────────────────────────
  return (
    <>
    <style>{`
      .co-page { background: linear-gradient(rgba(15,13,12,.40),rgba(15,13,12,.40)), url(/media/Fondo.jpg) center/1100px repeat fixed; min-height: 100vh; padding: 30px 28px 60px; position: relative; -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; }
      .co-grid { display: grid; grid-template-columns: 1fr 392px; gap: 26px; align-items: start; }
      .co-mobile-bar { display: none; }
      .co-mobile-summary { display: none; }
      .co-subcopy-short { display: none; }
      @media (max-width: 900px) {
        .co-page { padding: 20px 18px 140px; }
        .co-grid { grid-template-columns: 1fr; }
        .co-sidebar { display: none; }
        .co-mobile-bar { display: flex !important; }
        .co-mobile-summary { display: block !important; }
        .co-shipping-grid { grid-template-columns: 1fr !important; gap: 8px !important; margin-bottom: 14px !important; }
        /* co-ship-detail shows below shipping cards on mobile, matching reference 2c */
        /* H1 + subcopy */
        .co-h1 { font-size: 38px !important; line-height: .9 !important; margin-bottom: 5px !important; }
        .co-subcopy { font-size: 13.5px !important; margin-bottom: 16px !important; max-width: none !important; }
        .co-subcopy-long { display: none !important; }
        .co-subcopy-short { display: inline !important; }
        /* Membership band */
        .co-memb-band { margin-bottom: 16px !important; }
        .co-memb-row { flex-direction: column !important; align-items: stretch !important; }
        .co-memb-img { width: 100% !important; }
        .co-memb-content { padding: 14px 15px !important; gap: 14px !important; }
        .co-memb-title { font-size: 22px !important; line-height: .98 !important; }
        .co-memb-desc { font-size: 12.5px !important; margin-top: 6px !important; }
        .co-memb-chips { display: none !important; }
        .co-memb-weeks { display: none !important; }
        .co-memb-stats { display: none !important; }
        /* Mobile-specific activated layout */
        .co-memb-weeks-mob { display: grid !important; }
        .co-memb-stats-mob { display: block !important; }
        /* Date banner */
        .co-date-wrap { padding: 12px 13px !important; gap: 11px !important; margin-bottom: 12px !important; }
        .co-date-badge { width: 34px !important; height: 34px !important; font-size: 14px !important; }
        .co-date-main { font-size: 13.5px !important; }
        .co-date-sub { font-size: 11.5px !important; }
        /* Shipping cards — compact horizontal row on mobile */
        .co-ship-card { display: grid !important; grid-template-columns: 1fr auto; grid-template-rows: auto auto; column-gap: 12px; row-gap: 0; align-items: center; padding: 14px 15px !important; }
        .co-ship-name { grid-column: 1; grid-row: 1; font-size: 18px !important; }
        .co-ship-price { grid-column: 2; grid-row: 1 / 3; align-self: center; font-size: 15px !important; margin-top: 0 !important; }
        .co-ship-desc { grid-column: 1; grid-row: 2; font-size: 11.5px !important; margin-top: 5px !important; }
        /* Section label */
        .co-section-hint { display: none !important; }
        .co-section-label-text { font-size: 12.5px !important; }
        /* Hide phone helper text on mobile (not in reference 2c) */
        .co-phone-hint { display: none !important; }
        /* Section 2 label — no top margin when ShippingDetail already provides spacing */
        .co-section2-label { margin-top: 0 !important; }
        /* Inputs on mobile — font forced to 16px (iOS zoom prevention), smaller padding */
        .co-page input, .co-page select { padding: 11px 13px !important; font-size: 16px !important; }
      }
      @media (max-width: 640px) {
        .co-pickup-row { flex-direction: column; align-items: flex-start !important; }
      }
    `}</style>

    <main className="co-page" style={{ color: C.text }}>
      <div>

      {/* H1 + subcopy */}
      <h1 className="co-h1" style={{
        fontFamily: F.display, fontSize: 54, lineHeight: .88,
        fontWeight: 700, textTransform: 'uppercase', color: C.text,
        margin: '0 0 6px', letterSpacing: 0,
      }}>
        Checkout
      </h1>
      <p className="co-subcopy" style={{
        fontFamily: F.body, fontSize: 15, lineHeight: 1.5,
        color: C.textSub, maxWidth: '56ch', margin: '0 0 26px',
      }}>
        <span className="co-subcopy-long">Revisa tu semana, elige cómo la quieres recibir y confirma. La confirmación de pago te llega por WhatsApp.</span>
        <span className="co-subcopy-short">Revisa, elige entrega y confirma.</span>
      </p>

      {/* Banda de membresía — full width */}
      <MembershipBand
        mode={membershipMode}
        weeks={membershipWeeks}
        discountMap={discountMap}
        canPurchase={canPurchaseMembership && !isMembershipMatch}
        subtotal={subtotal}
        totalQty={totalQty}
        onToggle={() => setMembershipMode(m => !m)}
        onWeeksChange={setMembershipWeeks}
      />

      {/* Resumen colapsado móvil (encima de las secciones) */}
      <MobileSummaryCollapsible
        items={items}
        isPackageActive={isPackageActive}
        subtotalIndividual={subtotalIndividual}
        subtotal={subtotal}
        packageDiscountAmount={packageDiscountAmount}
        shippingCost={shippingCost}
        shippingType={shippingType}
        total={membershipMode && canPurchaseMembership ? membershipTotal : total}
        membershipMode={membershipMode && canPurchaseMembership}
        membershipWeeks={membershipWeeks}
        membershipDiscountPct={membershipDiscountPct}
        appliedDiscount={appliedDiscount}
        discountAmount={discountAmount}
        discountCode={discountCode}
        discountError={discountError}
        discountLoading={discountLoading}
        onCodeChange={code => { setDiscountCode(code); setDiscountError('') }}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        autoDiscountNotif={autoDiscountNotif}
        onDismissAutoNotif={() => setAutoDiscountNotif(null)}
        pendingReferrerRewards={pendingReferrerRewards}
      />

      {/* Membresía activa — state card */}
      {membership?.is_member && (membership.membership_weeks_left ?? 0) > 0 && (
        <div style={{
          padding: '13px 16px', marginBottom: 20,
          background: isMembershipMatch ? 'rgba(247,145,56,.07)' : 'rgba(255,255,255,.03)',
          border: `1px solid ${isMembershipMatch ? C.orange : 'rgba(255,255,255,.12)'}`,
          borderRadius: 11, fontFamily: F.body,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: isMembershipMatch ? C.orange : C.text, marginBottom: isMembershipMatch ? 3 : 0 }}>
            Membresía activa · {membership.membership_weeks_left} {membership.membership_weeks_left === 1 ? 'semana' : 'semanas'} restantes
          </div>
          {isMembershipMatch
            ? <div style={{ fontSize: 12, color: C.textSub }}>Tu pedido de esta semana está cubierto — sin cobro adicional</div>
            : <div style={{ fontSize: 12, color: C.textDim }}>Cubre {membership.membership_qty} platillos en tu tamaño de membresía. Tu carrito actual no coincide exactamente.</div>
          }
        </div>
      )}

      {/* Grid 2 cols */}
      <div className="co-grid">

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div>

          {/* 1 · Tu entrega */}
          <SectionLabel n="1" title="Tu entrega"
            hint={membershipMode ? `cada domingo durante ${membershipWeeks} semanas` : 'entregamos cada domingo'}
          />

          <DateBanner
            deliveryDateStr={deliveryDateStr}
            shippingType={shippingType}
            membershipMode={membershipMode && canPurchaseMembership}
          />

          <ShippingCards
            selected={shippingType}
            onSelect={setShippingType}
            shippingStandard={shippingStandard}
            membershipMode={(membershipMode && canPurchaseMembership) || isMembershipMatch}
          />

          <div className="co-ship-detail">
            <ShippingDetail
              type={shippingType}
              pickupSpots={pickupSpots}
              selectedSpot={selectedPickupSpot}
              onSelectSpot={setSelectedPickupSpot}
            />
          </div>

          {/* 2 · Contacto y dirección */}
          <SectionLabel
            n="2"
            title={shippingType === 'pickup' ? 'Contacto' : 'Contacto y direccion'}
            hint={shippingType === 'pickup' ? 'recoges tú, no pedimos dirección' : undefined}
            style={{ marginTop: 16, marginBottom: 14 }}
            className="co-section2-label"
          />

          <ContactFields
            name={customerName} phone={customerPhone} countryCode={countryCode}
            onNameChange={setCustomerName} onPhoneChange={setCustomerPhone}
            onCountryCodeChange={setCountryCode}
            shippingType={shippingType}
            disabled={isProcessing}
          />

          {shippingType !== 'pickup' && (
            <AddressSection
              savedAddress={savedAddress}
              addressOption={addressOption}
              onAddressOptionChange={setAddressOption}
              calle={calle} numeroExterior={numeroExterior} numeroInterior={numeroInterior}
              colonia={colonia} codigoPostal={codigoPostal} zone={zone}
              onCalleChange={setCalle} onNumExtChange={setNumeroExterior}
              onNumIntChange={setNumeroInterior} onColoniaChange={setColonia}
              onCPChange={p => { if (p.length <= 5) setCodigoPostal(p) }}
              disabled={isProcessing}
            />
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              background: 'rgba(255,128,128,.07)',
              border: `1px solid rgba(255,128,128,.35)`, borderRadius: 9,
              fontFamily: F.body, fontSize: 13.5, color: C.errText, lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Referral card — mobile only (inline). Desktop = fixed bubble abajo */}
          <ReferralBanner variant="inline" />
        </div>

        {/* ── Sidebar (desktop only) ────────────────────────────────────── */}
        <aside className="co-sidebar" style={{ position: 'sticky', top: 80 }}>
          <CheckoutSidebar
            items={items}
            isPackageActive={isPackageActive}
            subtotalIndividual={subtotalIndividual}
            subtotal={subtotal}
            packageDiscountAmount={packageDiscountAmount}
            shippingCost={shippingCost}
            shippingType={shippingType}
            total={membershipMode && canPurchaseMembership ? membershipTotal : total}
            membershipMode={membershipMode && canPurchaseMembership}
            membershipWeeks={membershipWeeks}
            membershipDiscountPct={membershipDiscountPct}
            appliedDiscount={appliedDiscount}
            discountAmount={discountAmount}
            discountCode={discountCode}
            discountError={discountError}
            discountLoading={discountLoading}
            onCodeChange={code => { setDiscountCode(code); setDiscountError('') }}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            autoDiscountNotif={autoDiscountNotif}
            onDismissAutoNotif={() => setAutoDiscountNotif(null)}
            pendingReferrerRewards={pendingReferrerRewards}
            ctaLabel={ctaLabel}
            ctaDisabled={ctaDisabled}
            ctaReason={ctaReason}
            onCTA={handleCTA}
            isActiveMember={isMembershipMatch}
          />
        </aside>
      </div>
      </div>{/* end content wrapper */}
    </main>

    {/* Barra fija móvil */}
    <MobileBar
      total={membershipMode && canPurchaseMembership ? membershipTotal : total}
      membershipMode={membershipMode && canPurchaseMembership}
      shippingType={shippingType}
      membershipWeeks={membershipWeeks}
      ctaLabel={ctaLabel}
      ctaDisabled={ctaDisabled}
      ctaReason={ctaReason}
      onCTA={handleCTA}
    />

    <LoginBanner />
    <ReferralBanner />
    </>
  )
}

// ── MembershipBand ─────────────────────────────────────────────────────────────
function MembershipBand({
  mode, weeks, discountMap, canPurchase, subtotal, totalQty,
  onToggle, onWeeksChange,
}: {
  mode: boolean; weeks: 4 | 8 | 12; discountMap: Record<number, number>
  canPurchase: boolean; subtotal: number; totalQty: number
  onToggle: () => void; onWeeksChange: (w: 4 | 8 | 12) => void
}) {
  if (!canPurchase) return null

  const pct = discountMap[weeks]
  const perMealOriginal = totalQty > 0 ? subtotal / totalQty : 0
  const perMealDiscounted = Math.round(perMealOriginal * (1 - pct / 100))
  const weeklyOriginal = subtotal
  const weeklyDiscounted = Math.round(subtotal * (1 - pct / 100))
  const membershipTotal = Math.round(subtotal * weeks * (1 - pct / 100))
  // Formato con separador de miles: $1,090.00
  const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div
      className="co-memb-band"
      onClick={onToggle}
      style={{
        borderRadius: 12, overflow: 'hidden', marginBottom: 30,
        border: `1px solid ${mode ? C.orange : 'rgba(247,145,56,.45)'}`,
        background: mode ? 'rgba(247,145,56,.07)' : 'rgba(247,145,56,.05)',
        cursor: 'pointer',
      }}
    >
      {/* Top row — imagen + contenido en flex row (columna en mobile) */}
      <div className="co-memb-row" style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* Imagen — desktop: 420px fijo, overflow hidden; mobile: full-width natural height */}
        <div className="co-memb-img"
          style={{ width: 420, flexShrink: 0, overflow: 'hidden', alignSelf: 'stretch' }}>
          <Image
            src="/media/membership-lockup.png"
            alt=""
            width={1517}
            height={605}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Contenido — flex ROW: texto (flex:1) + toggle (fijo) */}
        <div className="co-memb-content" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 22, padding: '20px 22px' }}>

          {/* Bloque de texto: título, descripción, chips o semanas */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="co-memb-title" style={{ fontFamily: F.display, fontSize: 30, lineHeight: .95, fontWeight: 700,
              textTransform: 'uppercase', color: mode ? C.orange : C.text }}>
              {mode ? 'Membresia activada' : 'Pides cada semana?'}
            </div>

            <p className="co-memb-desc" style={{ fontFamily: F.body, fontSize: 13.5, lineHeight: 1.5, color: C.textSub, margin: '9px 0 0' }}>
              {mode
                ? 'Este menú se repite cada domingo.'
                : 'Hasta 15% off y envío siempre gratis.'}
            </p>

            {/* Chips (inactivo) — ocultos en mobile */}
            {!mode && (
              <div className="co-memb-chips" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
                <Chip color={C.orange} bg="rgba(247,145,56,.14)">Desde -10%</Chip>
                <Chip color={C.success} bg="rgba(122,199,122,.14)">Envio siempre gratis</Chip>
              </div>
            )}

            {/* Selector de semanas (activo) — oculto en mobile */}
            {mode && (
              <div className="co-memb-weeks" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                {([4, 8, 12] as const).map(w => (
                  <div key={w} onClick={e => { e.stopPropagation(); onWeeksChange(w) }} style={{
                    padding: '11px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${weeks === w ? C.orange : 'rgba(255,255,255,.12)'}`,
                    background: weeks === w ? 'rgba(247,145,56,.14)' : 'rgba(255,255,255,.03)',
                  }}>
                    <span style={{ font: `700 17px/1 ${F.body}`, color: weeks === w ? C.orange : C.text, display: 'block' }}>
                      {w} sem.
                    </span>
                    <span style={{ font: `500 12px/1 ${F.body}`, color: weeks === w ? C.orange : C.textDim, display: 'block', marginTop: 4 }}>
                      −{discountMap[w]}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggle */}
          <div
            role="switch"
            aria-checked={mode}
            aria-label={mode ? 'Desactivar membresía' : 'Activar membresía'}
            onClick={e => { e.stopPropagation(); onToggle() }}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: mode ? 'flex-end' : 'flex-start',
              width: 52, height: 30, borderRadius: 15, padding: 3,
              background: mode ? C.orange : 'rgba(255,255,255,.14)',
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.text, boxShadow: '0 1px 4px rgba(0,0,0,.5)' }} />
          </div>
        </div>
      </div>

      {/* Selector de semanas — mobile only, full-width bajo la fila de imagen+contenido */}
      {mode && (
        <div className="co-memb-weeks-mob" style={{
          display: 'none', // mostrado en mobile via CSS
          gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 15px 14px',
        }}>
          {([4, 8, 12] as const).map(w => (
            <div key={w} onClick={e => { e.stopPropagation(); onWeeksChange(w) }} style={{
              padding: '7px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
              border: `1px solid ${weeks === w ? C.orange : 'rgba(255,255,255,.12)'}`,
              background: weeks === w ? 'rgba(247,145,56,.14)' : 'rgba(255,255,255,.03)',
            }}>
              <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 700, color: weeks === w ? C.orange : C.text }}>
                {w} sem.
              </div>
              <div style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 500,
                color: weeks === w ? 'rgba(245,241,236,.75)' : C.textDim, marginTop: 3 }}>
                −{discountMap[w]}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cifras por fila — mobile only (desktop usa la banda de 3 columnas) */}
      {mode && (
        <div className="co-memb-stats-mob" style={{
          display: 'none', // mostrado en mobile via CSS
          borderTop: '1px solid rgba(247,145,56,.3)',
        }}>
          {[
            { label: 'Por platillo',  prev: fmt(perMealOriginal),          next: fmt(perMealDiscounted),  accent: false },
            { label: 'Por semana',    prev: fmt(weeklyOriginal),            next: fmt(weeklyDiscounted),   accent: false },
            { label: `Total · ${weeks} sem.`, prev: fmt(weeklyOriginal * weeks), next: fmt(membershipTotal), accent: true },
          ].map(({ label, prev, next, accent }, i, arr) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
              padding: '10px 15px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
            }}>
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600,
                letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>
                {label}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontFamily: F.body, fontSize: 12, color: 'rgba(245,241,236,.4)', textDecoration: 'line-through' }}>{prev}</span>
                <span style={{ fontFamily: F.body, fontSize: 15, fontWeight: 700, color: accent ? C.orange : C.text }}>{next}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Banda de 3 cifras — full width (solo activo, oculta en mobile) */}
      {mode && (
        <div className="co-memb-stats" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 1, background: 'rgba(247,145,56,.16)',
          borderTop: '1px solid rgba(247,145,56,.3)',
        }}>
          {[
            { label: 'Por platillo',  prev: fmt(perMealOriginal),          next: fmt(perMealDiscounted),  accent: false },
            { label: 'Por semana',    prev: fmt(weeklyOriginal),            next: fmt(weeklyDiscounted),   accent: false },
            { label: `Total membresía · ${weeks} sem.`, prev: fmt(weeklyOriginal * weeks), next: fmt(membershipTotal), accent: true },
          ].map(({ label, prev, next, accent }) => (
            <div key={label} style={{ padding: '13px 18px', background: 'rgba(20,17,15,.5)' }}>
              <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, letterSpacing: '.12em',
                textTransform: 'uppercase', color: C.textFaint }}>
                {label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 7 }}>
                <span style={{ fontFamily: F.body, fontSize: 13, color: 'rgba(245,241,236,.4)', textDecoration: 'line-through' }}>
                  {prev}
                </span>
                <span style={{ fontFamily: F.body, fontSize: 17, fontWeight: 700, color: accent ? C.orange : C.text }}>
                  {next}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ padding: '5px 10px', borderRadius: 6, background: bg,
      fontFamily: F.body, fontSize: 11.5, fontWeight: 600, color }}>
      {children}
    </span>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ n, title, hint, style: s, className }: {
  n: string; title: string; hint?: string; style?: React.CSSProperties; className?: string
}) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, ...s }}>
      <span className="co-section-label-text" style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700,
        letterSpacing: '.16em', textTransform: 'uppercase', color: C.text }}>
        {n} · {title}
      </span>
      {hint && (
        <span className="co-section-hint" style={{ fontFamily: F.body, fontSize: 13, color: 'rgba(245,241,236,.45)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

// ── DateBanner ────────────────────────────────────────────────────────────────
function DateBanner({ deliveryDateStr, shippingType, membershipMode }: {
  deliveryDateStr?: string; shippingType: ShippingType; membershipMode: boolean
}) {
  // Parse day number from deliveryDateStr (e.g. "domingo, 13 de septiembre")
  const dayNum = deliveryDateStr?.match(/,\s*(\d+)/)?.[1] ?? '—'
  const prefix = shippingType === 'pickup' ? 'Recoge:' : membershipMode ? 'Primera entrega:' : 'Entrega:'

  return (
    <div className="co-date-wrap" style={{
      padding: '14px 16px', borderRadius: 11,
      border: '1px solid rgba(122,199,122,.35)', background: 'rgba(122,199,122,.07)',
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
    }}>
      <div className="co-date-badge" style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: 'rgba(122,199,122,.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.display, fontSize: 15, fontWeight: 700, color: C.success,
      }}>
        {dayNum}
      </div>
      <div>
        <div className="co-date-main" style={{ fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.success }}>
          {prefix} {deliveryDateStr ?? '—'}
        </div>
      </div>
    </div>
  )
}

// ── ShippingCards ─────────────────────────────────────────────────────────────
function ShippingCards({ selected, onSelect, shippingStandard, membershipMode }: {
  selected: ShippingType; onSelect: (t: ShippingType) => void
  shippingStandard: number; membershipMode: boolean
}) {
  const options: { type: ShippingType; name: string; price: string; priceColor?: string; desc: string }[] = [
    {
      type: 'standard',
      name: 'Estandar',
      price: membershipMode ? 'Gratis' : `$${(shippingStandard / 100).toFixed(0)}.00`,
      priceColor: membershipMode ? C.success : undefined,
      desc: 'Domingo 9AM – 4PM',
    },
    {
      type: 'pickup',
      name: 'Pickup',
      price: 'Gratis',
      priceColor: C.success,
      desc: 'Recoges en el local',
    },
    {
      type: 'priority',
      name: 'Prioritario',
      price: '$100–200',
      priceColor: 'rgba(245,241,236,.75)',
      desc: 'Horario a acordar',
    },
  ]

  // Membership: only standard + pickup (no priority — shipping is included)
  const visibleOptions = membershipMode ? options.filter(o => o.type !== 'priority') : options

  return (
    <div className="co-shipping-grid" style={{
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12,
    }}>
      {visibleOptions.map(({ type, name, price, priceColor, desc }) => {
        const active = selected === type
        const isStandardWithMembership = type === 'standard' && membershipMode
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="co-ship-card"
            style={{
              padding: 15, borderRadius: 11, cursor: 'pointer', textAlign: 'left',
              border: `1px solid ${active ? C.orange : 'rgba(255,255,255,.12)'}`,
              background: active ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)',
              position: 'relative',
            }}
          >
            {isStandardWithMembership && (
              <div style={{
                position: 'absolute', top: -7, right: 11,
                padding: '2px 6px', borderRadius: 4, background: C.success,
                fontFamily: F.body, fontSize: 8.5, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', color: '#14110f',
              }}>
                Incluido
              </div>
            )}
            <div className="co-ship-name" style={{ fontFamily: F.display, fontSize: 20, textTransform: 'uppercase',
              color: active ? C.orange : C.text }}>
              {name}
            </div>
            <div className="co-ship-price" style={{ fontFamily: F.body, fontSize: 16, fontWeight: 700,
              color: priceColor ?? C.text, marginTop: 7 }}>
              {price}
            </div>
            <div className="co-ship-desc" style={{ fontFamily: F.body, fontSize: 12, lineHeight: 1.35,
              color: 'rgba(245,241,236,.5)', marginTop: 5 }}>
              {desc}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── ShippingDetail ────────────────────────────────────────────────────────────
function ShippingDetail({ type, pickupSpots, selectedSpot, onSelectSpot }: {
  type: ShippingType; pickupSpots: PickupSpot[]
  selectedSpot: string; onSelectSpot: (id: string) => void
}) {
  const noSpot = type === 'pickup' && !selectedSpot

  return (
    <div style={{
      padding: 14, borderRadius: 11, marginBottom: 18,
      border: `1px solid ${noSpot ? 'rgba(255,128,128,.35)' : 'rgba(255,255,255,.09)'}`,
      background: noSpot ? 'rgba(255,128,128,.04)' : 'rgba(255,255,255,.03)',
    }}>
      {type === 'standard' && (
        <>
          <div style={{ fontFamily: F.display, fontSize: 11.5, fontWeight: 700,
            letterSpacing: '.16em', textTransform: 'uppercase', color: C.orange, marginBottom: 8 }}>
            Horario segun tu zona
          </div>
          <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.textSub, lineHeight: 1.45 }}>
            Te escribimos el <strong style={{ color: C.text, fontWeight: 600 }}>sábado</strong> por WhatsApp con la hora estimada del domingo.
          </div>
        </>
      )}

      {type === 'priority' && (
        <>
          <div style={{ fontFamily: F.display, fontSize: 11.5, fontWeight: 700,
            letterSpacing: '.16em', textTransform: 'uppercase', color: C.orange, marginBottom: 8 }}>
            Envío a cotizar
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontFamily: F.body, fontSize: 12.5, color: C.textSub, lineHeight: 1.45 }}>
            <li>Acuerda horario y zona específica</li>
            <li>Confirma el costo de envío según tu ubicación</li>
            <li>El envío se paga por separado (est. $100–200 MXN)</li>
          </ul>
        </>
      )}

      {type === 'pickup' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
            <div style={{ fontFamily: F.display, fontSize: 11.5, fontWeight: 700,
              letterSpacing: '.16em', textTransform: 'uppercase', color: C.orange }}>
              Elige tu pickup spot
            </div>
            {!selectedSpot && (
              <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textDim }}>
                requerido
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pickupSpots.map(spot => {
              const active = selectedSpot === spot.id
              return (
                <button key={spot.id} onClick={() => onSelectSpot(spot.id)}
                  style={{
                    padding: '13px 13px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${active ? C.orange : 'rgba(255,255,255,.12)'}`,
                    background: active ? 'rgba(247,145,56,.08)' : 'rgba(255,255,255,.03)',
                    display: 'flex', alignItems: 'flex-start', gap: 11,
                  }}
                >
                  {/* Radio */}
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: `1px solid ${active ? C.orange : 'rgba(245,241,236,.35)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    {/* Name → Address → Schedule (vertical stack per reference) */}
                    <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 600, lineHeight: 1, color: C.text }}>
                      {spot.name}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 12, lineHeight: 1.45, color: C.textSub, marginTop: 4 }}>
                      {spot.address}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 500, lineHeight: 1, color: active ? C.orange : 'rgba(245,241,236,.5)', marginTop: 4 }}>
                      {spot.schedule}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── ContactFields ─────────────────────────────────────────────────────────────
function ContactFields({ name, phone, countryCode, onNameChange, onPhoneChange, onCountryCodeChange, shippingType, disabled }: {
  name: string; phone: string; countryCode: '+52' | '+1'
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
  onCountryCodeChange: (v: '+52' | '+1') => void
  shippingType: ShippingType; disabled: boolean
}) {
  const inp: React.CSSProperties = {
    padding: '14px 13px', fontFamily: F.body, fontSize: 15, lineHeight: 1, color: C.text,
    background: 'rgba(255,255,255,.04)', borderRadius: 9,
    border: '1px solid rgba(255,255,255,.12)', width: '100%', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 600,
    color: C.textSub, marginBottom: 5,
  }
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 8 }}>
      <div>
        <label style={lbl}>Nombre completo *</label>
        <input type="text" value={name} onChange={e => onNameChange(e.target.value)}
          placeholder="Nombre y apellido" disabled={disabled} style={inp} />
      </div>
      <div>
        <label style={lbl}>WhatsApp (10 dígitos) *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 8 }}>
          <select value={countryCode} onChange={e => onCountryCodeChange(e.target.value as '+52' | '+1')}
            disabled={disabled} style={{ ...inp, padding: '14px 10px' }}>
            <option value="+52">🇲🇽 +52</option>
            <option value="+1">🇺🇸 +1</option>
          </select>
          <input type="tel" value={phone}
            onChange={e => {
              const d = e.target.value.replace(/\D/g, '')
              if (d.length <= 10) onPhoneChange(e.target.value)
            }}
            placeholder="10 dígitos" disabled={disabled} style={{ ...inp }} />
        </div>
        <div className="co-phone-hint" style={{ fontFamily: F.body, fontSize: 12, color: C.textDim, marginTop: 5 }}>
          {shippingType === 'pickup'
            ? 'Te avisamos por WhatsApp cuando tu pedido esté listo para recoger'
            : 'Recibirás la confirmación de pago por WhatsApp'}
        </div>
      </div>
    </div>
  )
}

// ── AddressSection ─────────────────────────────────────────────────────────────
function AddressSection({
  savedAddress, addressOption, onAddressOptionChange,
  calle, numeroExterior, numeroInterior, colonia, codigoPostal, zone,
  onCalleChange, onNumExtChange, onNumIntChange, onColoniaChange, onCPChange,
  disabled,
}: {
  savedAddress: string | null; addressOption: 'saved' | 'new'
  onAddressOptionChange: (v: 'saved' | 'new') => void
  calle: string; numeroExterior: string; numeroInterior: string
  colonia: string; codigoPostal: string; zone: string | null
  onCalleChange: (v: string) => void; onNumExtChange: (v: string) => void
  onNumIntChange: (v: string) => void; onColoniaChange: (v: string) => void
  onCPChange: (v: string) => void; disabled: boolean
}) {
  const cpInvalid = codigoPostal.length === 5 && !(validateCP(codigoPostal) && isValidPostalCode(codigoPostal))

  const inp: React.CSSProperties = {
    padding: '14px 13px', fontFamily: F.body, fontSize: 15, lineHeight: 1, color: C.text,
    background: 'rgba(255,255,255,.04)', borderRadius: 9,
    border: '1px solid rgba(255,255,255,.12)', width: '100%', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontFamily: F.body, fontSize: 11.5, fontWeight: 600,
    color: C.textSub, marginBottom: 5,
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ fontFamily: F.display, fontSize: 12, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase', color: C.orange, marginBottom: 10 }}>
        Direccion de entrega
      </div>

      {/* Radios dirección guardada */}
      {savedAddress && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {([
              { val: 'saved' as const, label: 'Usar dirección guardada', sub: savedAddress },
              { val: 'new'   as const, label: 'Ingresar otra dirección',  sub: undefined },
            ]).map(({ val, label: lbl, sub }) => {
              const active = addressOption === val
              return (
              <label key={val} style={{
                display: 'flex',
                alignItems: sub ? 'flex-start' : 'center',
                gap: 11,
                padding: sub ? '13px 14px' : '15px 14px',
                borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
                border: `1px solid ${active ? C.orange : 'rgba(255,255,255,.12)'}`,
                background: active ? 'rgba(247,145,56,.08)' : 'rgba(255,255,255,.03)',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  marginTop: (sub && active) ? 2 : 0,
                  border: `1px solid ${active ? C.orange : 'rgba(245,241,236,.35)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
                </div>
                <div>
                  <input type="radio" name="addrOpt" value={val} checked={active}
                    onChange={() => onAddressOptionChange(val)} disabled={disabled} style={{ display: 'none' }} />
                  <div style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 600, lineHeight: 1,
                    color: active ? C.text : 'rgba(245,241,236,.75)' }}>{lbl}</div>
                  {sub && <div style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(245,241,236,.55)', marginTop: 5 }}>{sub}</div>}
                </div>
              </label>
            )})}
          </div>
          {addressOption === 'saved' && (
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.textFaint, marginBottom: 16 }}>
              Entregamos solo en el área metropolitana de Monterrey
            </div>
          )}
        </>
      )}

      {/* Formulario nueva dirección dentro del recuadro naranja */}
      {(!savedAddress || addressOption === 'new') && (
        <div style={{
          padding: 15, borderRadius: 11,
          border: '1px solid rgba(247,145,56,.28)', background: 'rgba(247,145,56,.03)',
          display: 'flex', flexDirection: 'column', gap: 11,
        }}>
          <div>
            <label style={label}>Calle *</label>
            <input type="text" value={calle} onChange={e => onCalleChange(e.target.value)}
              disabled={disabled} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={label}>Núm. ext. *</label>
              <input type="text" value={numeroExterior} onChange={e => onNumExtChange(e.target.value)}
                disabled={disabled} style={inp} />
            </div>
            <div>
              <label style={label}>Núm. int.</label>
              <input type="text" value={numeroInterior} onChange={e => onNumIntChange(e.target.value)}
                placeholder="Opcional" disabled={disabled} style={inp} />
            </div>
          </div>
          <div>
            <label style={label}>Colonia *</label>
            <input type="text" value={colonia} onChange={e => onColoniaChange(e.target.value)}
              disabled={disabled} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', gap: 8 }}>
            <div>
              <label style={label}>CP *</label>
              <input type="text" value={codigoPostal}
                onChange={e => onCPChange(e.target.value.replace(/\D/g, ''))}
                disabled={disabled}
                style={{ ...inp, borderColor: cpInvalid ? C.errBorder : 'rgba(255,255,255,.12)',
                  background: cpInvalid ? 'rgba(255,128,128,.06)' : 'rgba(255,255,255,.04)' }} />
            </div>
            <div>
              <label style={label}>Ciudad</label>
              <input type="text" value={zone ?? ''} readOnly disabled={disabled}
                placeholder="Se llena con el CP"
                style={{ ...inp, opacity: zone ? 1 : 0.5, cursor: 'default',
                  border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }} />
            </div>
          </div>
          {cpInvalid && (
            <div style={{
              padding: '11px 13px', borderRadius: 9,
              border: '1px solid rgba(255,128,128,.35)', background: 'rgba(255,128,128,.07)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.errBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: F.body, fontSize: 11, color: '#fff', fontWeight: 700 }}>!</div>
              <span style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 1.4, color: C.errText }}>
                Entregamos solo en el área metropolitana de Monterrey. Revisa el CP o elige Pickup.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
type SidebarProps = {
  items: CartItem[]
  isPackageActive: boolean
  subtotalIndividual: number
  subtotal: number
  packageDiscountAmount: number
  shippingCost: number
  shippingType: ShippingType
  total: number
  membershipMode: boolean
  membershipWeeks: number
  membershipDiscountPct: number
  appliedDiscount: ValidatedDiscount | null
  discountAmount: number
  discountCode: string
  discountError: string
  discountLoading: boolean
  onCodeChange: (c: string) => void
  onApplyDiscount: () => void
  onRemoveDiscount: () => void
  autoDiscountNotif: string | null
  onDismissAutoNotif: () => void
  pendingReferrerRewards: number
  ctaLabel: string
  ctaDisabled: boolean
  ctaReason: string | null
  onCTA: () => void
  isActiveMember?: boolean
}

function CheckoutSidebar(p: SidebarProps) {
  const totalQty = p.items.reduce((n, i) => n + i.qty, 0)
  return (
    <div style={{
      border: `1px solid ${p.membershipMode ? C.orange : 'rgba(255,255,255,.1)'}`,
      borderRadius: 12, background: '#0c0a09', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '7px 18px 7px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: F.display, fontSize: 26, textTransform: 'uppercase', color: C.text }}>
          {p.membershipMode ? 'Tu membresia' : 'Tu pedido'}
        </span>
        <span style={{ fontFamily: F.body, fontSize: 13, color: C.textFaint }}>
          {p.membershipMode ? `${p.membershipWeeks} semanas` : `${totalQty} platillo${totalQty !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Membership info banner */}
      {p.membershipMode && (
        <div style={{ padding: '0 18px 14px' }}>
          <div style={{ padding: '12px 14px', border: '1px solid rgba(247,145,56,.3)', borderRadius: 10,
            background: 'rgba(247,145,56,.07)', fontFamily: F.body, fontSize: 12.5, lineHeight: 1.5,
            color: 'rgba(245,241,236,.65)' }}>
            Se cobra hoy el total de las {p.membershipWeeks} semanas. Este menú se repite cada domingo.
          </div>
        </div>
      )}

      {/* Order items grouped by size */}
      <SidebarOrderItems items={p.items} isPackageActive={p.isPackageActive}
        membershipMode={p.membershipMode} membershipDiscountPct={p.membershipDiscountPct} />

      {/* Auto-discount notification */}
      {p.autoDiscountNotif && (
        <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(16,185,129,.06)', borderTop: '1px solid rgba(16,185,129,.12)' }}>
          <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: '#10b981' }}>
            🎁 {p.appliedDiscount?.id.startsWith('referrer_reward:') ? 'Recompensa por referido aplicada' : `¡${p.autoDiscountNotif} aplicado!`}
          </span>
          <button onClick={p.onDismissAutoNotif}
            style={{ background: 'transparent', border: 'none', color: 'rgba(16,185,129,.5)',
              cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      )}

      {/* Discount code — hidden in membership mode */}
      {!p.membershipMode && <div style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {!p.appliedDiscount ? (
          <div style={{ paddingTop: 14, paddingRight: 18, paddingBottom: p.discountError ? 0 : 14, paddingLeft: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <input value={p.discountCode}
                onChange={e => p.onCodeChange(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && p.onApplyDiscount()}
                placeholder="Código de descuento"
                style={{ flex: 1, minWidth: 0, padding: '12px 13px',
                  background: 'rgba(255,255,255,.04)', borderRadius: 9, fontFamily: F.body, fontSize: 13.5,
                  color: p.discountCode ? C.text : 'rgba(245,241,236,.35)',
                  border: `1px solid ${p.discountError ? C.errBorder : 'rgba(255,255,255,.12)'}` }} />
              <button onClick={p.onApplyDiscount} disabled={p.discountLoading || !p.discountCode.trim()}
                style={{ flexShrink: 0, padding: '12px 16px', borderRadius: 9, border: '1px solid rgba(247,145,56,.5)',
                  background: 'rgba(247,145,56,.1)', color: C.orange, cursor: 'pointer',
                  fontFamily: F.body, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  opacity: p.discountCode.trim() ? 1 : 0.5 }}>
                {p.discountLoading ? '…' : 'Aplicar'}
              </button>
            </div>
            {p.discountError && (
              <div style={{ fontFamily: F.body, fontSize: 12, color: C.errText, marginTop: 6, paddingBottom: 14 }}>
                {p.discountError}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '12px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', background: 'rgba(122,199,122,.08)',
              border: '1px solid rgba(122,199,122,.25)', borderRadius: 9 }}>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.success }}>
                ✓ {p.appliedDiscount.name}
              </span>
              <button onClick={p.onRemoveDiscount}
                style={{ background: 'transparent', border: '1px solid rgba(255,128,128,.4)', borderRadius: 6,
                  color: C.errText, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '3px 8px',
                  fontFamily: F.body }}>Quitar</button>
            </div>
          </div>
        )}
      </div>}

      {/* Totals */}
      <SidebarTotals
        subtotalIndividual={p.subtotalIndividual}
        subtotal={p.subtotal}
        packageDiscountAmount={p.packageDiscountAmount}
        isPackageActive={p.isPackageActive}
        shippingCost={p.shippingCost}
        shippingType={p.shippingType}
        total={p.total}
        membershipMode={p.membershipMode}
        membershipWeeks={p.membershipWeeks}
        membershipDiscountPct={p.membershipDiscountPct}
        appliedDiscount={p.appliedDiscount}
        discountAmount={p.discountAmount}
        selectedPickupSpots={undefined}
        isActiveMember={p.isActiveMember}
      />

      {/* CTA */}
      <div style={{ padding: '0 18px 18px' }}>
        <CTAButton label={p.ctaLabel} disabled={p.ctaDisabled} reason={p.ctaReason} onClick={p.onCTA} />
      </div>
    </div>
  )
}

// ── Sidebar order items ───────────────────────────────────────────────────────
function SidebarOrderItems({ items, isPackageActive, membershipMode, membershipDiscountPct, compact }: {
  items: CartItem[]; isPackageActive: boolean
  membershipMode?: boolean; membershipDiscountPct?: number; compact?: boolean
}) {
  const ph = compact ? '8px 15px' : '9px 18px'   // group header padding
  const pi = compact ? '10px 15px' : '11px 18px'  // item padding
  const fnName = compact ? 13 : 14
  const fnQty  = compact ? 11 : 11.5
  const fnUnit = compact ? 12 : 12.5
  const fnLine = compact ? 13 : 13.5

  const sizeOrder: string[] = []
  const bySize = new Map<string, { sizeName: string; items: CartItem[] }>()
  for (const item of items) {
    if (!bySize.has(item.sizeId)) { sizeOrder.push(item.sizeId); bySize.set(item.sizeId, { sizeName: item.sizeName, items: [] }) }
    bySize.get(item.sizeId)!.items.push(item)
  }
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
      {sizeOrder.map(sizeId => {
        const group = bySize.get(sizeId)!
        const groupQty = group.items.reduce((s, i) => s + i.qty, 0)
        return (
          <div key={sizeId}>
            {/* Group header — first group has no border-top (the outer wrapper provides it) */}
            <div style={{ padding: ph, background: 'rgba(255,255,255,.02)',
              borderTop: sizeId === sizeOrder[0] ? 'none' : '1px solid rgba(255,255,255,.08)',
              font: `600 ${compact ? 10 : 10.5}px/1 ${F.body}`, letterSpacing: '.16em',
              textTransform: 'uppercase', color: C.textFaint }}>
              {group.sizeName} · {groupQty} platillo{groupQty !== 1 ? 's' : ''}
            </div>
            {/* Meal rows */}
            {group.items.map((item, idx) => {
              const basePrice = isPackageActive && item.packagePrice ? item.packagePrice : item.unitPrice
              const effectivePrice = membershipMode && membershipDiscountPct
                ? Math.round(basePrice * (1 - membershipDiscountPct / 100))
                : basePrice
              const lineTotal = effectivePrice * item.qty
              const priceColor = membershipMode ? C.orange : isPackageActive ? C.success : 'rgba(245,241,236,.5)'
              return (
                <div key={`${item.mealId}-${idx}`} style={{ padding: pi,
                  borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontFamily: F.body, fontSize: fnName, fontWeight: 600, lineHeight: 1.2, color: C.text }}>
                      {item.mealName}
                    </span>
                    <span style={{ flexShrink: 0, fontFamily: F.body, fontSize: fnQty, fontWeight: 500, lineHeight: 1, color: C.textFaint }}>
                      ×{item.qty}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginTop: compact ? 4 : 5 }}>
                    <span style={{ fontFamily: F.body, fontSize: fnUnit, lineHeight: 1, color: priceColor }}>
                      ${(effectivePrice / 100).toFixed(2)} c/u
                    </span>
                    <span style={{ flexShrink: 0, fontFamily: F.body, fontSize: fnLine, fontWeight: 700, lineHeight: 1, color: C.text }}>
                      ${(lineTotal / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── SidebarTotals ─────────────────────────────────────────────────────────────
function SidebarTotals({
  subtotalIndividual, subtotal, packageDiscountAmount, isPackageActive,
  shippingCost, shippingType, total,
  membershipMode, membershipWeeks, membershipDiscountPct,
  appliedDiscount, discountAmount,
  selectedPickupSpots, isActiveMember, compact, hideTotal,
}: {
  subtotalIndividual: number; subtotal: number; packageDiscountAmount: number; isPackageActive: boolean
  shippingCost: number; shippingType: ShippingType; total: number
  membershipMode: boolean; membershipWeeks: number; membershipDiscountPct: number
  appliedDiscount: ValidatedDiscount | null; discountAmount: number
  selectedPickupSpots?: string; isActiveMember?: boolean
  compact?: boolean; hideTotal?: boolean
}) {
  const fn = compact ? 12.5 : 13.5
  const rp = compact ? '4px 0' : '5px 0'
  const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const row = (label: React.ReactNode, value: React.ReactNode, color?: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: rp }}>
      <span style={{ fontFamily: F.body, fontSize: fn, lineHeight: 1, color: color ?? C.textSub }}>{label}</span>
      <span style={{ fontFamily: F.body, fontSize: fn, lineHeight: 1, fontWeight: 500, color: color ?? C.text }}>{value}</span>
    </div>
  )
  // Row with strikethrough old value + new value
  const rowStrike = (label: React.ReactNode, oldVal: string, newVal: string, newColor: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: rp }}>
      <span style={{ fontFamily: F.body, fontSize: fn, lineHeight: 1, color: C.textSub }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: F.body, fontSize: compact ? 11 : 12, lineHeight: 1, color: 'rgba(245,241,236,.3)', textDecoration: 'line-through' }}>{oldVal}</span>
        <span style={{ fontFamily: F.body, fontSize: fn, lineHeight: 1, fontWeight: 500, color: newColor }}>{newVal}</span>
      </span>
    </div>
  )

  return (
    <div style={{ padding: compact ? '13px 15px' : '16px 18px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
      {membershipMode ? (
        <>
          {row('Semana:', fmt(Math.round(subtotal * (1 - membershipDiscountPct / 100))))}
          {row(`× ${membershipWeeks} semanas:`, fmt(total))}
          {row('Envío incluido:', 'Gratis', C.success)}
          {row(`Ahorro total:`, `−${fmt(subtotalIndividual * membershipWeeks - total)}`, C.success)}
        </>
      ) : (
        <>
          {packageDiscountAmount > 0 && row('Descuento por paquete', `−${fmt(packageDiscountAmount)}`, C.success)}
          {/* Subtotal — valor ya con descuento de paquete aplicado */}
          {row('Subtotal', fmt(subtotal))}
          {isActiveMember ? (
            // Membresía activa: envío cubierto → tachado + Gratis
            rowStrike(
              shippingType === 'standard' ? 'Envío estándar' : shippingType === 'pickup' ? 'Pickup' : 'Envío prioritario',
              shippingCost > 0 ? fmt(shippingCost) : 'Gratis',
              'Gratis', C.success,
            )
          ) : (
            row(
              shippingType === 'standard' ? 'Envío estándar' : shippingType === 'pickup' ? 'Pickup' : 'Envío prioritario',
              shippingCost > 0 ? fmt(shippingCost) : shippingType === 'priority' ? 'Pendiente' : 'Gratis',
              shippingCost === 0 && shippingType !== 'priority' ? C.success : undefined,
            )
          )}
          {appliedDiscount && discountAmount > 0 && row(
            appliedDiscount.name, `−${fmt(discountAmount)}`, C.success
          )}
        </>
      )}

      {/* Total — se oculta en mobile summary expandido */}
      {!hideTotal && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
          marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <span style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1, fontWeight: 500, color: C.text }}>
            {membershipMode ? 'Total hoy' : 'Total'}
          </span>
          {isActiveMember ? (
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: F.body, fontSize: 17, lineHeight: 1, color: 'rgba(245,241,236,.3)', textDecoration: 'line-through' }}>
                {fmt(total)}
              </span>
              <span style={{ fontFamily: F.display, fontSize: 34, lineHeight: 1, color: C.success }}>$0.00</span>
            </span>
          ) : (
            <span style={{ fontFamily: F.display, fontSize: 34, lineHeight: 1, color: C.orange }}>
              {fmt(total)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── CTAButton ─────────────────────────────────────────────────────────────────
function CTAButton({ label, disabled, reason, onClick }: {
  label: string; disabled: boolean; reason: string | null; onClick: () => void
}) {
  return (
    <div>
      <button onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: '18px 0', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        border: disabled ? '1px solid rgba(255,255,255,.1)' : 'none',
        background: disabled ? 'rgba(255,255,255,.05)' : C.orange,
        color: disabled ? 'rgba(245,241,236,.3)' : C.onOrange,
        fontFamily: F.display, fontSize: 22, letterSpacing: '.1em', textTransform: 'uppercase',
        boxShadow: disabled ? 'none' : '0 8px 26px rgba(247,145,56,.22)',
        lineHeight: 1,
      }}>
        {disabled && reason ? reason : label}
      </button>
      <div style={{ fontFamily: F.body, fontSize: 11.5, lineHeight: 1.45,
        color: 'rgba(245,241,236,.4)', textAlign: 'center', marginTop: 10, textWrap: 'pretty' } as React.CSSProperties}>
        Al continuar aceptas los términos. El pedido se confirma por WhatsApp.
      </div>
    </div>
  )
}

// ── Mobile bar ─────────────────────────────────────────────────────────────────
function MobileBar({ total, membershipMode, shippingType, membershipWeeks, ctaLabel, ctaDisabled, ctaReason, onCTA }: {
  total: number; membershipMode: boolean; shippingType: ShippingType
  membershipWeeks: number; ctaLabel: string; ctaDisabled: boolean; ctaReason: string | null; onCTA: () => void
}) {
  const barLabel = membershipMode
    ? `Total hoy · ${membershipWeeks} semanas`
    : shippingType === 'pickup' ? 'Pickup · sin costo de envío' : 'Total con envío'
  const barLabelColor = shippingType === 'pickup' && !membershipMode ? C.success : 'rgba(245,241,236,.5)'

  return (
    <div className="co-mobile-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      padding: '12px 16px 16px',
      borderTop: '1px solid rgba(255,255,255,.1)',
      background: 'rgba(12,10,9,.97)',
      flexDirection: 'column', zIndex: 900,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 9 }}>
        <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: barLabelColor }}>
          {barLabel}
        </span>
        <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.orange }}>
          ${(total / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <button onClick={onCTA} disabled={ctaDisabled} style={{
        width: '100%', padding: '16px 0', borderRadius: 10,
        cursor: ctaDisabled ? 'not-allowed' : 'pointer',
        border: ctaDisabled ? '1px solid rgba(255,255,255,.1)' : 'none',
        background: ctaDisabled ? 'rgba(255,255,255,.05)' : C.orange,
        color: ctaDisabled ? 'rgba(245,241,236,.3)' : C.onOrange,
        fontFamily: F.display, fontSize: 20, letterSpacing: '.1em', textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {ctaDisabled && ctaReason ? ctaReason : ctaLabel}
      </button>
    </div>
  )
}

// ── Mobile summary collapsible ────────────────────────────────────────────────
type MobileSummaryProps = Omit<SidebarProps, 'ctaLabel' | 'ctaDisabled' | 'ctaReason' | 'onCTA'>

function MobileSummaryCollapsible(p: MobileSummaryProps) {
  const [open, setOpen] = useState(false)
  const totalQty = p.items.reduce((n, i) => n + i.qty, 0)
  const sizeNames = [...new Set(p.items.map(i => i.sizeName))].join(' y ')

  return (
    <div className="co-mobile-summary" style={{ marginBottom: 18 }}>
      {/* Collapsed header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '14px 15px', borderRadius: open ? '12px 12px 0 0' : 12,
        border: `1px solid ${open ? C.orange : 'rgba(255,255,255,.1)'}`,
        background: 'rgba(255,255,255,.03)', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: F.display, fontSize: 19, textTransform: 'uppercase', color: C.text }}>
            {p.membershipMode ? 'Tu membresia' : 'Tu pedido'}
          </div>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSub, marginTop: 4 }}>
            {p.membershipMode
              ? `${totalQty} platillo${totalQty !== 1 ? 's' : ''} · ${p.membershipWeeks} semanas`
              : `${totalQty} platillo${totalQty !== 1 ? 's' : ''} · ${sizeNames}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.orange }}>
            ${Math.round(p.total / 100).toLocaleString('en-US')}
          </span>
          <span style={{ fontFamily: F.body, fontSize: 11, color: C.textDim, transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div style={{ border: `1px solid ${C.orange}`, borderTop: 'none', borderRadius: '0 0 12px 12px',
          background: C.panel, overflow: 'hidden' }}>
          <SidebarOrderItems items={p.items} isPackageActive={p.isPackageActive}
            membershipMode={p.membershipMode} membershipDiscountPct={p.membershipDiscountPct} compact />
          <SidebarTotals
            subtotalIndividual={p.subtotalIndividual} subtotal={p.subtotal}
            packageDiscountAmount={p.packageDiscountAmount} isPackageActive={p.isPackageActive}
            shippingCost={p.shippingCost} shippingType={p.shippingType} total={p.total}
            membershipMode={p.membershipMode} membershipWeeks={p.membershipWeeks}
            membershipDiscountPct={p.membershipDiscountPct}
            appliedDiscount={p.appliedDiscount} discountAmount={p.discountAmount}
            isActiveMember={p.isActiveMember} compact hideTotal
          />
          {/* Discount code in mobile summary */}
          <div style={{ padding: '0 15px 14px' }}>
            {!p.appliedDiscount ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={p.discountCode} onChange={e => p.onCodeChange(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && p.onApplyDiscount()}
                  placeholder="Código de descuento"
                  style={{ flex: 1, minWidth: 0, padding: '11px 12px', fontSize: 16,
                    background: 'rgba(255,255,255,.04)', borderRadius: 9, fontFamily: F.body,
                    color: C.text, border: `1px solid rgba(255,255,255,.12)` }} />
                <button onClick={p.onApplyDiscount} disabled={p.discountLoading || !p.discountCode.trim()}
                  style={{ padding: '11px 14px', borderRadius: 9, border: '1px solid rgba(247,145,56,.5)',
                    background: 'rgba(247,145,56,.1)', color: C.orange, cursor: 'pointer',
                    fontFamily: F.body, fontSize: 12.5, fontWeight: 600 }}>
                  {p.discountLoading ? '…' : 'Aplicar'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'rgba(122,199,122,.08)',
                border: '1px solid rgba(122,199,122,.25)', borderRadius: 9 }}>
                <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.success }}>
                  ✓ {p.appliedDiscount.name}
                </span>
                <button onClick={p.onRemoveDiscount}
                  style={{ background: 'transparent', border: '1px solid rgba(255,128,128,.4)', borderRadius: 6,
                    color: C.errText, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '3px 8px',
                    fontFamily: F.body }}>Quitar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
