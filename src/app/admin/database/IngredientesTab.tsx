'use client'

import { useState, useTransition } from 'react'
import type { Ingredient, IngredientType, Unit } from '@/lib/types'
import { colors } from '@/lib/theme'
import {
  createIngredient,
  updateIngredient,
  deleteIngredient,
  type IngredientFormData,
} from '@/app/actions/database'

const TYPE_LABEL: Record<string, string> = { pro: 'Proteína', carb: 'Carbo', veg: 'Verdura' }
const TYPE_COLOR: Record<string, string> = { pro: '#ef4444', carb: '#eab308', veg: '#22c55e' }

const UNITS: Unit[] = ['g', 'ml', 'pz', 'tsp', 'tbsp']
const TYPES: Array<IngredientType | 'fijo'> = ['pro', 'carb', 'veg', 'fijo']

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

const emptyForm = (): IngredientFormData => ({
  name: '',
  type: null,
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  unit: 'g',
})

function toForm(ing: Ingredient): IngredientFormData {
  return {
    name: ing.name,
    type: ing.type,
    calories: ing.calories,
    protein: ing.protein,
    carbs: ing.carbs,
    fats: ing.fats,
    unit: ing.unit,
  }
}

interface ModalProps {
  ingredient: Ingredient | null // null = crear nuevo
  onClose: () => void
}

function IngredientModal({ ingredient, onClose }: ModalProps) {
  const [form, setForm] = useState<IngredientFormData>(
    ingredient ? toForm(ingredient) : emptyForm()
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function set<K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = ingredient
        ? await updateIngredient(ingredient.id, form)
        : await createIngredient(form)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: colors.grayDark,
    border: `1px solid ${colors.grayLight}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: colors.white,
    fontSize: 14,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: colors.grayDark, borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 480, border: `1px solid ${colors.grayLight}`
      }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          {ingredient ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              style={inputStyle}
              value={form.type ?? 'fijo'}
              onChange={(e) => set('type', e.target.value === 'fijo' ? null : e.target.value as IngredientType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t === 'fijo' ? 'Fijo (sin ajuste)' : TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['calories', 'protein', 'carbs', 'fats'] as const).map((key) => (
              <div key={key}>
                <label style={labelStyle}>{key === 'calories' ? 'Calorías' : key === 'protein' ? 'Proteína' : key === 'carbs' ? 'Carbos' : 'Grasas'}</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form[key]}
                  onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Unidad</label>
            <select style={inputStyle} value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || !form.name.trim()}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
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
              {['Nombre', 'Tipo', 'Cal', 'Prot', 'Carbs', 'Grasas', 'Unidad', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => (
              <tr key={ing.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: '12px', color: colors.white }}>{ing.name}</td>
                <td style={{ padding: '12px' }}><TypeBadge type={ing.type} /></td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.calories}</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.protein}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.carbs}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.fats}g</td>
                <td style={{ padding: '12px', color: colors.textSecondary }}>{ing.unit}</td>
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
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
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
