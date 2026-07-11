'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'
import { updateSizePrice, updateShippingStandard } from '@/app/actions/admin-settings'
import type { Size } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 14,
  borderRadius: 6, border: `1px solid ${colors.grayLight}`,
  background: colors.black, color: colors.white,
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: colors.textMuted,
  display: 'block', marginBottom: 4,
}

function pesos(cents: number) { return (cents / 100).toFixed(0) }
function toCents(str: string) { return Math.round(parseFloat(str.replace(/[^0-9.]/g, '')) * 100) }

export default function PreciosPanel({
  mainSizes,
  shippingStandard,
}: {
  mainSizes: Size[]
  shippingStandard: number
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [prices, setPrices] = useState<Record<string, { price: string; pkg: string }>>(() =>
    Object.fromEntries(mainSizes.map(s => [s.id, { price: pesos(s.price), pkg: pesos(s.package_price ?? 0) }]))
  )
  const [shipping, setShipping] = useState(pesos(shippingStandard))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const results = await Promise.all([
      ...mainSizes.map(s => updateSizePrice(s.id, toCents(prices[s.id].price), toCents(prices[s.id].pkg))),
      updateShippingStandard(toCents(shipping)),
    ])
    setSaving(false)
    const failed = results.find(r => r.error)
    if (failed?.error) { setError(failed.error); return }
    setEditing(false)
  }

  const handleCancel = () => {
    setPrices(Object.fromEntries(mainSizes.map(s => [s.id, { price: pesos(s.price), pkg: pesos(s.package_price ?? 0) }])))
    setShipping(pesos(shippingStandard))
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textMuted }}>
            Precios
          </p>
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'transparent', border: `1px solid ${colors.orange}`,
              borderRadius: 6, color: colors.orange, fontSize: 13, fontWeight: 600,
              padding: '4px 14px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Editar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mainSizes.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: colors.white, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                ${pesos(s.price)} individual · ${pesos(s.package_price ?? 0)} paquete
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: `1px solid ${colors.grayLight}` }}>
            <span style={{ fontSize: 14, color: colors.white, fontWeight: 600 }}>Envío estándar</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>${pesos(shippingStandard)} MXN</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textMuted }}>
        Precios
      </p>

      {/* Tamaños */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {mainSizes.map(s => (
          <div key={s.id}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: colors.white }}>{s.name}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Individual ($)</label>
                <input style={inputStyle} value={prices[s.id].price}
                  onChange={e => setPrices(prev => ({ ...prev, [s.id]: { ...prev[s.id], price: e.target.value } }))} />
              </div>
              <div>
                <label style={labelStyle}>Paquete ($)</label>
                <input style={inputStyle} value={prices[s.id].pkg}
                  onChange={e => setPrices(prev => ({ ...prev, [s.id]: { ...prev[s.id], pkg: e.target.value } }))} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: colors.grayLight, margin: '4px 0 16px' }} />

      {/* Envío */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: colors.white }}>Envío estándar</p>
        <div>
          <label style={labelStyle}>Precio ($)</label>
          <input style={inputStyle} value={shipping} onChange={e => setShipping(e.target.value)} />
        </div>
      </div>

      {error && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ef4444' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleCancel}
          style={{
            flex: 1, padding: '10px 0', background: 'transparent',
            border: `1px solid ${colors.grayLight}`, borderRadius: 8,
            color: colors.white, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 2, padding: '10px 0', background: colors.orange,
            border: 'none', borderRadius: 8, color: colors.white,
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
