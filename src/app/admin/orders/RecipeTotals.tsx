'use client'

import { useState } from 'react'
import type { MealTotal, MealIngredientRow } from '@/lib/utils/production'
import { colors } from '@/lib/theme'

function formatQty(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

function formatCups(gr: number, grPerCup: number): string {
  const cups = gr / grPerCup
  return cups % 1 === 0 ? cups.toFixed(0) : cups.toFixed(1)
}

function computeBatches(totalGr: number, maxGr: number): number {
  return maxGr > 0 ? Math.ceil(totalGr / maxGr) : 1
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

const SECTION_LABEL: Record<string, string> = { pro: 'PROTEÍNA', carb: 'CARBO', veg: 'VERDURA' }
const SECTION_COLOR: Record<string, string> = { pro: '#f87171', carb: '#fbbf24', veg: '#4ade80' }

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

  // Group main ingredients by section for split display
  const sections: Array<'pro' | 'carb' | 'veg'> = ['pro', 'carb', 'veg']
  const noSectionRows = mainIngredients.filter(i => !i.section)

  // Build section groups
  const sectionGroups: Array<{
    section: 'pro' | 'carb' | 'veg'
    rows: MealIngredientRow[]
    nBatches: number
    vesselName?: string
    grPerCup?: number
  }> = []

  for (const section of sections) {
    const rows = mainIngredients.filter(i => i.section === section)
    if (rows.length === 0) continue

    const vesselCfg = meal.vesselConfig?.[section]
    let nBatches = 1
    let vesselName: string | undefined
    let grPerCup: number | undefined

    if (vesselCfg) {
      // Find the typed ingredient (ingredientType === section) as the trigger
      const typedIng = rows.find(r => r.ingredientType === section)
      if (typedIng) {
        nBatches = computeBatches(typedIng.totalQty, vesselCfg.max_gr)
      }
      vesselName = vesselCfg.vessel_name
      grPerCup = vesselCfg.gr_per_cup
    }

    sectionGroups.push({ section, rows, nBatches, vesselName, grPerCup })
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
            {sectionGroups.map(({ section, rows, nBatches, vesselName, grPerCup }) => {
              const sectionColor = SECTION_COLOR[section]
              const label = SECTION_LABEL[section]
              const hasCups = (ing: MealIngredientRow) => grPerCup && grPerCup > 0 && ing.ingredientType === section

              return (
                <>
                  {nBatches > 1 && (
                    <tr key={`sep_${section}`}>
                      <td colSpan={2} style={{
                        padding: '6px 16px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: sectionColor,
                        background: sectionColor + '18',
                        borderTop: `1px solid ${sectionColor}44`,
                        borderBottom: `1px solid ${sectionColor}44`,
                        letterSpacing: '0.05em',
                      }}>
                        ── {label}{vesselName ? ` · ${vesselName}` : ''} · {nBatches} tandas ──
                      </td>
                    </tr>
                  )}
                  {rows.map((ing) => (
                    <tr key={ing.key} style={{ borderLeft: `3px solid ${sectionColor}44` }}>
                      <td style={{ padding: '9px 16px', color: sectionColor }}>{ing.name}</td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {nBatches > 1 ? (
                          <>
                            <span style={{ color: colors.white, fontWeight: 700 }}>
                              {formatQty(ing.totalQty / nBatches)}
                            </span>
                            <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{ing.unit}</span>
                            {hasCups(ing) && (
                              <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 4 }}>
                                ({formatCups(ing.totalQty / nBatches, grPerCup!)} tazas)
                              </span>
                            )}
                            <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 8 }}>
                              (total: {formatQty(ing.totalQty)} {ing.unit}{hasCups(ing) ? ` / ${formatCups(ing.totalQty, grPerCup!)} tazas` : ''})
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: colors.white, fontWeight: 600 }}>{formatQty(ing.totalQty)}</span>
                            <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{ing.unit}</span>
                            {hasCups(ing) && (
                              <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>
                                ({formatCups(ing.totalQty, grPerCup!)} tazas)
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}

            {noSectionRows.map((ing) => (
              <tr key={ing.key} style={{ borderLeft: '3px solid transparent' }}>
                <td style={{ padding: '9px 16px', color: colors.white }}>{ing.name}</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ color: colors.white, fontWeight: 600 }}>{formatQty(ing.totalQty)}</span>
                  <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{ing.unit}</span>
                </td>
              </tr>
            ))}

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
