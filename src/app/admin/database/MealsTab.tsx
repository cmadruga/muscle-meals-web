'use client'

import { useState, useTransition, useMemo } from 'react'
import type { Meal, Recipe, Ingredient, Size } from '@/lib/types'
import { colors } from '@/lib/theme'
import { toggleMealActive, deleteMeal } from '@/app/actions/database'
import { calculateMealMacros } from '@/lib/utils/macros'
import MealModal from './MealModal'
import MealDetailModal from './MealDetailModal'

function ActiveSwitch({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Activo — click para desactivar' : 'Inactivo — click para activar'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 0,
      }}
    >
      <div style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: active ? '#22c55e' : colors.grayLight,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 3,
          left: active ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: colors.white,
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 12, color: active ? '#22c55e' : colors.textMuted }}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    </button>
  )
}

export default function MealsTab({ meals: initial, recipes, ingredients, mainSizes }: {
  meals: Meal[]
  recipes: Recipe[]
  ingredients: Ingredient[]
  mainSizes: Size[]
}) {
  const [meals, setMeals] = useState(initial)
  const [modalMeal, setModalMeal] = useState<Meal | null | 'new'>(null)
  const [detailMeal, setDetailMeal] = useState<Meal | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState(mainSizes[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [, startToggle] = useTransition()
  const [, startDelete] = useTransition()

  const mainRecipes = recipes.filter((r) => r.type === 'main')
  const subRecipes = recipes.filter((r) => r.type === 'sub')

  const selectedSize = mainSizes.find(s => s.id === selectedSizeId)

  const recipesById = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes])
  const ingredientsById = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients])

  // Precalcular macros por meal para el size seleccionado
  const macrosMap = useMemo(() => {
    if (!selectedSize) return new Map<string, { calories: number; protein: number; carbs: number; fats: number }>()
    const recipesById = new Map(recipes.map(r => [r.id, r]))
    const ingredientsMap = new Map(ingredients.map(i => [i.id, i]))
    const result = new Map<string, { calories: number; protein: number; carbs: number; fats: number }>()
    for (const meal of meals) {
      const mainRecipe = recipesById.get(meal.main_recipe_id)
      if (!mainRecipe) continue
      const subs = (meal.sub_recipe_ids ?? []).map(id => recipesById.get(id)).filter((r): r is Recipe => !!r)
      result.set(meal.id, calculateMealMacros(mainRecipe, subs, ingredientsMap, selectedSize))
    }
    return result
  }, [meals, recipes, ingredients, selectedSize])

  function handleToggle(meal: Meal) {
    // optimistic update
    setMeals((prev) => prev.map((m) => m.id === meal.id ? { ...m, active: !m.active } : m))
    startToggle(async () => {
      const result = await toggleMealActive(meal.id, !meal.active)
      if (result.error) {
        // rollback
        setMeals((prev) => prev.map((m) => m.id === meal.id ? { ...m, active: meal.active } : m))
      }
    })
  }

  function handleDelete(meal: Meal) {
    if (!confirm(`¿Borrar "${meal.name}"? Esta acción no se puede deshacer.`)) return
    startDelete(async () => {
      const result = await deleteMeal(meal.id)
      if (!result.error) {
        setMeals((prev) => prev.filter((m) => m.id !== meal.id))
      }
    })
  }

  const filtered = meals.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? m.active : !m.active)
    return matchSearch && matchStatus
  })

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? colors.orange : colors.grayLight}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Buscador */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar platillo…"
          style={{
            flex: 1,
            minWidth: 160,
            background: colors.grayDark,
            border: `1px solid ${colors.grayLight}`,
            borderRadius: 8,
            padding: '7px 12px',
            color: colors.white,
            fontSize: 14,
          }}
        />

        {/* Filtros estado */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setStatusFilter('all')} style={filterBtnStyle(statusFilter === 'all')}>Todos</button>
          <button onClick={() => setStatusFilter('active')} style={filterBtnStyle(statusFilter === 'active')}>Activos</button>
          <button onClick={() => setStatusFilter('inactive')} style={filterBtnStyle(statusFilter === 'inactive')}>Inactivos</button>
        </div>

        <button
          onClick={() => setModalMeal('new')}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nuevo platillo
        </button>
      </div>

      {/* Toggle sizes */}
      {mainSizes.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ color: colors.textMuted, fontSize: 12 }}>Macros para:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {mainSizes.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSizeId(s.id)}
                style={{
                  padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: s.id === selectedSizeId ? 700 : 400,
                  border: `1px solid ${s.id === selectedSizeId ? colors.orange : colors.grayLight}`,
                  background: s.id === selectedSizeId ? colors.orange + '22' : 'transparent',
                  color: s.id === selectedSizeId ? colors.orange : colors.textMuted,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['', 'Nombre', 'Descripción', 'Macros', 'Estado', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((meal) => {
              const m = macrosMap.get(meal.id)
              return (
                <tr key={meal.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px 12px', width: 56 }}>
                    {meal.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meal.img} alt={meal.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: colors.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, fontSize: 10 }}>
                        sin img
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: colors.white, fontWeight: 600 }}>{meal.name}</td>
                  <td style={{ padding: '10px 12px', color: colors.textSecondary, maxWidth: 220 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {meal.description ?? '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {m ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: colors.orange, fontWeight: 700, fontSize: 13 }}>{Math.round(m.calories)} kcal</span>
                        <span style={{ color: colors.textMuted, fontSize: 11 }}>
                          P {Math.round(m.protein)}g · C {Math.round(m.carbs)}g · G {Math.round(m.fats)}g
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: colors.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <ActiveSwitch active={meal.active} onClick={() => handleToggle(meal)} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setDetailMeal(meal)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 13 }}
                      >
                        Detalle
                      </button>
                      <button
                        onClick={() => setModalMeal(meal)}
                        style={{ padding: '4px 14px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(meal)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid #ef444455`, background: '#ef444411', color: colors.error, cursor: 'pointer', fontSize: 13 }}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search || statusFilter !== 'all' ? 'Sin resultados' : 'Sin platillos'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMeal !== null && (
        <MealModal
          meal={modalMeal === 'new' ? undefined : modalMeal}
          mainRecipes={mainRecipes}
          subRecipes={subRecipes}
          onClose={() => setModalMeal(null)}
          onSaved={(updated) => {
            setMeals((prev) =>
              updated.id
                ? prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m)
                : [...prev, updated]
            )
            setModalMeal(null)
          }}
        />
      )}

      {detailMeal && selectedSize && (
        <MealDetailModal
          meal={detailMeal}
          recipesById={recipesById}
          ingredientsById={ingredientsById}
          selectedSize={selectedSize}
          onClose={() => setDetailMeal(null)}
        />
      )}
    </div>
  )
}
