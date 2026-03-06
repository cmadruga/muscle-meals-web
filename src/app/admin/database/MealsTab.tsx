'use client'

import { useState, useTransition, useRef } from 'react'
import type { Meal, Recipe } from '@/lib/types'
import { colors } from '@/lib/theme'
import { updateMeal, toggleMealActive, uploadMealImage, deleteMeal } from '@/app/actions/database'
import MealModal from './MealModal'

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

interface EditModalProps {
  meal: Meal
  onClose: () => void
  onSaved: (updated: Pick<Meal, 'id' | 'name' | 'description' | 'img'>) => void
}

function EditModal({ meal, onClose, onSaved }: EditModalProps) {
  const [name, setName] = useState(meal.name)
  const [description, setDescription] = useState(meal.description ?? '')
  const [imgUrl, setImgUrl] = useState(meal.img ?? '')
  const [preview, setPreview] = useState(meal.img ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadMealImage(meal.id, fd)

    if (result.error) {
      setError(`Error al subir imagen: ${result.error}`)
      setUploading(false)
      return
    }

    setImgUrl(result.publicUrl!)
    setPreview(result.publicUrl!)
    setUploading(false)
  }

  function handleSave() {
    setError('')
    startSave(async () => {
      const result = await updateMeal(meal.id, {
        name: name.trim(),
        description: description.trim() || null,
        img: imgUrl || null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSaved({ id: meal.id, name: name.trim(), description: description.trim() || null, img: imgUrl || null })
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
  const labelStyle: React.CSSProperties = { color: colors.textMuted, fontSize: 12, marginBottom: 4, display: 'block' }

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
          Editar platillo
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Imagen</label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 10, display: 'block' }}
              />
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
            >
              {uploading ? 'Subiendo…' : 'Subir imagen'}
            </button>
          </div>
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
            disabled={saving || uploading || !name.trim()}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MealsTab({ meals: initial, recipes }: { meals: Meal[]; recipes: Recipe[] }) {
  const [meals, setMeals] = useState(initial)
  const [editMeal, setEditMeal] = useState<Meal | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [, startToggle] = useTransition()
  const [, startDelete] = useTransition()

  const mainRecipes = recipes.filter((r) => r.type === 'main')
  const subRecipes = recipes.filter((r) => r.type === 'sub')

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
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nuevo platillo
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['', 'Nombre', 'Descripción', 'Estado', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((meal) => (
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
                <td style={{ padding: '10px 12px', color: colors.textSecondary, maxWidth: 260 }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {meal.description ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <ActiveSwitch active={meal.active} onClick={() => handleToggle(meal)} />
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditMeal(meal)}
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search || statusFilter !== 'all' ? 'Sin resultados' : 'Sin platillos'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editMeal && (
        <EditModal
          meal={editMeal}
          onClose={() => setEditMeal(null)}
          onSaved={(updated) => {
            setMeals((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m))
            setEditMeal(null)
          }}
        />
      )}

      {showCreate && (
        <MealModal
          mainRecipes={mainRecipes}
          subRecipes={subRecipes}
          onClose={() => setShowCreate(false)}
          onSaved={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
