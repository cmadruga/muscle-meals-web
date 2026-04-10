'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Ingredient, IngredientType, Unit, UnitConversion } from '@/lib/types'
import { colors } from '@/lib/theme'
import {
  createIngredient,
  createIngredientInline,
  updateIngredient,
  type IngredientFormData,
} from '@/app/actions/database'

const TYPE_LABEL: Record<string, string> = { pro: 'Proteína', carb: 'Carbo', veg: 'Verdura' }
const UNITS: Unit[] = ['g', 'ml', 'pz', 'tsp', 'tbsp']
const TYPES: Array<IngredientType | 'fijo'> = ['pro', 'carb', 'veg', 'fijo']

export const emptyIngredientForm = (): IngredientFormData => ({
  name: '',
  type: null,
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  unit: 'g',
  cant: 0,
  precio: 0,
  public_name: null,
  proveedor: null,
  unit_conversions: [],
})

export function toIngredientForm(ing: Ingredient): IngredientFormData {
  return {
    name: ing.name,
    type: ing.type,
    calories: ing.calories,
    protein: ing.protein,
    carbs: ing.carbs,
    fats: ing.fats,
    unit: ing.unit,
    cant: ing.cant,
    precio: ing.precio,
    public_name: ing.public_name,
    proveedor: ing.proveedor,
    unit_conversions: ing.unit_conversions ?? [],
  }
}

interface IngredientModalProps {
  ingredient: Ingredient | null  // null = crear nuevo
  onClose: () => void
  onCreated?: (ing: Ingredient) => void  // solo para creación inline (RecipeModal)
  zIndex?: number
}

export function IngredientModal({ ingredient, onClose, onCreated, zIndex = 100 }: IngredientModalProps) {
  const [form, setForm] = useState<IngredientFormData>(
    ingredient ? toIngredientForm(ingredient) : emptyIngredientForm()
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      if (ingredient) {
        const result = await updateIngredient(ingredient.id, form)
        if (result.error) setError(result.error)
        else onClose()
      } else if (onCreated) {
        // creación inline — necesitamos el objeto creado de vuelta
        const result = await createIngredientInline(form)
        if (result.error) setError(result.error)
        else if (result.ingredient) onCreated(result.ingredient)
      } else {
        const result = await createIngredient(form)
        if (result.error) setError(result.error)
        else onClose()
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: '#000000bb', zIndex,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.grayDark, borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 480, border: `1px solid ${colors.grayLight}`,
      }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          {ingredient ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre (interno)</label>
              <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nombre público</label>
              <input style={inputStyle} value={form.public_name ?? ''} onChange={(e) => set('public_name', e.target.value || null)} placeholder="Opcional" />
            </div>
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
                  step="any"
                  value={form[key]}
                  onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Cant. empaque</label>
              <input style={inputStyle} type="number" min={0} value={form.cant} onChange={(e) => set('cant', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={labelStyle}>Unidad</label>
              <select style={inputStyle} value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Precio empaque</label>
              <input style={inputStyle} type="number" min={0} step={0.01} value={form.precio} onChange={(e) => set('precio', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {form.cant > 0 && (
            <p style={{ color: colors.textMuted, fontSize: 12, margin: '-8px 0 0' }}>
              Precio/und: <span style={{ color: colors.textSecondary, fontWeight: 600 }}>${(form.precio / form.cant).toFixed(4)}</span>
            </p>
          )}

          <div>
            <label style={labelStyle}>Proveedor</label>
            <input style={inputStyle} value={form.proveedor ?? ''} onChange={(e) => set('proveedor', e.target.value || null)} placeholder="Opcional" />
          </div>

          <div>
            <label style={labelStyle}>Equivalencias de unidad <span style={{ color: colors.textMuted, fontWeight: 400 }}>(cuántos gramos equivale 1 unidad)</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {form.unit_conversions.map((conv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: colors.textMuted, fontSize: 13, minWidth: 24, textAlign: 'right' }}>1</span>
                  <select
                    value={conv.unit}
                    onChange={(e) => {
                      const next = [...form.unit_conversions]
                      next[i] = { ...conv, unit: e.target.value as Unit }
                      set('unit_conversions', next)
                    }}
                    style={{ ...inputStyle, width: 90 }}
                  >
                    {UNITS.filter(u => u !== 'g').map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <span style={{ color: colors.textMuted, fontSize: 13 }}>=</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={conv.gr_equiv}
                    onChange={(e) => {
                      const next = [...form.unit_conversions]
                      next[i] = { ...conv, gr_equiv: parseFloat(e.target.value) || 0 }
                      set('unit_conversions', next)
                    }}
                    style={{ ...inputStyle, width: 80 }}
                  />
                  <span style={{ color: colors.textMuted, fontSize: 13 }}>g</span>
                  <button
                    type="button"
                    onClick={() => set('unit_conversions', form.unit_conversions.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const usedUnits = new Set(form.unit_conversions.map(c => c.unit))
                  const available = UNITS.filter(u => u !== 'g' && !usedUnits.has(u))
                  if (available.length === 0) return
                  set('unit_conversions', [...form.unit_conversions, { unit: available[0], gr_equiv: 0 }])
                }}
                style={{ alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 12 }}
              >
                + Agregar equivalencia
              </button>
            </div>
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
