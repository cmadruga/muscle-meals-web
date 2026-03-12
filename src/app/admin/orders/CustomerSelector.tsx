'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'
import type { CustomerBasic } from '@/lib/db/customers'

interface Props {
  customers: CustomerBasic[]
  customerId: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  onExistingSelect: (c: CustomerBasic | null) => void
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onAddressChange: (v: string) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 12,
  marginBottom: 4,
  display: 'block',
}

export default function CustomerSelector({
  customers,
  customerId,
  customerName,
  customerPhone,
  customerAddress,
  onExistingSelect,
  onNameChange,
  onPhoneChange,
  onAddressChange,
}: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>(customers.length > 0 ? 'existing' : 'new')
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)
  })

  const selected = customerId ? customers.find(c => c.id === customerId) : null

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 0',
    borderRadius: 8,
    border: `1px solid ${active ? colors.orange : '#333'}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Cliente</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button style={tabStyle(mode === 'existing')} onClick={() => { setMode('existing'); onExistingSelect(null) }}>
            Existente
          </button>
          <button style={tabStyle(mode === 'new')} onClick={() => { setMode('new'); onExistingSelect(null) }}>
            Nuevo
          </button>
        </div>

        {mode === 'existing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              style={inputStyle}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
            />
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: 13, padding: '6px 0' }}>Sin resultados</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onExistingSelect(c)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${customerId === c.id ? colors.orange : '#333'}`,
                      background: customerId === c.id ? colors.orange + '22' : '#111',
                      color: customerId === c.id ? colors.orange : colors.white,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.full_name}</span>
                    {c.phone && (
                      <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>{c.phone}</span>
                    )}
                    {c.address && (
                      <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{c.address}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            {selected && (
              <p style={{ color: colors.orange, fontSize: 12, margin: 0 }}>
                Seleccionado: {selected.full_name}
              </p>
            )}
          </div>
        )}

        {mode === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={customerName} onChange={e => onNameChange(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} value={customerPhone} onChange={e => onPhoneChange(e.target.value)} placeholder="10 dígitos" />
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input style={inputStyle} value={customerAddress} onChange={e => onAddressChange(e.target.value)} placeholder="Calle, número, colonia" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
