'use client'

import { useState, useTransition } from 'react'
import type { Ingredient, IngredientType } from '@/lib/types'
import { colors } from '@/lib/theme'
import { deleteIngredient } from '@/app/actions/database'
import { IngredientModal } from './IngredientModal'

const TYPE_LABEL: Record<string, string> = { pro: 'Proteína', carb: 'Carbo', veg: 'Verdura' }
const TYPE_COLOR: Record<string, string> = { pro: '#ef4444', carb: '#eab308', veg: '#22c55e' }

function TypeBadge({ type }: { type: IngredientType | null }) {
  if (!type) {
    return (
      <span style={{ background: '#33333388', color: colors.textMuted, border: `1px solid ${colors.grayLight}`, borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
        Fijo
      </span>
    )
  }
  return (
    <span style={{ background: TYPE_COLOR[type] + '22', color: TYPE_COLOR[type], border: `1px solid ${TYPE_COLOR[type]}55`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
      {TYPE_LABEL[type]}
    </span>
  )
}

export default function IngredientesTab({ ingredients: initial }: { ingredients: Ingredient[] }) {
  const [modal, setModal] = useState<Ingredient | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string>('')
  const [deletePending, startDelete] = useTransition()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'pro' | 'carb' | 'veg' | 'fijo'>('all')

  function openNew() {
    setModal(null)
    setShowModal(true)
  }

  function openEdit(ing: Ingredient) {
    setModal(ing)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    // Refresh list via server revalidation — page will re-render via Next.js
  }

  function handleDelete(ing: Ingredient) {
    setDeleteError('')
    if (!confirm(`¿Borrar "${ing.name}"?`)) return
    startDelete(async () => {
      const result = await deleteIngredient(ing.id)
      if (result.error) {
        setDeleteError(result.error)
      }
    })
  }

  const filtered = initial.filter((ing) => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all'
      || (typeFilter === 'fijo' ? ing.type === null : ing.type === typeFilter)
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
          placeholder="Buscar ingrediente…"
          style={{ flex: 1, minWidth: 160, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '7px 12px', color: colors.white, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setTypeFilter('all')} style={btn(typeFilter === 'all')}>Todos</button>
          <button onClick={() => setTypeFilter('pro')} style={btn(typeFilter === 'pro')}>Proteína</button>
          <button onClick={() => setTypeFilter('carb')} style={btn(typeFilter === 'carb')}>Carbo</button>
          <button onClick={() => setTypeFilter('veg')} style={btn(typeFilter === 'veg')}>Verdura</button>
          <button onClick={() => setTypeFilter('fijo')} style={btn(typeFilter === 'fijo')}>Fijo</button>
        </div>
        <button
          onClick={openNew}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nuevo ingrediente
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
              {['Nombre', 'Tipo', 'Cal', 'Prot', 'Carbs', 'Grasas', 'Cant', 'Precio', '$/und', 'Proveedor', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => (
              <tr key={ing.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ color: colors.white }}>{ing.name}</div>
                  {ing.public_name && <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{ing.public_name}</div>}
                </td>
                <td style={{ padding: '12px' }}><TypeBadge type={ing.type} /></td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.calories}</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.protein}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.carbs}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.fats}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.cant} {ing.unit}</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>${ing.precio.toFixed(2)}</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>${ing.precio_por_unidad.toFixed(4)}</td>
                <td style={{ padding: '12px', color: colors.textMuted, fontSize: 13 }}>{ing.proveedor ?? '—'}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEdit(ing)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ing)}
                      disabled={deletePending}
                      style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid #ef444455`, background: '#ef444411', color: colors.error, cursor: 'pointer', fontSize: 13 }}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search || typeFilter !== 'all' ? 'Sin resultados' : 'Sin ingredientes'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <IngredientModal ingredient={modal as Ingredient | null} onClose={closeModal} />
      )}
    </div>
  )
}
