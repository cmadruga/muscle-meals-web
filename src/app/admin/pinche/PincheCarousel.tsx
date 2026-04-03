'use client'

import { useState } from 'react'
import type { PincheMeal, PincheSizeRow } from '@/lib/utils/production'
import type { PincheVessel } from '@/lib/types'
import { colors } from '@/lib/theme'

type IngType = 'pro' | 'carb' | 'veg'

type SectionState = { cocido: string; sarten: string }
type PincheInputs = Record<string, Record<IngType, SectionState>>

const ING_LABELS: Record<IngType, string> = { pro: 'Proteína', carb: 'Carbo', veg: 'Verdura' }
const ING_COLORS: Record<IngType, string> = { pro: '#ef4444', carb: '#eab308', veg: '#22c55e' }
const ING_ORDER: IngType[] = ['pro', 'carb', 'veg']

function getQty(row: PincheSizeRow, type: IngType): number {
  if (type === 'pro') return row.proteinQty
  if (type === 'carb') return row.carbQty
  return row.vegQty
}

function fmt1(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

const thStyle: React.CSSProperties = {
  padding: '7px 10px',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: colors.textMuted,
  whiteSpace: 'nowrap',
  borderBottom: `1px solid ${colors.grayLight}`,
}

function IngSection({
  meal,
  type,
  state,
  onChange,
  vessels,
}: {
  meal: PincheMeal
  type: IngType
  state: SectionState
  onChange: (field: keyof SectionState, value: string) => void
  vessels: PincheVessel[]
}) {
  const color = ING_COLORS[type]
  const totalCrudo = meal.sizes.reduce((s, row) => s + row.qty * getQty(row, type), 0)
  const cocidoBruto = parseFloat(state.cocido) || 0
  const selectedVessel = vessels.find(v => v.id === state.sarten)
  const vesselWeight = selectedVessel?.peso_gr ?? 0
  const cocido = Math.max(0, cocidoBruto - vesselWeight)
  const canCompute = cocido > 0
  const factor = canCompute ? cocido / totalCrudo : 0
  const totalPortions = meal.sizes.reduce((s, row) => s + row.qty, 0)

  const inputStyle: React.CSSProperties = {
    background: '#111',
    border: `1px solid ${colors.grayLight}`,
    borderRadius: 8,
    color: colors.white,
    padding: '7px 10px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        background: color + '22',
        border: `1px solid ${color}44`,
        borderRadius: '8px 8px 0 0',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {ING_LABELS[type]}
        </span>
        {canCompute && (
          <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 'auto', display: 'flex', gap: 10 }}>
            {vesselWeight > 0 && (
              <span>neto <strong style={{ color: colors.white }}>{Math.round(cocido)} gr</strong></span>
            )}
            <span>factor {fmt1(factor)}×</span>
          </span>
        )}
      </div>

      {/* Inputs */}
      <div style={{
        background: colors.grayDark,
        border: `1px solid ${colors.grayLight}`,
        borderTop: 'none',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Peso en seco — fijo, calculado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: colors.textMuted, fontSize: 12 }}>Seco:</span>
          <span style={{ color: colors.white, fontWeight: 700, fontSize: 14 }}>{Math.round(totalCrudo)} gr</span>
        </div>

        {vessels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: colors.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>C/sartén:</label>
            <select value={state.sarten} onChange={e => onChange('sarten', e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              <option value="">—</option>
              {vessels.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.peso_gr} gr)</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ color: colors.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>Cocido:</label>
          <input
            type="number"
            value={state.cocido}
            onChange={e => onChange('cocido', e.target.value)}
            placeholder="0"
            style={{ ...inputStyle, width: 100 }}
          />
          <span style={{ color: colors.textMuted, fontSize: 12 }}>gr</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${colors.grayLight}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>Versión</th>
              <th style={{ ...thStyle, textAlign: 'right', width: 1 }}>Cant.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Crudo/plato</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total crudo</th>
              <th style={{ ...thStyle, textAlign: 'right', color }}>Cocido/plato</th>
            </tr>
          </thead>
          <tbody>
            {meal.sizes.map((row, i) => {
              const qtyPerPlato = getQty(row, type)
              const totalRowCrudo = row.qty * qtyPerPlato
              const cocidoPerPlato = canCompute ? qtyPerPlato * factor : null
              return (
                <tr key={row.sizeId} style={{ background: i % 2 === 0 ? 'transparent' : '#1a1a1a', borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '8px 10px', color: row.isMain ? colors.white : colors.orange, fontWeight: 600 }}>
                    {row.sizeName}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.white, fontWeight: 800, width: 1, whiteSpace: 'nowrap' }}>
                    {row.qty}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {Math.round(qtyPerPlato)} gr
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {Math.round(totalRowCrudo)} gr
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: canCompute ? color : colors.textMuted, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {cocidoPerPlato !== null ? `${fmt1(cocidoPerPlato)} gr` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1a1a1a', borderTop: `1px solid ${colors.grayLight}` }}>
              <td style={{ padding: '8px 10px', color: colors.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                Total
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.white, fontWeight: 800 }}>
                {totalPortions}
              </td>
              <td />
              <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {Math.round(totalCrudo)} gr
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: canCompute ? color : colors.textMuted, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {canCompute ? `${Math.round(cocido)} gr` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function PincheCarousel({
  meals,
  weekKey,
  vessels = [],
}: {
  meals: PincheMeal[]
  weekKey: string
  vessels?: PincheVessel[]
}) {
  const storageKey = `pinche_${weekKey}`

  const [inputs, setInputs] = useState<PincheInputs>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as PincheInputs
    } catch {}
    return {}
  })

  const updateInput = (mealId: string, type: IngType, field: keyof SectionState, value: string) => {
    setInputs(prev => {
      const next: PincheInputs = {
        ...prev,
        [mealId]: {
          ...prev[mealId],
          [type]: { ...prev[mealId]?.[type], [field]: value },
        },
      }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const [page, setPage] = useState(0)

  if (meals.length === 0) {
    return <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay datos esta semana.</p>
  }

  const getState = (mealId: string, type: IngType): SectionState =>
    inputs[mealId]?.[type] ?? { cocido: '', sarten: '' }

  const meal = meals[page]

  return (
    <div>
      {/* Nav header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{
            width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.grayLight}`,
            background: 'transparent', color: page === 0 ? colors.textMuted : colors.white,
            fontSize: 18, cursor: page === 0 ? 'default' : 'pointer', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ color: colors.white, fontWeight: 700, fontSize: 17 }}>{meal.mealName}</div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            {meal.totalPortions} porciones · {page + 1} / {meals.length}
          </div>
        </div>
        <button
          onClick={() => setPage(p => Math.min(meals.length - 1, p + 1))}
          disabled={page === meals.length - 1}
          style={{
            width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.grayLight}`,
            background: 'transparent', color: page === meals.length - 1 ? colors.textMuted : colors.white,
            fontSize: 18, cursor: page === meals.length - 1 ? 'default' : 'pointer', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          ›
        </button>
      </div>

      {/* Meal content */}
      {ING_ORDER.map(type => (
        <IngSection
          key={`${meal.mealId}-${type}`}
          meal={meal}
          type={type}
          state={getState(meal.mealId, type)}
          onChange={(field, value) => updateInput(meal.mealId, type, field, value)}
          vessels={vessels}
        />
      ))}
    </div>
  )
}
