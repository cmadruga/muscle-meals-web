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
          setMembershipMode(true)
          setMembershipWeeks(intent.weeks as 4 | 8 | 12)
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (membershipMode) {
      setAppliedDiscount(null)
      setAutoDiscountNotif(null)
      setDiscountCode('')
      setDiscountError('')
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
      .co-page { background: ${C.page}; min-height: 100vh; padding: 30px 28px 60px; }
      .co-grid { display: grid; grid-template-columns: 1fr 392px; gap: 26px; align-items: start; }
      @media (max-width: 900px) {
        .co-page { padding: 20px 18px 140px; }
        .co-grid { grid-template-columns: 1fr; }
        .co-sidebar { display: none; }
        .co-mobile-bar { display: flex !important; }
        .co-mobile-summary { display: block !important; }
        .co-shipping-grid { grid-template-columns: 1fr !important; }
      }
      .co-mobile-bar { display: none; }
      .co-mobile-summary { display: none; }
      @media (max-width: 640px) {
        .co-pickup-row { flex-direction: column; align-items: flex-start !important; }
      }
    `}</style>

    <main className="co-page" style={{ color: C.text }}>

      {/* H1 + subcopy */}
      <h1 style={{
        fontFamily: F.display, fontSize: 54, lineHeight: .88,
        fontWeight: 700, textTransform: 'uppercase', color: C.text,
        margin: '0 0 6px', letterSpacing: 0,
      }}>
        Checkout
      </h1>
      <p style={{
        fontFamily: F.body, fontSize: 15, lineHeight: 1.5,
        color: C.textSub, maxWidth: '56ch', margin: '0 0 26px',
      }}>
        Revisa tu pedido y completa tu información para continuar.
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
            membershipWeeks={membershipWeeks}
          />

          <ShippingCards
            selected={shippingType}
            onSelect={setShippingType}
            shippingStandard={shippingStandard}
            membershipMode={membershipMode && canPurchaseMembership}
          />

          <ShippingDetail
            type={shippingType}
            pickupSpots={pickupSpots}
            selectedSpot={selectedPickupSpot}
            onSelectSpot={setSelectedPickupSpot}
          />

          {/* 2 · Contacto y dirección */}
          <SectionLabel
            n="2"
            title={shippingType === 'pickup' ? 'Contacto' : 'Contacto y direccion'}
            hint={shippingType === 'pickup' ? 'recoges tú, no pedimos dirección' : undefined}
            style={{ marginTop: 32 }}
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
          />
        </aside>
      </div>
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
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`

  return (
    <div style={{
      display: 'flex', borderRadius: 12, overflow: 'hidden', marginBottom: 30,
      border: `1px solid ${mode ? C.orange : 'rgba(247,145,56,.45)'}`,
      background: mode ? 'rgba(247,145,56,.07)' : 'rgba(247,145,56,.05)',
    }}>
      {/* Imagen (solo desktop) */}
      <div className="co-memb-img" style={{ width: 200, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
        <Image
          src="/media/membership-lockup.png"
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          sizes="200px"
        />
      </div>

      <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 28, lineHeight: .95, fontWeight: 700,
              textTransform: 'uppercase', color: mode ? C.orange : C.text, marginBottom: 6 }}>
              {mode ? 'Membresia activada' : '¿Pides cada semana?'}
            </div>
            {!mode && (
              <p style={{ fontFamily: F.body, fontSize: 13.5, lineHeight: 1.5, color: C.textSub, margin: '0 0 8px' }}>
                Convierte tu pedido en membresía y paga menos cada semana.
              </p>
            )}
            {/* Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip color={C.orange} bg="rgba(247,145,56,.14)">{`Desde -10%`}</Chip>
              <Chip color={C.success} bg="rgba(122,199,122,.14)">Envio siempre gratis</Chip>
              <Chip color="rgba(245,241,236,.65)" bg="rgba(255,255,255,.06)">Cancelas cuando quieras</Chip>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={onToggle}
            aria-label={mode ? 'Desactivar membresía' : 'Activar membresía'}
            style={{
              width: 58, height: 32, borderRadius: 16, padding: 3, flexShrink: 0,
              background: mode ? C.orange : 'rgba(255,255,255,.14)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background .2s',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: C.text,
              boxShadow: '0 1px 4px rgba(0,0,0,.5)',
              position: 'absolute', top: 3,
              left: mode ? 29 : 3,
              transition: 'left .2s',
            }} />
          </button>
        </div>

        {/* Selector de plazo (when active) */}
        {mode && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {([4, 8, 12] as const).map(w => (
                <button key={w} onClick={() => onWeeksChange(w)} style={{
                  padding: '11px 12px', borderRadius: 9, cursor: 'pointer',
                  border: `1px solid ${weeks === w ? C.orange : 'rgba(255,255,255,.12)'}`,
                  background: weeks === w ? 'rgba(247,145,56,.14)' : 'rgba(255,255,255,.03)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                  <span style={{ fontFamily: F.body, fontSize: 17, fontWeight: 700, color: weeks === w ? C.orange : C.text }}>
                    {w} sem.
                  </span>
                  <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: weeks === w ? C.orange : C.textDim }}>
                    −{discountMap[w]}%
                  </span>
                </button>
              ))}
            </div>

            {/* Banda de 3 cifras */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: 1, background: 'rgba(247,145,56,.16)', borderRadius: 9, overflow: 'hidden',
              marginTop: 4,
            }}>
              {[
                { label: 'Por platillo', prev: fmt(perMealOriginal), next: fmt(perMealDiscounted) },
                { label: 'Por semana',   prev: fmt(weeklyOriginal),  next: fmt(weeklyDiscounted) },
                { label: `Total · ${weeks} sem.`, prev: fmt(weeklyOriginal * weeks), next: fmt(membershipTotal), accent: true },
              ].map(({ label, prev, next, accent }) => (
                <div key={label} style={{ padding: '13px 18px', background: 'rgba(20,17,15,.5)' }}>
                  <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: C.textFaint, marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 13, color: 'rgba(245,241,236,.4)',
                    textDecoration: 'line-through', marginBottom: 2 }}>
                    {prev}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 17, fontWeight: 700,
                    color: accent ? C.orange : C.text }}>
                    {next}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
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
function SectionLabel({ n, title, hint, style: s }: {
  n: string; title: string; hint?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{ marginBottom: 16, ...s }}>
      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700,
        letterSpacing: '.16em', textTransform: 'uppercase', color: C.text }}>
        {n} · {title}
      </div>
      {hint && (
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.textDim, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

// ── DateBanner ────────────────────────────────────────────────────────────────
function DateBanner({ deliveryDateStr, shippingType, membershipMode, membershipWeeks }: {
  deliveryDateStr?: string; shippingType: ShippingType
  membershipMode: boolean; membershipWeeks: number
}) {
  // Parse day number from deliveryDateStr (e.g. "domingo, 13 de septiembre")
  const dayNum = deliveryDateStr?.match(/,\s*(\d+)/)?.[1] ?? '—'
  const prefix = shippingType === 'pickup' ? 'Recoge:' : membershipMode ? 'Primera entrega:' : 'Entrega:'
  const secondary = membershipMode
    ? `Luego cada domingo durante ${membershipWeeks} semanas`
    : 'Pedidos cortados el viernes a mediodía'

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 11,
      border: '1px solid rgba(122,199,122,.35)', background: 'rgba(122,199,122,.07)',
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: 'rgba(122,199,122,.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.display, fontSize: 15, fontWeight: 700, color: C.success,
      }}>
        {dayNum}
      </div>
      <div>
        <div style={{ fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.success }}>
          {prefix} {deliveryDateStr ?? '—'}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, color: 'rgba(245,241,236,.5)', marginTop: 2 }}>
          {secondary}
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
      price: membershipMode ? 'Gratis' : `$${(shippingStandard / 100).toFixed(0)}`,
      priceColor: membershipMode ? C.success : undefined,
      desc: 'Domingo 9AM–4PM',
    },
    {
      type: 'pickup',
      name: 'Pickup',
      price: 'Gratis',
      priceColor: C.success,
      desc: 'Sin costo, recoge tú',
    },
    {
      type: 'priority',
      name: 'Prioritario',
      price: '$100–200',
      priceColor: 'rgba(245,241,236,.75)',
      desc: 'Horario y zona específica',
    },
  ]

  return (
    <div className="co-shipping-grid" style={{
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12,
    }}>
      {options.map(({ type, name, price, priceColor, desc }) => {
        const active = selected === type
        const isStandardWithMembership = type === 'standard' && membershipMode
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              padding: 15, borderRadius: 11, cursor: 'pointer', textAlign: 'left',
              border: `1px solid ${active ? C.orange : 'rgba(255,255,255,.12)'}`,
              background: active ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)',
              position: 'relative',
            }}
          >
            {isStandardWithMembership && (
              <div style={{
                position: 'absolute', top: -8, right: 11,
                padding: '3px 7px', borderRadius: 4, background: C.success,
                fontFamily: F.body, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', color: '#14110f',
              }}>
                Incluido
              </div>
            )}
            <div style={{ fontFamily: F.display, fontSize: 20, textTransform: 'uppercase',
              color: active ? C.orange : C.text, marginBottom: 4 }}>
              {name}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 16, fontWeight: 700,
              color: priceColor ?? C.text, marginBottom: 4 }}>
              {price}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12, lineHeight: 1.35, color: C.textDim }}>
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
      padding: '15px 16px', borderRadius: 11, marginBottom: 28,
      border: `1px solid ${noSpot ? 'rgba(255,128,128,.35)' : 'rgba(255,255,255,.09)'}`,
      background: noSpot ? 'rgba(255,128,128,.04)' : 'rgba(255,255,255,.03)',
    }}>
      {type === 'standard' && (
        <>
          <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 6 }}>
            Horario según tu zona
          </div>
          <div style={{ fontFamily: F.body, fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
            Te escribimos el sábado por WhatsApp con la hora estimada de entrega del domingo.
          </div>
        </>
      )}

      {type === 'priority' && (
        <>
          <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 6 }}>
            Envío a cotizar
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontFamily: F.body, fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
            <li>Acuerda horario y zona específica</li>
            <li>Confirma el costo de envío según tu ubicación</li>
            <li>El envío se paga por separado (est. $100–200 MXN)</li>
          </ul>
        </>
      )}

      {type === 'pickup' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13.5, color: C.text }}>
              Elige tu pickup spot
            </div>
            {!selectedSpot && (
              <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.errText, fontWeight: 600 }}>
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
                    padding: '13px 15px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${active ? C.orange : 'rgba(255,255,255,.12)'}`,
                    background: active ? 'rgba(247,145,56,.08)' : 'rgba(255,255,255,.03)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  {/* Radio */}
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${active ? C.orange : 'rgba(255,255,255,.3)'}`,
                    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="co-pickup-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.text }}>{spot.name}</span>
                      <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: active ? C.orange : C.textDim }}>{spot.schedule}</span>
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 1.45, color: C.textSub, marginTop: 2 }}>
                      {spot.address}
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
    padding: 14, fontFamily: F.body, fontSize: 15, color: C.text,
    background: 'rgba(255,255,255,.04)', borderRadius: 9,
    border: '1px solid rgba(255,255,255,.12)', width: '100%', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontFamily: F.body, fontSize: 12, fontWeight: 600,
    letterSpacing: '.04em', color: C.textSub, marginBottom: 6,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
      <div>
        <label style={label}>Nombre completo *</label>
        <input type="text" value={name} onChange={e => onNameChange(e.target.value)}
          placeholder="Nombre y apellido" disabled={disabled} style={inp} />
      </div>
      <div>
        <label style={label}>WhatsApp *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', gap: 8 }}>
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
            placeholder="10 dígitos" disabled={disabled} style={{ ...inp, fontSize: 16 }} />
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.textDim, marginTop: 5 }}>
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
    padding: 14, fontFamily: F.body, fontSize: 15, color: C.text,
    background: 'rgba(255,255,255,.04)', borderRadius: 9,
    border: '1px solid rgba(255,255,255,.12)', width: '100%', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontFamily: F.body, fontSize: 12, fontWeight: 600,
    letterSpacing: '.04em', color: C.textSub, marginBottom: 6,
  }

  return (
    <div style={{ marginTop: 6, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase', color: C.orange, marginBottom: 12 }}>
        Direccion de entrega
      </div>

      {/* Radios dirección guardada */}
      {savedAddress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {([
            { val: 'saved' as const, label: 'Usar dirección guardada', sub: savedAddress },
            { val: 'new'   as const, label: 'Ingresar otra dirección',  sub: undefined },
          ]).map(({ val, label: lbl, sub }) => (
            <label key={val} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 15px',
              borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
              border: `1px solid ${addressOption === val ? C.orange : 'rgba(255,255,255,.12)'}`,
              background: addressOption === val ? 'rgba(247,145,56,.05)' : 'rgba(255,255,255,.03)',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                border: `2px solid ${addressOption === val ? C.orange : 'rgba(255,255,255,.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {addressOption === val && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
              </div>
              <div>
                <input type="radio" name="addrOpt" value={val} checked={addressOption === val}
                  onChange={() => onAddressOptionChange(val)} disabled={disabled} style={{ display: 'none' }} />
                <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.text }}>{lbl}</div>
                {sub && <div style={{ fontFamily: F.body, fontSize: 12.5, lineHeight: 1.4, color: C.textSub, marginTop: 2 }}>{sub}</div>}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Formulario nueva dirección dentro del recuadro naranja */}
      {(!savedAddress || addressOption === 'new') && (
        <div style={{
          padding: 18, borderRadius: 11,
          border: '1px solid rgba(247,145,56,.28)', background: 'rgba(247,145,56,.03)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <label style={label}>Calle *</label>
            <input type="text" value={calle} onChange={e => onCalleChange(e.target.value)}
              disabled={disabled} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Núm. exterior *</label>
              <input type="text" value={numeroExterior} onChange={e => onNumExtChange(e.target.value)}
                disabled={disabled} style={inp} />
            </div>
            <div>
              <label style={label}>Núm. interior</label>
              <input type="text" value={numeroInterior} onChange={e => onNumIntChange(e.target.value)}
                placeholder="Opcional" disabled={disabled} style={inp} />
            </div>
          </div>
          <div>
            <label style={label}>Colonia *</label>
            <input type="text" value={colonia} onChange={e => onColoniaChange(e.target.value)}
              disabled={disabled} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12 }}>
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
}

function CheckoutSidebar(p: SidebarProps) {
  const totalQty = p.items.reduce((n, i) => n + i.qty, 0)
  return (
    <div style={{
      border: `1px solid ${p.membershipMode ? C.orange : 'rgba(255,255,255,.1)'}`,
      borderRadius: 12, background: C.panel, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: F.display, fontSize: 26, textTransform: 'uppercase', color: C.text }}>
          {p.membershipMode ? 'Tu membresia' : 'Tu pedido'}
        </span>
        <span style={{ fontFamily: F.body, fontSize: 13, color: C.textFaint }}>
          {p.membershipMode ? `${p.membershipWeeks} semanas` : `${totalQty} platillo${totalQty !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Order items grouped by size */}
      <SidebarOrderItems items={p.items} isPackageActive={p.isPackageActive} />

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

      {/* Discount code */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        {p.membershipMode ? (
          <input disabled value="" onChange={() => {}}
            placeholder="Con membresía activa no aplican más descuentos"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 9, fontFamily: F.body, fontSize: 13, color: 'rgba(245,241,236,.3)', cursor: 'not-allowed' }} />
        ) : !p.appliedDiscount ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={p.discountCode}
              onChange={e => p.onCodeChange(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && p.onApplyDiscount()}
              placeholder="Código de descuento"
              style={{ flex: 1, minWidth: 0, padding: '10px 12px',
                background: 'rgba(255,255,255,.04)', borderRadius: 9, fontFamily: F.body, fontSize: 13,
                color: C.text, border: `1px solid ${p.discountError ? C.errBorder : 'rgba(247,145,56,.5)'}` }} />
            <button onClick={p.onApplyDiscount} disabled={p.discountLoading || !p.discountCode.trim()}
              style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid rgba(247,145,56,.5)',
                background: 'rgba(247,145,56,.1)', color: C.orange, cursor: 'pointer',
                fontFamily: F.body, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                opacity: p.discountCode.trim() ? 1 : 0.5 }}>
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
        {p.discountError && (
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.errText, marginTop: 5 }}>{p.discountError}</div>
        )}
      </div>

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
      />

      {/* CTA */}
      <div style={{ padding: '0 18px 18px' }}>
        <CTAButton label={p.ctaLabel} disabled={p.ctaDisabled} reason={p.ctaReason} onClick={p.onCTA} />
      </div>
    </div>
  )
}

// ── Sidebar order items ───────────────────────────────────────────────────────
function SidebarOrderItems({ items, isPackageActive }: { items: CartItem[]; isPackageActive: boolean }) {
  const sizeOrder: string[] = []
  const bySize = new Map<string, { sizeName: string; items: CartItem[] }>()
  for (const item of items) {
    if (!bySize.has(item.sizeId)) { sizeOrder.push(item.sizeId); bySize.set(item.sizeId, { sizeName: item.sizeName, items: [] }) }
    bySize.get(item.sizeId)!.items.push(item)
  }
  return (
    <div>
      {sizeOrder.map(sizeId => {
        const group = bySize.get(sizeId)!
        const groupQty = group.items.reduce((s, i) => s + i.qty, 0)
        return (
          <div key={sizeId}>
            {/* Group header */}
            <div style={{ padding: '9px 18px', background: 'rgba(255,255,255,.02)',
              borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600,
                letterSpacing: '.16em', textTransform: 'uppercase', color: C.textFaint }}>
                {group.sizeName} · {groupQty} platillo{groupQty !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Meal rows */}
            {group.items.map((item, idx) => {
              const effectivePrice = isPackageActive && item.packagePrice ? item.packagePrice : item.unitPrice
              const lineTotal = effectivePrice * item.qty
              return (
                <div key={`${item.mealId}-${idx}`} style={{ padding: '11px 18px',
                  borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.text }}>
                      {item.mealName}
                    </span>
                    <span style={{ fontFamily: F.body, fontSize: 11.5, color: C.textFaint, flexShrink: 0, marginTop: 1 }}>
                      ×{item.qty}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                    <span style={{ fontFamily: F.body, fontSize: 12.5,
                      color: isPackageActive ? C.success : 'rgba(245,241,236,.5)' }}>
                      ${(effectivePrice / 100).toFixed(2)} c/u
                    </span>
                    <span style={{ fontFamily: F.body, fontSize: 13.5, fontWeight: 700, color: C.text }}>
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
  selectedPickupSpots,
}: {
  subtotalIndividual: number; subtotal: number; packageDiscountAmount: number; isPackageActive: boolean
  shippingCost: number; shippingType: ShippingType; total: number
  membershipMode: boolean; membershipWeeks: number; membershipDiscountPct: number
  appliedDiscount: ValidatedDiscount | null; discountAmount: number
  selectedPickupSpots?: string
}) {
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`
  const row = (label: React.ReactNode, value: React.ReactNode, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0',
      fontFamily: F.body, fontSize: 13.5 }}>
      <span style={{ color: C.textSub }}>{label}</span>
      <span style={{ color: color ?? C.text, fontWeight: 500 }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
      {membershipMode ? (
        <>
          {row('Semana:', fmt(subtotal))}
          {row(`× ${membershipWeeks} semanas:`, `−${membershipDiscountPct}%`, C.success)}
          {row('Envío incluido:', 'Gratis', C.success)}
          {row(`Ahorro total:`, `−${fmt(subtotalIndividual * membershipWeeks - total)}`, C.success)}
        </>
      ) : (
        <>
          {/* Subtotal — tachado si descuento paquete */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontFamily: F.body, fontSize: 13.5 }}>
            <span style={{ color: C.textSub }}>Subtotal:</span>
            {isPackageActive ? (
              <span style={{ color: 'rgba(245,241,236,.3)', textDecoration: 'line-through' }}>{fmt(subtotalIndividual)}</span>
            ) : (
              <span style={{ color: C.text, fontWeight: 500 }}>{fmt(subtotalIndividual)}</span>
            )}
          </div>
          {packageDiscountAmount > 0 && row('Descuento por paquete:', `−${fmt(packageDiscountAmount)}`, C.success)}
          {row(
            shippingType === 'standard' ? 'Envío estándar:' : shippingType === 'pickup' ? 'Pickup:' : 'Envío prioritario:',
            shippingCost > 0 ? fmt(shippingCost) : shippingType === 'priority' ? 'Pendiente' : 'Gratis',
            shippingCost === 0 && shippingType !== 'priority' ? C.success : undefined,
          )}
          {appliedDiscount && discountAmount > 0 && row(
            `${appliedDiscount.name}:`, `−${fmt(discountAmount)}`, C.success
          )}
        </>
      )}

      {/* Total */}
      <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 500, color: C.text }}>
          {membershipMode ? 'Total hoy:' : 'Total:'}
        </span>
        <span style={{ fontFamily: F.display, fontSize: 34, color: C.orange }}>
          {fmt(total)}
        </span>
      </div>
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
      {!disabled && (
        <div style={{ fontFamily: F.body, fontSize: 11.5, lineHeight: 1.45,
          color: 'rgba(245,241,236,.4)', textAlign: 'center', marginTop: 8 }}>
          Al continuar aceptas nuestros términos y condiciones.
        </div>
      )}
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
      flexDirection: 'column', gap: 10, zIndex: 900,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: F.body, fontSize: 12.5, color: barLabelColor }}>
          {barLabel}
        </span>
        <span style={{ fontFamily: F.display, fontSize: 26, color: C.orange }}>
          ${(total / 100).toFixed(2)}
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
    <div className="co-mobile-summary" style={{ marginBottom: 20 }}>
      {/* Collapsed header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '14px 15px', borderRadius: open ? '12px 12px 0 0' : 12,
        border: `1px solid ${open ? C.orange : 'rgba(255,255,255,.1)'}`,
        background: 'rgba(255,255,255,.03)', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: F.display, fontSize: 19, textTransform: 'uppercase', color: C.text }}>
            Tu pedido
          </div>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.textSub, marginTop: 2 }}>
            {totalQty} platillo{totalQty !== 1 ? 's' : ''} · {sizeNames}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: F.display, fontSize: 20, color: C.orange }}>
            ${(p.total / 100).toFixed(2)}
          </span>
          <span style={{ color: C.textDim, fontSize: 14, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div style={{ border: `1px solid ${C.orange}`, borderTop: 'none', borderRadius: '0 0 12px 12px',
          background: C.panel, overflow: 'hidden' }}>
          <SidebarOrderItems items={p.items} isPackageActive={p.isPackageActive} />
          <SidebarTotals
            subtotalIndividual={p.subtotalIndividual} subtotal={p.subtotal}
            packageDiscountAmount={p.packageDiscountAmount} isPackageActive={p.isPackageActive}
            shippingCost={p.shippingCost} shippingType={p.shippingType} total={p.total}
            membershipMode={p.membershipMode} membershipWeeks={p.membershipWeeks}
            membershipDiscountPct={p.membershipDiscountPct}
            appliedDiscount={p.appliedDiscount} discountAmount={p.discountAmount}
          />
          {/* Discount code in mobile summary */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {!p.appliedDiscount ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={p.discountCode} onChange={e => p.onCodeChange(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && p.onApplyDiscount()}
                  placeholder="Código de descuento"
                  style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: 16,
                    background: 'rgba(255,255,255,.04)', borderRadius: 9, fontFamily: F.body,
                    color: C.text, border: `1px solid rgba(247,145,56,.5)` }} />
                <button onClick={p.onApplyDiscount} disabled={p.discountLoading || !p.discountCode.trim()}
                  style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid rgba(247,145,56,.5)',
                    background: 'rgba(247,145,56,.1)', color: C.orange, cursor: 'pointer',
                    fontFamily: F.body, fontSize: 13, fontWeight: 600 }}>
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
