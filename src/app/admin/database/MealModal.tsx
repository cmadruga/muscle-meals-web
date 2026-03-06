'use client'

import { useState, useTransition } from 'react'
import type { Recipe } from '@/lib/types'
import { colors } from '@/lib/theme'
import { createMeal } from '@/app/actions/database'

// Combobox reutilizado del mismo patrón que RecipeModal
function RecipeCombobox({
  value,
  onChange,
  recipes,
}: {
  value: string
  onChange: (id: string) => void
  recipes: Recipe[]
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = recipes.find((r) => r.id === value)
  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={open ? search : (selected?.name ?? '')}
        placeholder="Buscar receta principal…"
        onFocus={() => { setOpen(true); setSearch('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: colors.black,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          padding: '8px 12px',
          color: colors.white,
          fontSize: 14,
          boxSizing: 'border-box',
          outline: open ? `2px solid ${colors.orange}` : 'none',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, zIndex: 200, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 13 }}>Sin resultados</div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                onMouseDown={() => { onChange(r.id); setOpen(false) }}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                  color: r.id === value ? colors.orange : colors.white,
                  background: r.id === value ? colors.orange + '15' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.grayLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = r.id === value ? colors.orange + '15' : 'transparent')}
              >
                {r.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface MealModalProps {
  mainRecipes: Recipe[]
  subRecipes: Recipe[]
  onClose: () => void
  onSaved: () => void
}

export default function MealModal({ mainRecipes, subRecipes, onClose, onSaved }: MealModalProps) {
  const [mainRecipeId, setMainRecipeId] = useState('')
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [saving, startSave] = useTransition()

  const selectedMain = mainRecipes.find((r) => r.id === mainRecipeId)

  function toggleSub(id: string) {
    setSelectedSubs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSave() {
    if (!mainRecipeId) return setError('Selecciona una receta principal')
    setError('')
    startSave(async () => {
      const result = await createMeal(mainRecipeId, [...selectedSubs])
      if (result.error) {
        setError(result.error)
      } else {
        onSaved()
        onClose()
      }
    })
  }

  const labelStyle: React.CSSProperties = { color: colors.textMuted, fontSize: 12, marginBottom: 6, display: 'block' }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: colors.grayDark, borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 480, border: `1px solid ${colors.grayLight}`,
      }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          Nuevo platillo
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Receta principal */}
          <div>
            <label style={labelStyle}>Receta principal</label>
            <RecipeCombobox
              value={mainRecipeId}
              onChange={setMainRecipeId}
              recipes={mainRecipes}
            />
            {selectedMain && (
              <p style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                El platillo se llamará: <strong style={{ color: colors.white }}>{selectedMain.name}</strong>
              </p>
            )}
          </div>

          {/* Sub-recetas */}
          {subRecipes.length > 0 && (
            <div>
              <label style={labelStyle}>Sub-recetas (opcional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {subRecipes.map((r) => (
                  <label
                    key={r.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: selectedSubs.has(r.id) ? colors.orange + '15' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubs.has(r.id)}
                      onChange={() => toggleSub(r.id)}
                      style={{ accentColor: colors.orange, width: 16, height: 16 }}
                    />
                    <span style={{ color: colors.white, fontSize: 13 }}>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Guardando…' : 'Crear platillo'}
          </button>
        </div>
      </div>
    </div>
  )
}
