'use client'

import { useState } from 'react'
import type { Recipe, Ingredient } from '@/lib/types'
import { colors } from '@/lib/theme'
import RecipeModal from './RecipeModal'

const TYPE_LABEL: Record<string, string> = { main: 'Principal', sub: 'Sub-receta' }
const TYPE_COLOR: Record<string, string> = { main: colors.orange, sub: '#60a5fa' }

export default function RecetasTab({
  recipes: initial,
  ingredients,
}: {
  recipes: Recipe[]
  ingredients: Ingredient[]
}) {
  const [recipes, setRecipes] = useState(initial)
  const [modal, setModal] = useState<Recipe | null | 'new'>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'main' | 'sub'>('all')

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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['Nombre', 'Tipo', ''].map((h) => (
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
                {/* <td style={{ padding: '12px', color: colors.textSecondary }}>
                  {r.ingredients.length} ingrediente{r.ingredients.length !== 1 ? 's' : ''}
                </td> */}
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => { setModal(r); setShowModal(true) }}
                    style={{ padding: '4px 14px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
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
    </div>
  )
}
