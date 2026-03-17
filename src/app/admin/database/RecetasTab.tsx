'use client'

import { useState, useTransition } from 'react'
import type { Recipe, Ingredient } from '@/lib/types'
import type { PincheVessel } from '@/lib/types/pinche-vessel'
import type { RecipeVesselConfig, SectionVesselConfig } from '@/lib/types/recipe'
import { colors } from '@/lib/theme'
import RecipeModal from './RecipeModal'
import { deleteRecipe, updateRecipeVesselConfig } from '@/app/actions/database'

const TYPE_LABEL: Record<string, string> = { main: 'Principal', sub: 'Sub-receta' }
const TYPE_COLOR: Record<string, string> = { main: colors.orange, sub: '#60a5fa' }

const SECTIONS: Array<{ key: 'pro' | 'carb' | 'veg'; label: string }> = [
  { key: 'pro', label: 'Proteína' },
  { key: 'carb', label: 'Carbo' },
  { key: 'veg', label: 'Verdura (opcional)' },
]

function VesselConfigModal({
  recipe,
  vessels,
  onClose,
}: {
  recipe: Recipe
  vessels: PincheVessel[]
  onClose: () => void
}) {
  const initial: RecipeVesselConfig = recipe.vessel_config ?? {}
  const [config, setConfig] = useState<RecipeVesselConfig>(initial)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState('')

  function setSection(section: 'pro' | 'carb' | 'veg', vesselId: string, maxGr: number, grPerCup?: number) {
    if (!vesselId) {
      setConfig(prev => {
        const next = { ...prev }
        delete next[section]
        return next
      })
      return
    }
    const vessel = vessels.find(v => v.id === vesselId)
    if (!vessel) return
    const entry: SectionVesselConfig = {
      vessel_id: vessel.id,
      vessel_name: vessel.name,
      max_gr: maxGr,
      ...(grPerCup ? { gr_per_cup: grPerCup } : {}),
    }
    setConfig(prev => ({ ...prev, [section]: entry }))
  }

  function handleSubmit() {
    setError('')
    startSave(async () => {
      const result = await updateRecipeVesselConfig(recipe.id, config)
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const modal: React.CSSProperties = {
    background: '#1a1a1a', border: `1px solid ${colors.grayLight}`, borderRadius: 12,
    padding: 28, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20,
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: colors.white, fontWeight: 700, fontSize: 16, margin: 0 }}>
            Sartenes — {recipe.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {SECTIONS.map(({ key, label }) => {
          const current = config[key]
          const selectedVesselId = current?.vessel_id ?? ''
          const maxGr = current?.max_gr ?? 0
          const grPerCup = current?.gr_per_cup ?? 0

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: colors.textSecondary ?? colors.textMuted, fontSize: 13, fontWeight: 600 }}>{label}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={selectedVesselId}
                  onChange={e => setSection(key, e.target.value, maxGr || (vessels.find(v => v.id === e.target.value)?.peso_gr ?? 0), grPerCup || undefined)}
                  style={{ flex: 2, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, color: colors.white, padding: '7px 10px', fontSize: 13 }}
                >
                  <option value="">— Sin sartén —</option>
                  {vessels.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="Max gr"
                  value={maxGr || ''}
                  disabled={!selectedVesselId}
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (selectedVesselId) setSection(key, selectedVesselId, val, grPerCup || undefined)
                  }}
                  style={{ flex: 1, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, color: selectedVesselId ? colors.white : colors.textMuted, padding: '7px 10px', fontSize: 13 }}
                />
                <span style={{ color: colors.textMuted, fontSize: 13, alignSelf: 'center' }}>gr</span>
              </div>
              {key === 'carb' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    placeholder="gr/taza (ej. 150)"
                    value={grPerCup || ''}
                    disabled={!selectedVesselId}
                    onChange={e => {
                      const val = Number(e.target.value)
                      if (selectedVesselId) setSection(key, selectedVesselId, maxGr, val || undefined)
                    }}
                    style={{ flex: 1, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, color: selectedVesselId ? colors.white : colors.textMuted, padding: '7px 10px', fontSize: 13 }}
                  />
                  <span style={{ color: colors.textMuted, fontSize: 13 }}>gr/taza</span>
                  {grPerCup > 0 && (
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>
                      (ej. 1000 g = {(1000 / grPerCup).toFixed(1)} tazas)
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {error && (
          <div style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '8px 12px', color: colors.error, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecetasTab({
  recipes: initial,
  ingredients,
  vessels,
}: {
  recipes: Recipe[]
  ingredients: Ingredient[]
  vessels: PincheVessel[]
}) {
  const [recipes, setRecipes] = useState(initial)
  const [modal, setModal] = useState<Recipe | null | 'new'>(null)
  const [showModal, setShowModal] = useState(false)
  const [vesselModal, setVesselModal] = useState<Recipe | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'main' | 'sub'>('all')
  const [deleteError, setDeleteError] = useState('')
  const [deletePending, startDelete] = useTransition()

  function handleDelete(r: Recipe) {
    setDeleteError('')
    if (!confirm(`¿Borrar "${r.name}"?`)) return
    startDelete(async () => {
      const result = await deleteRecipe(r.id)
      if (result.error) setDeleteError(result.error)
      else setRecipes((prev) => prev.filter((x) => x.id !== r.id))
    })
  }

  function handleSaved(saved: Recipe) {
    setRecipes((prev) => {
      const exists = prev.find((r) => r.id === saved.id)
      if (exists) return prev.map((r) => r.id === saved.id ? saved : r)
      return [saved, ...prev]
    })
    setShowModal(false)
  }

  const filtered = recipes.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.type === typeFilter
    return matchSearch && matchType
  })

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    border: `1px solid ${active ? colors.orange : colors.grayLight}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    fontWeight: active ? 600 : 400,
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receta…"
          style={{ flex: 1, minWidth: 160, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '7px 12px', color: colors.white, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTypeFilter('all')} style={btn(typeFilter === 'all')}>Todas</button>
          <button onClick={() => setTypeFilter('main')} style={btn(typeFilter === 'main')}>Principal</button>
          <button onClick={() => setTypeFilter('sub')} style={btn(typeFilter === 'sub')}>Sub-receta</button>
        </div>
        <button
          onClick={() => { setModal(null); setShowModal(true) }}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nueva receta
        </button>
      </div>

      {deleteError && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '10px 14px', color: colors.error, fontSize: 13, marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['Nombre', 'Tipo', 'Porciones', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: '12px', color: colors.white }}>{r.name}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: TYPE_COLOR[r.type] + '22',
                    color: TYPE_COLOR[r.type],
                    border: `1px solid ${TYPE_COLOR[r.type]}55`,
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {TYPE_LABEL[r.type]}
                  </span>
                </td>
                <td style={{ padding: '12px', color: r.type === 'sub' ? colors.textSecondary : colors.textMuted, fontSize: 13 }}>
                  {r.type === 'sub' ? `${r.portions} porc.` : '—'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setModal(r); setShowModal(true) }}
                      style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                    >
                      Editar
                    </button>
                    {r.type === 'main' && (
                      <button
                        onClick={() => setVesselModal(r)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid #60a5fa55`, background: '#60a5fa11', color: '#60a5fa', cursor: 'pointer', fontSize: 13 }}
                      >
                        Sartenes
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={deletePending}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ef444455', background: '#ef444411', color: colors.error, cursor: deletePending ? 'not-allowed' : 'pointer', fontSize: 13 }}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search || typeFilter !== 'all' ? 'Sin resultados' : 'Sin recetas'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <RecipeModal
          recipe={modal as Recipe | null}
          ingredients={ingredients}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {vesselModal && (
        <VesselConfigModal
          recipe={vesselModal}
          vessels={vessels}
          onClose={() => setVesselModal(null)}
        />
      )}
    </div>
  )
}
