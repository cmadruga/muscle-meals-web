'use client'

import type { ShoppingItem } from '@/lib/utils/production'
import { useState, useMemo } from 'react'
import { colors } from '@/lib/theme'

type ProcessedGroup = {
  ingredientId: string
  name: string
  proveedor: string | null
  baseQty: number   // total in grams (all units converted via their grEquiv)
  units: { unit: string; grEquiv: number }[]  // present units + factor, for the select
}

function processItems(items: ShoppingItem[]): ProcessedGroup[] {
  // Group by normalized name so same ingredient with different DB IDs merges into one row
  const map = new Map<string, ProcessedGroup>()

  for (const item of items) {
    const key = item.name.trim().toLowerCase()
    let g = map.get(key)
    if (!g) {
      g = { ingredientId: key, name: item.name.trim(), proveedor: item.proveedor, baseQty: 0, units: [] }
      map.set(key, g)
    }
    g.baseQty += item.totalQty * item.grEquiv
    if (!g.units.find(u => u.unit === item.unit)) {
      g.units.push({ unit: item.unit, grEquiv: item.grEquiv })
    }
  }

  for (const g of map.values()) {
    g.baseQty = Math.round(g.baseQty * 10) / 10
    // If grams is not already a unit, add it so the user can always switch to grams
    if (!g.units.find(u => u.unit === 'g')) {
      g.units.push({ unit: 'g', grEquiv: 1 })
    }
    g.units.sort((a, b) => {
      if (a.unit === 'g') return 1   // g goes last (primary unit stays first)
      if (b.unit === 'g') return -1
      return a.unit.localeCompare(b.unit)
    })
  }

  return [...map.values()]
}

function defaultUnits(groups: ProcessedGroup[]): Record<string, string> {
  const init: Record<string, string> = {}
  for (const g of groups) {
    if (g.units.length === 0) continue
    // Default to first non-g unit (the ingredient's native unit); fall back to g
    init[g.ingredientId] = g.units.find(u => u.unit !== 'g')?.unit ?? 'g'
  }
  return init
}

function formatQty(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

function displayQty(baseQty: number, grEquiv: number): string {
  return formatQty(baseQty / grEquiv)
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  color: colors.textMuted,
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${colors.grayLight}`,
}

export default function ShoppingList({ items, weekKey }: { items: ShoppingItem[]; weekKey: string }) {
  const storageKey = `shopping_checked_${weekKey}`
  const [proveedorFilter, setProveedorFilter] = useState<string>('all')

  const groups = useMemo(() => processItems(items), [items])

  const proveedores = useMemo(
    () => Array.from(new Set(groups.map(g => g.proveedor).filter(Boolean) as string[])).sort(),
    [groups]
  )

  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return new Set(JSON.parse(saved) as string[])
    } catch {}
    return new Set()
  })

  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>(() => defaultUnits(groups))

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const handleReset = () => {
    setChecked(new Set())
    try { localStorage.removeItem(storageKey) } catch {}
  }

  const filteredGroups = proveedorFilter === 'all' ? groups : groups.filter(g => g.proveedor === proveedorFilter)
  const uncheckedGroups = filteredGroups.filter(g => !checked.has(g.ingredientId))
  const checkedGroups   = filteredGroups.filter(g =>  checked.has(g.ingredientId))
  const remaining = uncheckedGroups.length

  const handleCopy = () => {
    const text = uncheckedGroups.map(g => {
      const unit = selectedUnits[g.ingredientId] ?? g.units[0]?.unit ?? 'g'
      const grEquiv = g.units.find(u => u.unit === unit)?.grEquiv ?? 1
      return `${g.name}\t${displayQty(g.baseQty, grEquiv)} ${unit}`
    }).join('\n')
    navigator.clipboard.writeText(text).catch(console.error)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
    border: `1px solid ${active ? colors.orange : colors.grayLight}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    fontWeight: active ? 600 : 400,
  })

  const renderRow = (g: ProcessedGroup, isChecked: boolean) => {
    const selectedUnit = selectedUnits[g.ingredientId] ?? g.units[0]?.unit ?? 'g'
    const selectedEntry = g.units.find(u => u.unit === selectedUnit) ?? g.units[0]
    const hasMultiple = g.units.length > 1

    return (
      <tr
        key={g.ingredientId}
        style={{ borderBottom: `1px solid ${isChecked ? '#222' : '#2a2a2a'}`, opacity: isChecked ? 0.35 : 1 }}
      >
        <td style={{ padding: '10px 12px' }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => toggle(g.ingredientId)}
            style={{ cursor: 'pointer', width: 16, height: 16, accentColor: colors.orange }}
          />
        </td>
        <td style={{
          padding: '10px 12px',
          color: isChecked ? colors.textMuted : colors.white,
          textDecoration: isChecked ? 'line-through' : 'underline',
          textUnderlineOffset: 3,
        }}>
          {g.name}
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
          <span style={{
            color: isChecked ? colors.textMuted : colors.white,
            fontWeight: 600,
            textDecoration: isChecked ? 'line-through' : undefined,
          }}>
            {displayQty(g.baseQty, selectedEntry?.grEquiv ?? 1)}
          </span>
          {hasMultiple ? (
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnits(prev => ({ ...prev, [g.ingredientId]: e.target.value }))}
              style={{
                marginLeft: 5, background: 'transparent', border: 'none',
                color: colors.textMuted, fontSize: 11, cursor: 'pointer', outline: 'none',
              }}
            >
              {g.units.map(u => (
                <option key={u.unit} value={u.unit} style={{ background: '#1a1a1a' }}>{u.unit}</option>
              ))}
            </select>
          ) : (
            <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>
              {selectedEntry?.unit}
            </span>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: proveedores.length > 0 ? 12 : 20 }}>
        <h2 style={{ color: colors.white, fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Lista de Compras
        </h2>
        {groups.length > 0 && (
          <span style={{
            background: remaining === 0 ? '#10b981' : colors.orange,
            color: colors.white, borderRadius: 20, padding: '2px 6px', fontSize: 12, fontWeight: 700,
          }}>
            {remaining === 0 ? '¡Completo!' : `${remaining} restantes`}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} title="Copiar pendientes" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
            📋
          </button>
          {checkedGroups.length > 0 && (
            <button onClick={handleReset} title="Desmarcar todo" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
              ↪️
            </button>
          )}
        </div>
      </div>

      {/* Filtro por proveedor */}
      {proveedores.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={() => setProveedorFilter('all')} style={btnStyle(proveedorFilter === 'all')}>Todos</button>
          {proveedores.map(p => (
            <button key={p} onClick={() => setProveedorFilter(p)} style={btnStyle(proveedorFilter === p)}>{p}</button>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay datos esta semana.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }} />
              <th style={thStyle}>Ingrediente</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {uncheckedGroups.map(g => renderRow(g, false))}
            {checkedGroups.map(g => renderRow(g, true))}
          </tbody>
        </table>
      )}
    </div>
  )
}
