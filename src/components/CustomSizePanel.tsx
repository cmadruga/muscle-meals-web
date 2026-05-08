'use client'

import { useState, useRef, useEffect } from 'react'
import type { Size, Ingredient } from '@/lib/types'
import { calculateCustomSizePrice, CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'
import { createCustomSize } from '@/app/actions/sizes'
import { colors } from '@/lib/theme'

interface CustomSizePanelProps {
  proIngredients: Ingredient[]
  carbIngredients: Ingredient[]
  fitSize?: Size
  initialSize?: Size
  isAuthenticated?: boolean
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

function IngRow({ name: ingName, id, value, onChange, accent, fitQty, tooltip }: {
  name: string; id: string; value: string; onChange: (v: string) => void; accent: string; fitQty?: number; tooltip?: string
}) {
  const [tipOpen, setTipOpen] = useState(false)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tipOpen) return
    function handleClick(e: MouseEvent) {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) setTipOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [tipOpen])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid #1a1a1a` }}>
      <span style={{ color: colors.textSecondary, fontSize: 13 }}>{ingName}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ position: 'relative' }} ref={tipRef}>
            <input
              type="number" min={0} value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, borderColor: value ? accent + '66' : colors.grayLight }}
            />
            {tooltip && (
              <button
                type="button"
                onClick={() => setTipOpen(v => !v)}
                style={{
                  position: 'absolute', top: -7, right: -7,
                  width: 16, height: 16, borderRadius: '50%',
                  background: colors.grayLight, border: 'none', cursor: 'pointer',
                  color: colors.textMuted, fontSize: 10, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0,
                }}
              >
                i
              </button>
            )}
            {tooltip && tipOpen && (
              <div style={{
                position: 'absolute', bottom: '110%', right: 0, zIndex: 10,
                background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
                borderRadius: 8, padding: '8px 10px', width: 180,
                fontSize: 12, color: colors.textSecondary, lineHeight: 1.4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}>
                {tooltip}
              </div>
            )}
          </div>
          <span style={{ color: colors.textMuted, fontSize: 11, width: 12 }}>g</span>
        </div>
        {fitQty != null && fitQty > 0 && (
          <span style={{ color: colors.textMuted, fontSize: 10, alignSelf: 'flex-start' }}>FIT: {fitQty}g</span>
        )}
      </div>
    </div>
  )
}

export default function CustomSizePanel({ proIngredients, carbIngredients, fitSize, initialSize, isAuthenticated, onSizeCreated, mealsIncluded }: CustomSizePanelProps) {
  const [proQtys, setProQtys] = useState<Record<string, string>>(() =>
    initialSize ? Object.fromEntries(Object.entries(initialSize.protein_qty).map(([k, v]) => [k, String(v)])) : {}
  )
  const [carbQtys, setCarbQtys] = useState<Record<string, string>>(() =>
    initialSize ? Object.fromEntries(Object.entries(initialSize.carb_qty).map(([k, v]) => [k, String(v)])) : {}
  )
  const [vegQty, setVegQty] = useState(() => initialSize ? String(initialSize.veg_qty) : '')
  const [name, setName] = useState(() => initialSize?.name ?? '')
  const [isMain, setIsMain] = useState(() => initialSize?.is_main ?? false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vegForPrice = parseFloat(vegQty) || 0

  // Normalizar proteínas: normPro = qty * PROTEIN_BASE.FIT / fitQty
  const proNormValues = Object.entries(proQtys)
    .map(([id, v]) => {
      const qty = parseFloat(v) || 0
      if (qty === 0) return null
      const fitQty = fitSize?.protein_qty[id] ?? 0
      return fitQty > 0 ? qty * PROTEIN_BASE.FIT / fitQty : qty
    })
    .filter((n): n is number => n !== null)

  // Normalizar carbos: normCarb = qty * CARB_BASE.FIT / fitQty
  const carbNormValues = Object.entries(carbQtys)
    .map(([id, v]) => {
      const qty = parseFloat(v) || 0
      if (qty === 0) return null
      const fitQty = fitSize?.carb_qty[id] ?? 0
      return fitQty > 0 ? qty * CARB_BASE.FIT / fitQty : qty
    })
    .filter((n): n is number => n !== null)

  // Rango: min usa la proteína más barata + carbo más barato; max usa la más cara + carbo más caro
  const proMin = proNormValues.length > 0 ? Math.min(...proNormValues) : 0
  const proMax = proNormValues.length > 0 ? Math.max(...proNormValues) : 0
  const carbMin = carbNormValues.length > 0 ? Math.min(...carbNormValues) : 0
  const carbMax = carbNormValues.length > 0 ? Math.max(...carbNormValues) : 0

  const { price: priceMin, packagePrice: pkgMin } = calculateCustomSizePrice(proMin, carbMin, vegForPrice)
  const { price: priceMax, packagePrice: pkgMax } = calculateCustomSizePrice(proMax, carbMax, vegForPrice)

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
      is_main: isMain,
      sizeId: initialSize?.id,
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

      {/* Nombre + switch principal */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 5 }}>Nombre del tamaño</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Mi Tamaño" maxLength={50}
            style={{ width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, boxSizing: 'border-box',
              border: `1px solid ${colors.grayLight}`, background: colors.grayDark, color: colors.white }}
          />
        </div>
        {isAuthenticated && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 2 }}>
            <span style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>Principal</span>
            <div
              onClick={() => setIsMain(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
                background: isMain ? colors.orange : colors.grayLight,
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2,
                left: isMain ? 20 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: colors.white,
                transition: 'left 0.15s',
              }} />
            </div>
          </div>
        )}
      </div>

      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
        ⚠ Todas las cantidades se pesan en crudo. Puedes usar las cantidades de tamaño FIT que se muestran como referencia.
      </p>

      {/* Grid pro / carb / veg */}
      <div style={{ overflowX: 'auto', marginBottom: 14, border: `1px solid ${colors.grayLight}`, borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0, minWidth: 340 }}>
        {/* Proteína */}
        <div style={{ padding: '10px 14px', borderRight: `1px solid ${colors.grayLight}` }}>
          <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Proteína</p>
          {groupIngredients(proIngredients).map(group => (
            <IngRow key={group.ids[0]} name={group.displayName} id={group.ids[0]}
              value={proQtys[group.ids[0]] ?? ''}
              onChange={v => setProQtys(p => { const n = { ...p }; group.ids.forEach(id => { n[id] = v }); return n })}
              accent="#ef4444"
              fitQty={fitSize?.protein_qty[group.ids[0]]} />
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
              accent="#eab308"
              fitQty={fitSize?.carb_qty[group.ids[0]]}
              tooltip={group.displayName.toLowerCase().includes('papa') ? 'La papa equivale ×5 vs pasta o arroz en precio. 10g de papa = 50g de pasta.' : undefined} />
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
          {fitSize && fitSize.veg_qty > 0 && (
            <span style={{ display: 'block', color: colors.textMuted, fontSize: 10, marginTop: 2 }}>FIT: {fitSize.veg_qty}g</span>
          )}
        </div>
      </div>
      </div>

      {/* Precio */}
      <div style={{ padding: '9px 14px', background: colors.grayDark, borderRadius: 8, marginBottom: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Precio: <strong style={{ color: colors.orange }}>
          {priceMin === priceMax
            ? `$${(priceMin / 100).toFixed(0)}`
            : `$${(priceMin / 100).toFixed(0)} - $${(priceMax / 100).toFixed(0)}`
          } MXN
        </strong></span>
        <span style={{ color: colors.textMuted }}>
          {mealsIncluded
            ? `Paquete total: $${(pkgMin * mealsIncluded / 100).toFixed(0)}${pkgMin !== pkgMax ? ` - $${(pkgMax * mealsIncluded / 100).toFixed(0)}` : ''} MXN`
            : `Paquete: $${(pkgMin / 100).toFixed(0)}${pkgMin !== pkgMax ? ` - $${(pkgMax / 100).toFixed(0)}` : ''} MXN`}
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
