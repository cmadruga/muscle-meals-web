'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { Ingredient, Recipe, RecipeType } from '@/lib/types'
import { colors } from '@/lib/theme'
import { createRecipe, updateRecipe, type RecipeIngredientInput } from '@/app/actions/database'
import { IngredientModal } from './IngredientModal'

// ─── Combobox ─────────────────────────────────────────────────────────────────

function IngredientCombobox({
  value,
  onChange,
  ingredients,
}: {
  value: string
  onChange: (id: string) => void
  ingredients: Ingredient[]
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = ingredients.find((i) => i.id === value)
  const filtered = search
    ? ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : ingredients

  function handleFocus() {
    const rect = inputRef.current?.getBoundingClientRect()
    if (rect) {
      setDropStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        background: colors.grayDark,
        border: `1px solid ${colors.grayLight}`,
        borderRadius: 8,
        zIndex: 9999,
        maxHeight: 360,
        overflowY: 'auto',
        boxShadow: '0 8px 24px #00000066',
      })
    }
    setOpen(true)
    setSearch('')
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <input
        ref={inputRef}
        value={open ? search : (selected?.name ?? '')}
        placeholder="Buscar ingrediente…"
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: colors.black,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          padding: '8px 10px',
          color: colors.white,
          fontSize: 13,
          boxSizing: 'border-box',
          outline: open ? `2px solid ${colors.orange}` : 'none',
        }}
      />
      {open && (
        <div style={dropStyle}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 13 }}>Sin resultados</div>
          ) : (
            filtered.map((ing) => (
              <div
                key={ing.id}
                onMouseDown={() => { onChange(ing.id); setOpen(false) }}
                style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: ing.id === value ? colors.orange : colors.white, background: ing.id === value ? colors.orange + '15' : 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.grayLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ing.id === value ? colors.orange + '15' : 'transparent')}
              >
                {ing.name}
                <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>{ing.unit}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fila de ingrediente ──────────────────────────────────────────────────────

type Section = 'pro' | 'carb' | 'veg'
interface IngRow extends RecipeIngredientInput { _key: number; _section: Section }

function IngredientRow({
  row, ingredients, onChange, onRemove, onClickAdd,
}: {
  row: IngRow
  ingredients: Ingredient[]
  onChange: (updated: IngRow) => void
  onRemove: () => void
  onClickAdd: () => void
}) {
  const ing = ingredients.find((i) => i.id === row.ingredient_id)

  function handleIngredientChange(id: string) {
    const found = ingredients.find((i) => i.id === id)
    onChange({ ...row, ingredient_id: id, unit: found?.unit ?? 'g' })
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IngredientCombobox value={row.ingredient_id} onChange={handleIngredientChange} ingredients={ingredients} />
      <button
        onClick={onClickAdd}
        title="Crear ingrediente"
        style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.orange, cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        +
      </button>
      <input
        type="number" min={0} value={row.qty}
        onChange={(e) => onChange({ ...row, qty: parseFloat(e.target.value) || 0 })}
        style={{ width: 80, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 8px', color: colors.white, fontSize: 13, textAlign: 'right' }}
      />
      <span style={{ color: colors.textMuted, fontSize: 13, width: 36, flexShrink: 0 }}>{ing?.unit ?? '—'}</span>
      <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>✕</button>
    </div>
  )
}

// ─── Sección ─────────────────────────────────────────────────────────────────

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'pro',  label: 'Proteína' },
  { key: 'carb', label: 'Carbohidratos' },
  { key: 'veg',  label: 'Verdura' },
]

function IngredientSection({
  label, rows, ingredients,
  onAdd, onUpdate, onRemove, onClickAdd,
}: {
  label: string
  rows: IngRow[]
  ingredients: Ingredient[]
  onAdd: () => void
  onUpdate: (key: number, updated: IngRow) => void
  onRemove: (key: number) => void
  onClickAdd: (key: number) => void
}) {
  return (
    <div style={{ border: `1px solid ${colors.grayLight}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#ffffff08', borderBottom: `1px solid ${colors.grayLight}`, padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.textMuted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ color: colors.textMuted, fontSize: 11 }}>qty · unidad</span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row) => (
          <IngredientRow
            key={row._key}
            row={row}
            ingredients={ingredients}
            onChange={(updated) => onUpdate(row._key, updated)}
            onRemove={() => onRemove(row._key)}
            onClickAdd={() => onClickAdd(row._key)}
          />
        ))}
        <button
          onClick={onAdd}
          style={{ padding: '7px 0', borderRadius: 8, border: `1px dashed ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 13 }}
        >
          + Agregar ingrediente
        </button>
      </div>
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────

let keyCounter = 0

function toRows(ings: Recipe['ingredients']): IngRow[] {
  return ings.map((ri) => ({
    ...ri,
    _key: ++keyCounter,
    _section: (ri.section as Section) ?? 'pro',
  }))
}

interface RecipeModalProps {
  recipe: Recipe | null
  ingredients: Ingredient[]
  onClose: () => void
  onSaved: (recipe: Recipe) => void
}

export default function RecipeModal({ recipe, ingredients, onClose, onSaved }: RecipeModalProps) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [type, setType] = useState<RecipeType>(recipe?.type ?? 'main')
  const [portions, setPortions] = useState(recipe?.portions ?? 1)
  const [rows, setRows] = useState<IngRow[]>(recipe ? toRows(recipe.ingredients) : [])
  const [showCreate, setShowCreate] = useState(false)
  const [pendingRowKey, setPendingRowKey] = useState<number | null>(null)
  const [allIngredients, setAllIngredients] = useState(ingredients)
  const [error, setError] = useState('')
  const [saving, startSave] = useTransition()

  function addRow(section: Section) {
    setRows((prev) => [...prev, { _key: ++keyCounter, ingredient_id: '', qty: 100, unit: 'g', _section: section }])
  }

  function updateRow(key: number, updated: IngRow) {
    setRows((prev) => prev.map((r) => r._key === key ? updated : r))
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r._key !== key))
  }

  function openCreateFor(key: number) {
    setPendingRowKey(key)
    setShowCreate(true)
  }

  function handleIngredientCreated(ing: Ingredient) {
    setAllIngredients((prev) => [...prev, ing])
    if (pendingRowKey !== null) {
      setRows((prev) => prev.map((r) => r._key === pendingRowKey ? { ...r, ingredient_id: ing.id, unit: ing.unit } : r))
    }
    setShowCreate(false)
    setPendingRowKey(null)
  }

  function handleSave() {
    setError('')
    const validRows = rows.filter((r) => r.ingredient_id)
    if (!name.trim()) return setError('El nombre es requerido')
    if (validRows.length === 0) return setError('Agrega al menos un ingrediente')

    const data = {
      name: name.trim(), type,
      portions: type === 'sub' ? (portions > 0 ? portions : 1) : 1,
      ingredients: validRows.map(({ ingredient_id, qty, unit, _section }) => ({
        ingredient_id, qty, unit,
        ...(type === 'main' ? { section: _section } : {}),
      })),
    }

    startSave(async () => {
      const result = recipe ? await updateRecipe(recipe.id, data) : await createRecipe(data)
      if (result.error) {
        setError(result.error)
      } else {
        onSaved({ id: recipe?.id ?? '', name: data.name, type: data.type, ingredients: data.ingredients, description: recipe?.description ?? null, created_at: recipe?.created_at ?? new Date().toISOString() })
        onClose()
      }
    })
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 12px', color: colors.white, fontSize: 14, boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { color: colors.textMuted, fontSize: 12, marginBottom: 6, display: 'block' }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: colors.grayDark, borderRadius: 12, padding: 32, width: '100%', maxWidth: 680, border: `1px solid ${colors.grayLight}`, maxHeight: '92vh', overflowY: 'auto' }}>
          <h3 style={{ color: colors.white, fontSize: 20, fontWeight: 700, marginBottom: 28 }}>
            {recipe ? 'Editar receta' : 'Nueva receta'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, marginBottom: 28 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as RecipeType)} style={{ ...inputStyle, width: 'auto' }}>
                <option value="main">Principal</option>
                <option value="sub">Sub-receta</option>
              </select>
            </div>
            {type === 'sub' && (
              <div>
                <label style={labelStyle}>Porciones</label>
                <input
                  type="number" min={1} value={portions}
                  onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
                  style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                />
              </div>
            )}
          </div>

          {type === 'main' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SECTIONS.map((s) => (
                <IngredientSection
                  key={s.key}
                  label={s.label}
                  rows={rows.filter((r) => r._section === s.key)}
                  ingredients={allIngredients}
                  onAdd={() => addRow(s.key)}
                  onUpdate={updateRow}
                  onRemove={removeRow}
                  onClickAdd={openCreateFor}
                />
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0, fontSize: 13 }}>Ingredientes</label>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>qty · unidad</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map((row) => (
                  <IngredientRow
                    key={row._key}
                    row={row}
                    ingredients={allIngredients}
                    onChange={(updated) => updateRow(row._key, updated)}
                    onRemove={() => removeRow(row._key)}
                    onClickAdd={() => openCreateFor(row._key)}
                  />
                ))}
              </div>
              <button onClick={() => addRow('pro')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, border: `1px dashed ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 13, width: '100%' }}>
                + Agregar ingrediente
              </button>
            </div>
          )}

          {error && <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <IngredientModal
          ingredient={null}
          onClose={() => { setShowCreate(false); setPendingRowKey(null) }}
          onCreated={handleIngredientCreated}
          zIndex={200}
        />
      )}
    </>
  )
}
