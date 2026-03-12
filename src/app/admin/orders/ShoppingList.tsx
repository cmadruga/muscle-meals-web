'use client'

import type { ShoppingItem } from '@/lib/utils/production'
import { useState } from 'react'
import { colors } from '@/lib/theme'

function formatQty(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
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

  // Lazy initializer — reads localStorage once on mount, no useEffect needed
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return new Set(JSON.parse(saved) as string[])
    } catch {}
    return new Set()
  })

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const handleReset = () => {
    setChecked(new Set())
    try { localStorage.removeItem(storageKey) } catch {}
  }

  const uncheckedItems = items.filter(i => !checked.has(i.ingredientId))
  const checkedItems   = items.filter(i =>  checked.has(i.ingredientId))
  const remaining = uncheckedItems.length

  const handleCopy = () => {
    const text = uncheckedItems.map(i => `${i.name}\t${formatQty(i.totalQty)} ${i.unit}`).join('\n')
    navigator.clipboard.writeText(text).catch(console.error)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ color: colors.white, fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Lista de Compras
        </h2>
        {items.length > 0 && (
          <span style={{
            background: remaining === 0 ? '#10b981' : colors.orange,
            color: colors.white,
            borderRadius: 20,
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {remaining === 0 ? '¡Completo!' : `${remaining} restantes`}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} title="Copiar pendientes" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
            📋
          </button>
          {checkedItems.length > 0 && (
            <button onClick={handleReset} title="Desmarcar todo" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
              ↪️
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
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
            {/* Unchecked — subrayados como "pendientes" */}
            {uncheckedItems.map(item => (
              <tr key={item.ingredientId} style={{ borderBottom: `1px solid #2a2a2a` }}>
                <td style={{ padding: '10px 12px' }}>
                  <input type="checkbox" checked={false} onChange={() => toggle(item.ingredientId)}
                    style={{ cursor: 'pointer', width: 16, height: 16, accentColor: colors.orange }} />
                </td>
                <td style={{ padding: '10px 12px', color: colors.white, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {item.name}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ color: colors.white, fontWeight: 600 }}>{formatQty(item.totalQty)}</span>
                  <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 5 }}>{item.unit}</span>
                </td>
              </tr>
            ))}

            {/* Checked — tachados al fondo */}
            {checkedItems.map(item => (
              <tr key={item.ingredientId} style={{ borderBottom: `1px solid #222`, opacity: 0.35 }}>
                <td style={{ padding: '10px 12px' }}>
                  <input type="checkbox" checked={true} onChange={() => toggle(item.ingredientId)}
                    style={{ cursor: 'pointer', width: 16, height: 16, accentColor: colors.orange }} />
                </td>
                <td style={{ padding: '10px 12px', color: colors.textMuted, textDecoration: 'line-through' }}>
                  {item.name}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>
                  <span style={{ color: colors.textMuted, fontWeight: 600 }}>{formatQty(item.totalQty)}</span>
                  <span style={{ fontSize: 11, marginLeft: 5 }}>{item.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
