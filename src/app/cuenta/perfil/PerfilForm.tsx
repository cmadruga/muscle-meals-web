'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateCustomerProfile } from '@/app/actions/customer'
import {
  validateCP,
  isValidPostalCode,
  getZoneByPostalCode,
} from '@/lib/address-validation'
import { colors } from '@/lib/theme'
import type { Customer } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 14,
  fontSize: 16,
  borderRadius: 8,
  border: `2px solid ${colors.grayLight}`,
  background: colors.grayDark,
  color: colors.white,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 'bold',
  color: colors.white,
  fontSize: 14,
}

export default function PerfilForm({ customer }: { customer: Customer | null }) {
  const [state, action, pending] = useActionState(updateCustomerProfile, {})

  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')

  // Address editing state
  const [editingAddress, setEditingAddress] = useState(false)
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [ciudad, setCiudad] = useState('Monterrey')
  const [estado] = useState('Nuevo León')

  const cpValido = validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
  const zone = cpValido ? getZoneByPostalCode(codigoPostal) : null

  const addressComplete =
    calle.trim() !== '' &&
    numeroExterior.trim() !== '' &&
    colonia.trim() !== '' &&
    codigoPostal.length === 5 &&
    cpValido &&
    ciudad.trim() !== ''

  const canSave = fullName.trim() !== '' && (!editingAddress || addressComplete)

  const handleCancelAddress = () => {
    setEditingAddress(false)
    setCalle('')
    setNumeroExterior('')
    setNumeroInterior('')
    setColonia('')
    setCodigoPostal('')
    setCiudad('Monterrey')
  }

  // Al guardar con éxito, cerrar el formulario de dirección
  useEffect(() => {
    if (state?.success) {
      handleCancelAddress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success])

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Datos personales ── */}
      <div>
        <label style={labelStyle} htmlFor="full_name">Nombre completo *</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Juan Pérez García"
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="phone">WhatsApp (10 dígitos)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="8112345678"
          style={inputStyle}
        />
        <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 0 }}>
          Recibirás confirmación de pago por WhatsApp
        </p>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: colors.grayLight, margin: '8px 0' }} />

      {/* ── Dirección ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          fontSize: 16,
          color: colors.orange,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Dirección de entrega
        </h3>
        {!editingAddress ? (
          <button
            type="button"
            onClick={() => setEditingAddress(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.orange}`,
              borderRadius: 6,
              color: colors.orange,
              fontSize: 13,
              fontWeight: 600,
              padding: '5px 14px',
              cursor: 'pointer',
            }}
          >
            {customer?.address ? 'Editar' : '+ Agregar'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancelAddress}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.grayLight}`,
              borderRadius: 6,
              color: colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
              padding: '5px 14px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Dirección guardada (colapsado) */}
      {!editingAddress && (
        customer?.address ? (
          <div style={{
            background: '#10b98115',
            border: '1px solid #10b98144',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: colors.textSecondary,
          }}>
            <span style={{ color: colors.textMuted, fontSize: 12, display: 'block', marginBottom: 2 }}>
              Dirección guardada:
            </span>
            {customer.address}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
            Sin dirección guardada. Agrégala para facilitar tus pedidos.
          </p>
        )
      )}

      {/* Formulario de dirección (expandido) */}
      {editingAddress && (
        <>
          {/* Campos ocultos para que se envíen vacíos si se cancela — no aplica porque no se envían */}
          {/* Calle */}
          <div>
            <label style={labelStyle} htmlFor="calle">Calle *</label>
            <input
              id="calle"
              name="calle"
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Av. Constitución"
              style={inputStyle}
            />
          </div>

          {/* Número exterior e interior */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="numeroExterior">Núm. Exterior *</label>
              <input
                id="numeroExterior"
                name="numeroExterior"
                type="text"
                value={numeroExterior}
                onChange={(e) => setNumeroExterior(e.target.value)}
                placeholder="123"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="numeroInterior">Núm. Interior</label>
              <input
                id="numeroInterior"
                name="numeroInterior"
                type="text"
                value={numeroInterior}
                onChange={(e) => setNumeroInterior(e.target.value)}
                placeholder="Depto. 4B"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Colonia */}
          <div>
            <label style={labelStyle} htmlFor="colonia">Colonia *</label>
            <input
              id="colonia"
              name="colonia"
              type="text"
              value={colonia}
              onChange={(e) => setColonia(e.target.value)}
              placeholder="Centro"
              style={inputStyle}
            />
          </div>

          {/* CP y Ciudad */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="codigoPostal">CP *</label>
              <input
                id="codigoPostal"
                name="codigoPostal"
                type="text"
                value={codigoPostal}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (v.length <= 5) setCodigoPostal(v)
                }}
                placeholder="64000"
                style={{
                  ...inputStyle,
                  borderColor: codigoPostal.length === 5
                    ? (cpValido ? '#10b981' : '#ef4444')
                    : colors.grayLight,
                }}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="ciudad">Ciudad *</label>
              <input
                id="ciudad"
                name="ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Monterrey"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Mensaje validación CP */}
          {codigoPostal.length === 5 && (
            <div style={{
              background: cpValido ? '#10b98120' : '#ef444420',
              border: `2px solid ${cpValido ? '#10b981' : '#ef4444'}`,
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: cpValido ? '#10b981' : '#ef4444',
              textAlign: 'center',
            }}>
              {cpValido
                ? `✅ CP válido — Zona: ${zone}`
                : '❌ CP fuera del área de entrega (Solo Área Metropolitana de Monterrey)'}
            </div>
          )}

          {/* Estado (fijo) */}
          <div>
            <label style={labelStyle} htmlFor="estado">Estado *</label>
            <input
              id="estado"
              name="estado"
              type="text"
              value={estado}
              readOnly
              style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

        </>
      )}

      {/* Feedback */}
      {state?.error && (
        <p style={{ color: colors.error, fontSize: 14, margin: 0 }}>{state.error}</p>
      )}
      {state?.success && (
        <p style={{ color: '#10b981', fontSize: 14, margin: 0 }}>✓ Cambios guardados</p>
      )}

      <button
        type="submit"
        disabled={pending || !canSave}
        style={{
          background: canSave ? colors.orange : colors.grayLight,
          color: colors.black,
          border: 'none',
          borderRadius: 8,
          padding: '13px 24px',
          fontSize: 15,
          fontWeight: 700,
          cursor: (pending || !canSave) ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.6 : 1,
          marginTop: 8,
          transition: 'background 0.2s',
        }}
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
