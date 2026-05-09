'use client'

import { useState, useRef } from 'react'
import type { EmpaquesMeal } from '@/lib/utils/production'
import { colors } from '@/lib/theme'

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '8px 10px',
  color: colors.textMuted,
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  borderBottom: `1px solid ${colors.grayLight}`,
  whiteSpace: 'nowrap',
}

export default function EmpaqueCarousel({ meals }: { meals: EmpaquesMeal[] }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (meals.length === 0) {
    return <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay datos esta semana.</p>
  }

  const meal = meals[idx]
  const hasPrev = idx > 0
  const hasNext = idx < meals.length - 1

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50 && hasNext) setIdx(i => i + 1)
    else if (delta < -50 && hasPrev) setIdx(i => i - 1)
    touchStartX.current = null
  }

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    background: enabled ? colors.orange : colors.grayDark,
    border: `1px solid ${enabled ? colors.orange : colors.grayLight}`,
    borderRadius: 8,
    color: enabled ? colors.white : colors.textMuted,
    width: 36,
    height: 36,
    cursor: enabled ? 'pointer' : 'default',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })

  return (
    <div>
      {/* Carousel nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button style={btnStyle(hasPrev)} onClick={() => hasPrev && setIdx(i => i - 1)} disabled={!hasPrev}>
          ‹
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ color: colors.white, fontWeight: 700, fontSize: 17 }}>{meal.mealName}</div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            {idx + 1} de {meals.length} · {meal.totalPortions} porciones
          </div>
        </div>

        <button style={btnStyle(hasNext)} onClick={() => hasNext && setIdx(i => i + 1)} disabled={!hasNext}>
          ›
        </button>
      </div>

      {/* Dots */}
      {meals.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {meals.map((m, i) => (
            <button
              key={m.mealId}
              onClick={() => setIdx(i)}
              title={m.mealName}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: i === idx ? colors.orange : colors.grayLight,
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Table — swipeable */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, overflow: 'hidden', touchAction: 'pan-y', overflowX: 'auto' }}
      >
        {/* Header */}
        <div style={{ background: colors.orange, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: colors.white, fontWeight: 700, fontSize: 15 }}>{meal.mealName}</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{meal.totalPortions} porciones</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 1 }}>Cant.</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Versión</th>
              <th style={thStyle}>Cals</th>
              <th style={thStyle}>Prot</th>
              <th style={thStyle}>Carbs</th>
              <th style={thStyle}>Grasas</th>
            </tr>
          </thead>
          <tbody>
            {meal.sizes.map((row, i) => (
              <tr key={row.sizeId} style={{ background: i % 2 === 0 ? '#1e1e1e' : '#141414', borderBottom: `1px solid #2a2a2a` }}>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: colors.white, fontWeight: 800, whiteSpace: 'nowrap', width: 1 }}>
                  {row.qty}
                </td>
                <td style={{ padding: '9px 10px', color: row.isExtra ? colors.textMuted : row.isMain ? colors.white : colors.orange, fontWeight: 600, whiteSpace: 'nowrap', fontStyle: row.isExtra ? 'italic' : 'normal' }}>
                  {row.sizeName}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {row.macros ? Math.round(row.macros.calories) : '—'}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {row.macros ? Math.round(row.macros.protein) : '—'}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {row.macros ? Math.round(row.macros.carbs) : '—'}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {row.macros ? Math.round(row.macros.fats) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
