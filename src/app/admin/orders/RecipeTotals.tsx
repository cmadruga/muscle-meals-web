'use client'

import { useState } from 'react'
import type { MealTotal } from '@/lib/utils/production'
import { colors } from '@/lib/theme'

function formatQty(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

function SizeBreakdown({ portionsBySize }: { portionsBySize: Record<string, number> }) {
  const entries = Object.entries(portionsBySize).sort((a, b) => a[0].localeCompare(b[0]))
  if (entries.length === 0) return null
  return (
    <span style={{ fontSize: 12, opacity: 0.85 }}>
      {entries.map(([size, qty], i) => (
        <span key={size}>
          {i > 0 && <span style={{ opacity: 0.5 }}> · </span>}
          <strong>{size}</strong> {qty}
        </span>
      ))}
    </span>
  )
}

function RecipePanel({ mealTotals }: { mealTotals: MealTotal[] }) {
  const [selectedId, setSelectedId] = useState<string>(mealTotals[0]?.mealId ?? '')
  const meal = mealTotals.find(m => m.mealId === selectedId) ?? mealTotals[0]

  const mainIngredients = meal.ingredients.filter(i => !i.isSubRecipe)
  const subIngredients = meal.ingredients.filter(i => i.isSubRecipe)

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 16px',
    color: colors.textMuted,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${colors.grayLight}`,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Select */}
      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        style={{
          background: colors.grayDark,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          color: colors.white,
          padding: '9px 14px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {mealTotals.map(m => (
          <option key={m.mealId} value={m.mealId}>
            {m.mealName}
          </option>
        ))}
      </select>

      {/* Card */}
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: colors.orange, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ color: colors.white, fontWeight: 700, fontSize: 15 }}>
            {meal.mealName}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            {meal.totalPortions} porciones
          </span>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Ingrediente</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {mainIngredients.map((ing) => {
              const sectionColor = ing.section === 'pro' ? '#f87171' : ing.section === 'carb' ? '#fbbf24' : ing.section === 'veg' ? '#4ade80' : undefined
              return (
                <tr key={ing.key} style={{ borderLeft: sectionColor ? `3px solid ${sectionColor}44` : '3px solid transparent' }}>
                  <td style={{ padding: '9px 16px', color: sectionColor ?? colors.white }}>{ing.name}</td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ color: colors.white, fontWeight: 600 }}>{formatQty(ing.totalQty)}</span>
                    <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{ing.unit}</span>
                  </td>
                </tr>
              )
            })}

            {subIngredients.length > 0 && (
              <>
                <tr>
                  <td colSpan={2} style={{ padding: '7px 16px', color: colors.textMuted, fontSize: 11, fontStyle: 'italic', borderTop: `1px solid ${colors.grayLight}`, borderBottom: `1px solid ${colors.grayLight}`, textAlign: 'center' }}>
                    — Salsa / Sub-receta —
                  </td>
                </tr>
                {subIngredients.map((ing, i) => (
                  <tr key={ing.key} style={{ background: i % 2 === 0 ? 'transparent' : '#1a1a1a' }}>
                    <td style={{ padding: '9px 16px', color: colors.white }}>{ing.name}</td>
                    <td style={{ padding: '9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ color: colors.white, fontWeight: 600 }}>{formatQty(ing.totalQty)}</span>
                      <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{ing.unit}</span>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function RecipeTotals({ mealTotals }: { mealTotals: MealTotal[] }) {
  if (mealTotals.length === 0) {
    return <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay datos esta semana.</p>
  }

  return (
    <>
      <style>{`
        .recipe-panels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .recipe-panels { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="recipe-panels">
        <RecipePanel mealTotals={mealTotals} />
        <RecipePanel mealTotals={mealTotals} />
      </div>
    </>
  )
}
