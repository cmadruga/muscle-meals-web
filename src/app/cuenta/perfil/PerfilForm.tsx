'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateCustomerProfile } from '@/app/actions/customer'
import { validateCP, isValidPostalCode, getZoneByPostalCode } from '@/lib/address-validation'
import { colors } from '@/lib/theme'
import type { Customer } from '@/lib/types'

// Parse stored address string back to components
// Format: "Calle, NumExt[, Int. NumInt], Col. Colonia, C.P. CP, Ciudad, Estado, México"
function parseStoredAddress(addr: string | null) {
  if (!addr) return { calle: '', numExt: '', numInt: '', colonia: '', cp: '' }
  const cpMatch = addr.match(/C\.P\. (\d{5})/)
  const coloniaMatch = addr.match(/Col\. ([^,]+)/)
  const intMatch = addr.match(/Int\. ([^,]+)/)
  const cp = cpMatch?.[1] ?? ''
  const colonia = coloniaMatch?.[1]?.trim() ?? ''
  const numInt = intMatch?.[1]?.trim() ?? ''
  const beforeCol = addr.split(/,\s*(?:Int\.|Col\.)/)[0]
  const parts = beforeCol.split(',').map(s => s.trim()).filter(Boolean)
  return { calle: parts[0] ?? '', numExt: parts[1] ?? '', numInt, colonia, cp }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 14,
  fontSize: 15,
  borderRadius: 8,
  border: `2px solid ${colors.grayLight}`,
  background: colors.black,
  color: colors.white,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  color: colors.textMuted,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function PerfilForm({ customer }: { customer: Customer | null }) {
  const [state, action, pending] = useActionState(updateCustomerProfile, {})
  const [editing, setEditing] = useState(false)

  // Edit mode field state — initialized from customer when entering edit mode
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [countryCode, setCountryCode] = useState<'+52' | '+1'>('+52')
  const [calle, setCalle] = useState('')
  const [numExt, setNumExt] = useState('')
  const [numInt, setNumInt] = useState('')
  const [colonia, setColonia] = useState('')
  const [cp, setCp] = useState('')

  const cpValido = validateCP(cp) && isValidPostalCode(cp)
  const zone = cpValido ? getZoneByPostalCode(cp) : null
  const estado = 'Nuevo León'

  const addressFilled = calle.trim() && numExt.trim() && colonia.trim() && cp.trim()
  const addressValid = !addressFilled || cpValido
  const canSave = fullName.trim() !== '' && addressValid && (!addressFilled || cpValido)

  useEffect(() => {
    if (state?.success) setEditing(false)
  }, [state?.success])

  const enterEdit = () => {
    setFullName(customer?.full_name ?? '')
    setPhone(customer?.phone ?? '')
    setCountryCode('+52')
    const parsed = parseStoredAddress(customer?.address ?? null)
    setCalle(parsed.calle)
    setNumExt(parsed.numExt)
    setNumInt(parsed.numInt)
    setColonia(parsed.colonia)
    setCp(parsed.cp)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title + Editar on the same row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: colors.orange,
          }}>
            Información personal
          </p>
          <button
            onClick={enterEdit}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.orange}`,
              borderRadius: 6,
              color: colors.orange,
              fontSize: 13,
              fontWeight: 600,
              padding: '5px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Editar
          </button>
        </div>

        {/* Nombre */}
        <div>
          <p style={labelStyle}>Nombre completo</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.white }}>
            {customer?.full_name ?? <span style={{ color: colors.textMuted }}>Sin nombre</span>}
          </p>
        </div>

        {/* Teléfono */}
        <div>
          <p style={labelStyle}>WhatsApp</p>
          <p style={{ margin: 0, fontSize: 16, color: colors.white }}>
            {customer?.phone
              ? <>{customer.phone}</>
              : <span style={{ color: colors.textMuted }}>Sin teléfono</span>}
          </p>
        </div>

        {/* Dirección */}
        <div>
          <p style={labelStyle}>Dirección de entrega</p>
          {customer?.address ? (
            <div style={{
              background: '#10b98115',
              border: '1px solid #10b98144',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 1.5,
            }}>
              {customer.address}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
              Sin dirección guardada
            </p>
          )}
        </div>

        {state?.success && (
          <p style={{ color: '#10b981', fontSize: 14, margin: 0 }}>✓ Cambios guardados</p>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Title row */}
      <p style={{
        margin: 0,
        fontSize: 15,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: colors.orange,
      }}>
        Información personal
      </p>

      {/* Nombre */}
      <div>
        <label style={labelStyle} htmlFor="full_name">Nombre completo *</label>
        <input
          id="full_name" name="full_name" type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          required
          style={inputStyle}
        />
      </div>

      {/* Teléfono */}
      <div>
        <label style={labelStyle} htmlFor="phone">WhatsApp</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value as '+52' | '+1')}
            style={{ ...inputStyle, width: 'auto', flexShrink: 0, paddingLeft: 10, paddingRight: 10 }}
          >
            <option value="+52">🇲🇽 +52</option>
            <option value="+1">🇺🇸 +1</option>
          </select>
          <input
            id="phone" name="phone" type="tel"
            value={phone}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '')
              if (digits.length <= 10) setPhone(e.target.value)
            }}
            placeholder="10 dígitos"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 0 }}>
          Recibirás confirmación de pago por WhatsApp
        </p>
      </div>

      {/* Separador dirección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 0' }}>
        <div style={{ flex: 1, height: 1, background: colors.grayLight }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.orange }}>
          Dirección de entrega
        </span>
        <div style={{ flex: 1, height: 1, background: colors.grayLight }} />
      </div>

      {/* Calle */}
      <div>
        <label style={labelStyle} htmlFor="calle">Calle *</label>
        <input
          id="calle" name="calle" type="text"
          value={calle} onChange={e => setCalle(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Núm ext / int */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="numeroExterior">Núm. Exterior *</label>
          <input
            id="numeroExterior" name="numeroExterior" type="text"
            value={numExt} onChange={e => setNumExt(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="numeroInterior">Núm. Interior</label>
          <input
            id="numeroInterior" name="numeroInterior" type="text"
            value={numInt} onChange={e => setNumInt(e.target.value)}
            placeholder="Opcional"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Colonia */}
      <div>
        <label style={labelStyle} htmlFor="colonia">Colonia *</label>
        <input
          id="colonia" name="colonia" type="text"
          value={colonia} onChange={e => setColonia(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* CP / Ciudad */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="codigoPostal">C.P. *</label>
          <input
            id="codigoPostal" name="codigoPostal" type="text"
            value={cp}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '')
              if (v.length <= 5) setCp(v)
            }}
            style={{
              ...inputStyle,
              borderColor: cp.length === 5 && !cpValido ? '#ef4444' : colors.grayLight,
            }}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ciudad">Ciudad</label>
          <input
            id="ciudad" name="ciudad" type="text"
            value={zone ?? ''}
            readOnly
            placeholder="Se llena con el C.P."
            style={{ ...inputStyle, opacity: zone ? 1 : 0.5, cursor: 'default', color: zone ? colors.white : colors.textMuted }}
          />
        </div>
      </div>

      <input type="hidden" name="estado" value={estado} />

      {cp.length === 5 && !cpValido && (
        <div style={{
          background: '#ef444420', border: '2px solid #ef4444',
          borderRadius: 8, padding: 12, fontSize: 14, color: '#ef4444', textAlign: 'center',
        }}>
          CP fuera del área de entrega (solo Área Metropolitana de Monterrey)
        </div>
      )}

      {/* Feedback */}
      {state?.error && (
        <p style={{ color: colors.error, fontSize: 14, margin: 0 }}>{state.error}</p>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={cancelEdit}
          style={{
            flex: 1, padding: '13px 0',
            background: 'transparent', border: `1px solid ${colors.grayLight}`,
            borderRadius: 8, color: colors.white, cursor: 'pointer', fontSize: 15,
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || !canSave}
          style={{
            flex: 2, padding: '13px 0',
            background: canSave ? colors.orange : colors.grayLight,
            color: colors.white, border: 'none',
            borderRadius: 8, cursor: (pending || !canSave) ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 700,
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
