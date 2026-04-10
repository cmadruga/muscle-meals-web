'use client'

import React, { useEffect } from 'react'
import type { Meal, Recipe, Ingredient, Size, Unit } from '@/lib/types'
import { colors } from '@/lib/theme'
import { toGrams } from '@/lib/utils/macros'

const SECTION_LABEL: Record<string, string> = { pro: 'Proteína', carb: 'Carbohidratos', veg: 'Verdura' }
const SECTION_COLOR: Record<string, string> = { pro: '#f87171', carb: '#fbbf24', veg: '#4ade80' }

function fmt(n: number) {
  const r = Math.round(n * 10) / 10
  return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)
}

function IngRow({ name, qty, unit, calories, protein, carbs, fats, section }: {
  name: string; qty: number; unit: string; calories: number; protein: number; carbs: number; fats: number; section?: string
}) {
  const color = section ? (SECTION_COLOR[section] ?? colors.white) : colors.white
  return (
    <tr style={{ borderBottom: `1px solid ${colors.grayLight}22` }}>
      <td style={{ padding: '7px 12px', color, fontSize: 13 }}>{name}</td>
      <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13 }}>
        <span style={{ color: colors.white, fontWeight: 600 }}>{fmt(qty)}</span>
        <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 4 }}>{unit}</span>
      </td>
      <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
        {fmt(calories)} kcal
      </td>
      <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap', color: '#f87171', fontSize: 12 }}>{fmt(protein)}P</td>
      <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap', color: '#fbbf24', fontSize: 12 }}>{fmt(carbs)}C</td>
      <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap', color: '#60a5fa', fontSize: 12 }}>{fmt(fats)}G</td>
    </tr>
  )
}

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <tr>
      <td colSpan={6} style={{
        padding: '6px 12px 4px',
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        color, borderBottom: `1px solid ${color}33`,
      }}>
        {label}
      </td>
    </tr>
  )
}

interface Props {
  meal: Meal
  recipesById: Map<string, Recipe>
  ingredientsById: Map<string, Ingredient>
  selectedSize: Size
  onClose: () => void
}

export default function MealDetailModal({ meal, recipesById, ingredientsById, selectedSize, onClose }: Props) {
  const mainRecipe = recipesById.get(meal.main_recipe_id)
  const subRecipes = (meal.sub_recipe_ids ?? [])
    .map(id => recipesById.get(id))
    .filter((r): r is Recipe => !!r)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Calcular qty efectiva para ingrediente de receta principal
  function effectiveQty(qty: number, type: string | null, ingredientId: string) {
    if (type === 'pro') return (selectedSize.protein_qty[ingredientId] ?? selectedSize.protein_qty['default'] ?? 0)
    if (type === 'carb') return (selectedSize.carb_qty[ingredientId] ?? selectedSize.carb_qty['default'] ?? 0)
    if (type === 'veg') return selectedSize.veg_qty
    return qty
  }

  // Agrupar ingredientes de main recipe por sección
  const sections = mainRecipe
    ? (['pro', 'carb', 'veg', undefined] as const).map(sec => ({
        sec,
        ings: mainRecipe.ingredients.filter(ri =>
          sec === undefined ? !ri.section : ri.section === sec
        ),
      })).filter(s => s.ings.length > 0)
    : []

  // Totales
  let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0
  if (mainRecipe) {
    for (const ri of mainRecipe.ingredients) {
      const ing = ingredientsById.get(ri.ingredient_id)
      if (!ing) continue
      const qty = effectiveQty(ri.qty, ing.type, ri.ingredient_id)
      const grams = toGrams(qty, ri.unit as Unit, ing)
      totalCal  += grams * ing.calories / 100
      totalPro  += grams * ing.protein / 100
      totalCarb += grams * ing.carbs / 100
      totalFat  += grams * ing.fats / 100
    }
  }
  for (const sub of subRecipes) {
    const p = sub.portions > 0 ? sub.portions : 1
    for (const ri of sub.ingredients) {
      const ing = ingredientsById.get(ri.ingredient_id)
      if (!ing) continue
      const qty = ri.qty / p
      const grams = toGrams(qty, ri.unit as Unit, ing)
      totalCal  += grams * ing.calories / 100
      totalPro  += grams * ing.protein / 100
      totalCarb += grams * ing.carbs / 100
      totalFat  += grams * ing.fats / 100
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.grayDark, borderRadius: 14, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: `1px solid ${colors.grayLight}`,
      }}>
        {/* Header */}
        <div style={{ background: colors.orange, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <span style={{ color: colors.white, fontWeight: 700, fontSize: 16 }}>{meal.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 12 }}>
              {Math.round(totalCal)} kcal · {Math.round(totalPro)}P · {Math.round(totalCarb)}C · {Math.round(totalFat)}G · {selectedSize.name}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Main recipe */}
          {mainRecipe && (
            <div style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              <div style={{ padding: '10px 12px 4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mainRecipe.name}</span>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>CANTIDAD · CALS · P · C · G</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sections.map(({ sec, ings }, sectionIndex) => (
                    <React.Fragment key={sec ?? `section-${sectionIndex}`}>
                      {sec && <SectionDivider label={SECTION_LABEL[sec]} color={SECTION_COLOR[sec]} />}
                      {ings.map((ri, i) => {
                        const ing = ingredientsById.get(ri.ingredient_id)
                        if (!ing) return null
                        const qty = effectiveQty(ri.qty, ing.type, ri.ingredient_id)
                        const grams = toGrams(qty, ri.unit as Unit, ing)
                        const cal  = grams * ing.calories / 100
                        const pro  = grams * ing.protein / 100
                        const carb = grams * ing.carbs / 100
                        const fat  = grams * ing.fats / 100
                        return <IngRow key={`${sec ?? 'none'}-${i}`} name={ing.name} qty={qty} unit={ri.unit} calories={cal} protein={pro} carbs={carb} fats={fat} section={sec} />
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-recipes */}
          {subRecipes.map(sub => (
            <div key={sub.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              <div style={{ padding: '10px 12px 4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {sub.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>÷ {sub.portions} porc.</span>
                </span>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>CANTIDAD · CALS · P · C · G</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sub.ingredients.map((ri, i) => {
                    const ing = ingredientsById.get(ri.ingredient_id)
                    if (!ing) return null
                    const qty  = ri.qty / (sub.portions > 0 ? sub.portions : 1)
                    const grams = toGrams(qty, ri.unit as Unit, ing)
                    const cal  = grams * ing.calories / 100
                    const pro  = grams * ing.protein / 100
                    const carb = grams * ing.carbs / 100
                    const fat  = grams * ing.fats / 100
                    return <IngRow key={i} name={ing.name} qty={qty} unit={ri.unit} calories={cal} protein={pro} carbs={carb} fats={fat} />
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
