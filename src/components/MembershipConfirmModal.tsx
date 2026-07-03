'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'
import { processMembershipOrder } from '@/app/actions/checkout'
import { formatPhoneForWhatsApp, buildFullAddress, isValidPostalCode, getZoneByPostalCode, validateCP } from '@/lib/address-validation'
import type { CartItem } from '@/lib/store/cart'
import type { PickupSpot } from '@/lib/db/pickup-spots'

export type PrefillInfo = {
  customerId: string
  name: string
  phone: string
  address: string | null
}

export type MembershipInfo = {
  is_member: boolean
  membership_weeks_left: number
  membership_qty: number | null
  membership_size_id: string | null
}

const SHIPPING_COSTS = { standard: 4900, pickup: 0, priority: 0 }

export function AddressForm({
  calle, onCalleChange,
  numeroExterior, onNumeroExteriorChange,
  numeroInterior, onNumeroInteriorChange,
  colonia, onColoniaChange,
  codigoPostal, onCodigoPostalChange,
  zone, isPostalCodeValid, disabled,
}: {
  calle: string; onCalleChange: (v: string) => void
  numeroExterior: string; onNumeroExteriorChange: (v: string) => void
  numeroInterior: string; onNumeroInteriorChange: (v: string) => void
  colonia: string; onColoniaChange: (v: string) => void
  codigoPostal: string; onCodigoPostalChange: (v: string) => void
  zone: string | null; isPostalCodeValid: boolean; disabled: boolean
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 14,
    borderRadius: 7, border: `1.5px solid ${colors.grayLight}`,
    background: colors.black, color: colors.white, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 5, fontWeight: 600,
    color: colors.white, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  }
  return (
    <div style={{ background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={labelStyle}>Calle *</label>
        <input type="text" value={calle} onChange={e => onCalleChange(e.target.value)} disabled={disabled} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Núm. Exterior *</label>
          <input type="text" value={numeroExterior} onChange={e => onNumeroExteriorChange(e.target.value)} disabled={disabled} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Núm. Interior</label>
          <input type="text" value={numeroInterior} onChange={e => onNumeroInteriorChange(e.target.value)} placeholder="Opcional" disabled={disabled} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Colonia *</label>
        <input type="text" value={colonia} onChange={e => onColoniaChange(e.target.value)} disabled={disabled} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>CP *</label>
          <input
            type="text" value={codigoPostal}
            onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 5) onCodigoPostalChange(v) }}
            disabled={disabled}
            style={{ ...inputStyle, borderColor: codigoPostal.length === 5 && !isPostalCodeValid ? '#ef4444' : colors.grayLight }}
          />
        </div>
        <div>
          <label style={labelStyle}>Ciudad</label>
          <input type="text" value={zone ?? ''} readOnly disabled={disabled} placeholder="Se llena con el CP" style={{ ...inputStyle, opacity: zone ? 1 : 0.5, cursor: 'default' }} />
        </div>
      </div>
      {codigoPostal.length === 5 && !isPostalCodeValid && (
        <div style={{ fontSize: 12, color: '#ef4444' }}>CP fuera de zona de entrega</div>
      )}
    </div>
  )
}

export function MembershipConfirmModal({ prefill, pickupSpots, items, subtotal, onClose }: {
  prefill: PrefillInfo
  pickupSpots: PickupSpot[]
  items: CartItem[]
  subtotal: number
  onClose: () => void
}) {
  const [shippingType, setShippingType] = useState<'standard' | 'pickup' | 'priority'>('standard')
  const [selectedPickupSpot, setSelectedPickupSpot] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')

  const isPostalCodeValid = validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
  const zone = isPostalCodeValid ? getZoneByPostalCode(codigoPostal) : null
  const isNewAddressComplete = Boolean(calle.trim() && numeroExterior.trim() && colonia.trim() && isPostalCodeValid)

  const shippingCost = SHIPPING_COSTS[shippingType]
  const total = subtotal + shippingCost

  const canConfirm =
    !processing &&
    (shippingType === 'standard'
      ? prefill.address ? true : isNewAddressComplete
      : shippingType === 'priority'
        ? true
        : selectedPickupSpot !== '')

  const handleConfirm = async () => {
    setProcessing(true)
    setError(null)
    try {
      const resolvedAddress = shippingType !== 'standard'
        ? null
        : prefill.address ?? buildFullAddress({ calle, numeroExterior, numeroInterior, colonia, codigoPostal, ciudad: zone ?? '', estado: 'Nuevo León' })

      const result = await processMembershipOrder({
        customerId: prefill.customerId,
        customerName: prefill.name,
        customerPhone: formatPhoneForWhatsApp(prefill.phone),
        customerAddress: resolvedAddress,
        totalAmount: total,
        shippingType,
        pickupSpotId: shippingType === 'pickup' ? selectedPickupSpot : null,
        shippingCost,
        items: items.map(i => ({
          mealId: i.mealId,
          mealName: i.mealName,
          sizeId: i.sizeId,
          sizeName: i.sizeName,
          qty: i.qty,
          unitPrice: i.unitPrice,
          packageInstanceId: i.packageInstanceId,
        })),
      })
      if (result.error) throw new Error(result.error)
      window.location.href = `/order-success?our_order_id=${result.orderId}&value=${total}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar')
      setProcessing(false)
    }
  }

  const optionStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 14px',
    background: active ? `${colors.orange}18` : colors.black,
    border: `2px solid ${active ? colors.orange : colors.grayLight}`,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.orange}55`, borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.white }}>Confirmar tipo de envío</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div onClick={() => setShippingType('standard')} style={optionStyle(shippingType === 'standard')}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${shippingType === 'standard' ? colors.orange : colors.grayLight}`, background: shippingType === 'standard' ? colors.orange : 'transparent', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: colors.white, fontWeight: 600 }}>Envío estándar</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Entrega en horario regular (Domingo 9AM - 4PM)</div>
                {prefill.address && (
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 1, lineHeight: 1.3 }}>{prefill.address}</div>
                )}
              </div>
            </div>
            {shippingType === 'standard' && !prefill.address && (
              <AddressForm
                calle={calle} onCalleChange={setCalle}
                numeroExterior={numeroExterior} onNumeroExteriorChange={setNumeroExterior}
                numeroInterior={numeroInterior} onNumeroInteriorChange={setNumeroInterior}
                colonia={colonia} onColoniaChange={setColonia}
                codigoPostal={codigoPostal} onCodigoPostalChange={setCodigoPostal}
                zone={zone}
                isPostalCodeValid={isPostalCodeValid}
                disabled={processing}
              />
            )}
            {pickupSpots.length > 0 && (
              <div onClick={() => setShippingType('pickup')} style={optionStyle(shippingType === 'pickup')}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${shippingType === 'pickup' ? colors.orange : colors.grayLight}`, background: shippingType === 'pickup' ? colors.orange : 'transparent', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: colors.white, fontWeight: 600 }}>Pickup</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Recoge tu pedido en el horario del local</div>
                </div>
              </div>
            )}
            {shippingType === 'pickup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pickupSpots.map(spot => (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedPickupSpot(spot.id)}
                    style={{
                      padding: '10px 12px',
                      background: selectedPickupSpot === spot.id ? `${colors.orange}18` : colors.black,
                      border: `1px solid ${selectedPickupSpot === spot.id ? colors.orange : colors.grayLight}`,
                      borderRadius: 7,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, color: colors.white, fontWeight: 600 }}>{spot.name}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{spot.address}</div>
                  </div>
                ))}
              </div>
            )}
            <div onClick={() => setShippingType('priority')} style={optionStyle(shippingType === 'priority')}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${shippingType === 'priority' ? colors.orange : colors.grayLight}`, background: shippingType === 'priority' ? colors.orange : 'transparent', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: colors.white, fontWeight: 600 }}>Prioritario</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Entrega en horario y zona específica · $100-200 MXN por separado</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={canConfirm ? 'franchise-stroke' : undefined}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: canConfirm ? colors.orange : colors.grayLight,
            color: colors.white,
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Franchise, sans-serif',
            fontSize: 23,
            letterSpacing: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            opacity: processing ? 0.7 : 1,
          }}
        >
          {processing ? 'Confirmando…' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  )
}
