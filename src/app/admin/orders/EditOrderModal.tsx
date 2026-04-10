'use client'

import { useState, useTransition, useEffect } from 'react'
import { colors } from '@/lib/theme'
import { updateAdminOrder, type AdminOrderItem } from '@/app/actions/orders'
import type { OrderWithCustomer } from '@/lib/types'

type Meal = { id: string; name: string }
type Size = { id: string; name: string }
type ItemRow = { mealId: string; sizeId: string; qty: number }

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: `1px solid #333`,
  borderRadius: 8,
  padding: '8px 12px',
  color: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 12,
  marginBottom: 4,
  display: 'block',
}

export default function EditOrderModal({
  order,
  meals,
  sizes,
  onClose,
}: {
  order: OrderWithCustomer
  meals: Meal[]
  sizes: Size[]
  onClose: () => void
}) {
  const [items, setItems] = useState<ItemRow[]>(
    order.items.length > 0
      ? order.items.map(i => ({ mealId: i.meal_id, sizeId: i.size_id, qty: i.qty }))
      : [{ mealId: meals[0]?.id ?? '', sizeId: sizes[0]?.id ?? '', qty: 1 }]
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addItem() {
    setItems(prev => [...prev, { mealId: meals[0]?.id ?? '', sizeId: sizes[0]?.id ?? '', qty: 1 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem<K extends keyof ItemRow>(idx: number, key: K, value: ItemRow[K]) {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  }

  function handleSubmit() {
    setError('')
    if (items.some(r => !r.mealId || !r.sizeId || r.qty < 1)) {
      setError('Revisa los ítems — todos necesitan platillo, talla y cantidad')
      return
    }
    const orderItems: AdminOrderItem[] = items.map(row => ({
      meal_id: row.mealId,
      size_id: row.sizeId,
      qty: row.qty,
      meal_name: meals.find(m => m.id === row.mealId)?.name ?? '',
      size_name: sizes.find(s => s.id === row.sizeId)?.name ?? '',
    }))
    startTransition(async () => {
      const result = await updateAdminOrder(order.id, orderItems)
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: '#000000cc', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1a1a', borderRadius: 14, padding: 28,
        width: '100%', maxWidth: 520, border: `1px solid #2a2a2a`,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
            Editar orden {order.order_number}
          </h3>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
            {order.customer_name ?? 'Sin cliente'} · <span style={{ color: STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status]}</span>
          </p>
        </div>

        {/* Items */}
        <div>
          <label style={labelStyle}>Ítems</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 56px 32px', gap: 8, alignItems: 'center' }}>
                <select
                  style={{ ...inputStyle, padding: '7px 10px' }}
                  value={row.mealId}
                  onChange={e => updateItem(idx, 'mealId', e.target.value)}
                >
                  {meals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select
                  style={{ ...inputStyle, padding: '7px 10px' }}
                  value={row.sizeId}
                  onChange={e => updateItem(idx, 'sizeId', e.target.value)}
                >
                  {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input
                  type="number" min={1}
                  style={{ ...inputStyle, padding: '7px 8px', textAlign: 'center' }}
                  value={row.qty}
                  onChange={e => updateItem(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  style={{
                    background: 'transparent', border: '1px solid #333',
                    borderRadius: 6, color: items.length === 1 ? '#333' : '#ef4444',
                    cursor: items.length === 1 ? 'default' : 'pointer',
                    fontSize: 16, lineHeight: 1, padding: '6px 0', width: '100%',
                  }}
                >×</button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            style={{
              width: '100%', marginTop: 8, padding: '7px 0',
              borderRadius: 8, border: `1px dashed #333`,
              background: 'transparent', color: colors.textMuted,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            + Agregar ítem
          </button>
        </div>

        {error && <p style={{ color: colors.error, fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid #333`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = { extra: 'Extra', admin: 'Admin' }
const STATUS_COLORS: Record<string, string> = { extra: '#a855f7', admin: '#06b6d4' }
