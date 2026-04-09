'use client'

import { useState } from 'react'
import type { Size, Ingredient } from '@/lib/types'
import { calculateCustomSizePrice } from '@/lib/utils/pricing'
import { createCustomSize } from '@/app/actions/sizes'
import { colors } from '@/lib/theme'

interface CustomSizePanelProps {
  proIngredients: Ingredient[]
  carbIngredients: Ingredient[]
  customerSizes?: Size[]
  onSizeCreated: (size: Size) => void
  mealsIncluded?: number
}

type IngGroup = { displayName: string; ids: string[] }

function groupIngredients(ings: Ingredient[]): IngGroup[] {
  const map = new Map<string, string[]>()
  for (const ing of ings) {
    const key = ing.public_name ?? ing.name
    const arr = map.get(key) ?? []
    arr.push(ing.id)
    map.set(key, arr)
  }
  return [...map.entries()].map(([displayName, ids]) => ({ displayName, ids }))
}

const inputStyle: React.CSSProperties = {
  width: 68,
  padding: '5px 8px',
  fontSize: 14,
  borderRadius: 6,
  border: `1px solid ${colors.grayLight}`,
  background: colors.black,
  color: colors.white,
  textAlign: 'center',
  outline: 'none',
}

function IngRow({ name: ingName, id, value, onChange, accent }: {
  name: string; id: string; value: string; onChange: (v: string) => void; accent: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid #1a1a1a` }}>
      <span style={{ color: colors.textSecondary, fontSize: 13 }}>{ingName}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <input
          type="number" min={0} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{ ...inputStyle, borderColor: value ? accent + '66' : colors.grayLight }}
        />
        <span style={{ color: colors.textMuted, fontSize: 11, width: 12 }}>g</span>
      </div>
    </div>
  )
}

export default function CustomSizePanel({ proIngredients, carbIngredients, customerSizes = [], onSizeCreated, mealsIncluded }: CustomSizePanelProps) {
  const [proQtys, setProQtys] = useState<Record<string, string>>({})
  const [carbQtys, setCarbQtys] = useState<Record<string, string>>({})
  const [vegQty, setVegQty] = useState('')
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTemplate = (sizeId: string) => {
    const template = customerSizes.find(s => s.id === sizeId)
    if (!template) {
      setName('')
      setProQtys({})
      setCarbQtys({})
      setVegQty('')
      return
    }

    setName(template.name)
    const pro: Record<string, string> = {}
    for (const [id, val] of Object.entries(template.protein_qty)) {
      pro[id] = String(val)
    }
    setProQtys(pro)

    const carb: Record<string, string> = {}
    for (const [id, val] of Object.entries(template.carb_qty)) {
      carb[id] = String(val)
    }
    setCarbQtys(carb)
    setVegQty(String(template.veg_qty))
  }

  // Derive price from filled values
  const proteinForPrice = Math.max(0, ...Object.values(proQtys).map(v => parseFloat(v) || 0))
  const carbForPrice = Math.max(0, ...Object.values(carbQtys).map(v => parseFloat(v) || 0))
  const vegForPrice = parseFloat(vegQty) || 0
  const { price, packagePrice } = calculateCustomSizePrice(proteinForPrice, carbForPrice, vegForPrice)

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setIsCreating(true)
    setError(null)

    const proteinQty: Record<string, number> = {}
    for (const [id, v] of Object.entries(proQtys)) {
      const n = parseFloat(v)
      if (n > 0) proteinQty[id] = n
    }
    const carbQty: Record<string, number> = {}
    for (const [id, v] of Object.entries(carbQtys)) {
      const n = parseFloat(v)
      if (n > 0) carbQty[id] = n
    }

    const result = await createCustomSize({
      name,
      protein_qty: proteinQty,
      carb_qty: carbQty,
      veg_qty: parseFloat(vegQty) || 0,
    })

    if (result.error) { setError(result.error); setIsCreating(false); return }
    if (result.size) onSizeCreated(result.size)
    setIsCreating(false)
  }

  return (
    <div style={{
      marginTop: 12, padding: 20,
      background: colors.black, borderRadius: 10, border: `2px solid ${colors.orange}`,
    }}>
      <h4 style={{ margin: '0 0 16px', color: colors.orange, fontSize: 15 }}>
        Crear tamaño personalizado
      </h4>

      {/* Plantillas */}
      {customerSizes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 5 }}>Usar plantilla</label>
          <select
            onChange={e => handleSelectTemplate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, boxSizing: 'border-box',
              border: `1px solid ${colors.grayLight}`, background: colors.grayDark, color: colors.white, appearance: 'none' }}
          >
            <option value="">Seleccionar tamaño guardado...</option>
            {customerSizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Nombre */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 5 }}>Nombre del tamaño</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ej: Mi Tamaño" maxLength={50}
          style={{ width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, boxSizing: 'border-box',
            border: `1px solid ${colors.grayLight}`, background: colors.grayDark, color: colors.white }}
        />
      </div>

      {/* Grid pro / carb / veg */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0, marginBottom: 14, border: `1px solid ${colors.grayLight}`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Proteína */}
        <div style={{ padding: '10px 14px', borderRight: `1px solid ${colors.grayLight}` }}>
          <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Proteína</p>
          {groupIngredients(proIngredients).map(group => (
            <IngRow key={group.ids[0]} name={group.displayName} id={group.ids[0]}
              value={proQtys[group.ids[0]] ?? ''}
              onChange={v => setProQtys(p => { const n = { ...p }; group.ids.forEach(id => { n[id] = v }); return n })}
              accent="#ef4444" />
          ))}
          {proIngredients.length === 0 && <p style={{ color: colors.textMuted, fontSize: 12 }}>—</p>}
        </div>

        {/* Carbo */}
        <div style={{ padding: '10px 14px', borderRight: `1px solid ${colors.grayLight}` }}>
          <p style={{ color: '#eab308', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Carbo</p>
          {groupIngredients(carbIngredients).map(group => (
            <IngRow key={group.ids[0]} name={group.displayName} id={group.ids[0]}
              value={carbQtys[group.ids[0]] ?? ''}
              onChange={v => setCarbQtys(p => { const n = { ...p }; group.ids.forEach(id => { n[id] = v }); return n })}
              accent="#eab308" />
          ))}
          {carbIngredients.length === 0 && <p style={{ color: colors.textMuted, fontSize: 12 }}>—</p>}
        </div>

        {/* Verdura */}
        <div style={{ padding: '10px 14px', minWidth: 110 }}>
          <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Verdura</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <input type="number" min={0} value={vegQty} onChange={e => setVegQty(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, borderColor: vegQty ? '#22c55e66' : colors.grayLight }} />
            <span style={{ color: colors.textMuted, fontSize: 11 }}>g</span>
          </div>
        </div>
      </div>

      {/* Precio */}
      <div style={{ padding: '9px 14px', background: colors.grayDark, borderRadius: 8, marginBottom: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Precio: <strong style={{ color: colors.orange }}>${(price / 100).toFixed(0)} MXN</strong></span>
        <span style={{ color: colors.textMuted }}>
          {mealsIncluded
            ? `Paquete total: $${(packagePrice * mealsIncluded / 100).toFixed(0)} MXN`
            : `Paquete: $${(packagePrice / 100).toFixed(0)} MXN`}
        </span>
      </div>

      {error && <p style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</p>}

      <button
        onClick={handleSubmit} disabled={isCreating}
        className="franchise-stroke"
        style={{
          width: '100%', padding: '12px 16px', cursor: isCreating ? 'not-allowed' : 'pointer',
          opacity: isCreating ? 0.6 : 1, background: colors.orange, color: colors.white,
          border: 'none', borderRadius: 8, fontFamily: 'Franchise, sans-serif',
          fontSize: 20, textTransform: 'uppercase', lineHeight: 1,
        }}
      >
        {isCreating ? 'Creando...' : 'Crear y usar este tamaño'}
      </button>
    </div>
  )
}
