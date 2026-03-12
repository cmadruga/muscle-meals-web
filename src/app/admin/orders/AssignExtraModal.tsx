'use client'

import { useState, useTransition, useEffect } from 'react'
import { colors } from '@/lib/theme'
import { assignExtraToClient, type AssignExtraItem } from '@/app/actions/orders'
import type { OrderWithCustomer } from '@/lib/types'
import type { CustomerBasic } from '@/lib/db/customers'

interface Props {
  order: OrderWithCustomer
  weekStr: string
  customers: CustomerBasic[]
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
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

export default function AssignExtraModal({ order, weekStr, customers, onClose }: Props) {
  // Per-item: selected qty (0 = no asignar)
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map(i => [i.id, i.qty]))
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'paid' | 'pending'>('paid')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedItems = order.items.filter(i => (qtys[i.id] ?? 0) > 0)
  const totalQty = selectedItems.reduce((s, i) => s + (qtys[i.id] ?? 0), 0)

  function handleSubmit() {
    setError('')
    if (!selectedCustomerId && !customerName.trim()) { setError('Selecciona o ingresa un cliente'); return }
    if (selectedItems.length === 0) { setError('Selecciona al menos un ítem'); return }

    const items: AssignExtraItem[] = selectedItems.map(i => ({
      itemId: i.id,
      meal_id: i.meal_id,
      size_id: i.size_id,
      qty: qtys[i.id],
      meal_name: i.meal_name ?? '',
      size_name: i.size_name ?? '',
    }))

    startTransition(async () => {
      const result = await assignExtraToClient({
        extraOrderId: order.id,
        customerId: selectedCustomerId ?? undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        note: note.trim() || undefined,
        weekStr,
        items,
        status,
      })
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: `1px solid ${active ? colors.orange : '#333'}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 700 : 400,
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: '#000000cc', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#1a1a1a', borderRadius: 14, padding: 28,
        width: '100%', maxWidth: 520, border: '1px solid #2a2a2a',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
            Asignar extras a cliente
          </h3>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: '4px 0 0' }}>
            {order.order_number} — {order.items.reduce((s, i) => s + i.qty, 0)} piezas en stock
          </p>
        </div>

        {/* Items disponibles */}
        <div>
          <label style={labelStyle}>Stock disponible</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.items.map(item => (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
                padding: '8px 12px', background: '#111', borderRadius: 8,
                border: `1px solid ${(qtys[item.id] ?? 0) > 0 ? '#333' : '#222'}`,
              }}>
                <div>
                  <span style={{ color: colors.white, fontSize: 14 }}>{item.meal_name}</span>
                  {item.size_name && (
                    <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 6 }}>
                      {item.size_name}
                    </span>
                  )}
                </div>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>
                  max {item.qty}
                </span>
                <input
                  type="number"
                  min={0}
                  max={item.qty}
                  value={qtys[item.id] ?? 0}
                  onChange={e => setQtys(prev => ({
                    ...prev,
                    [item.id]: Math.max(0, Math.min(item.qty, parseInt(e.target.value) || 0)),
                  }))}
                  style={{
                    width: 56, background: '#1a1a1a', border: '1px solid #333',
                    borderRadius: 6, color: '#fff', padding: '5px 8px',
                    fontSize: 14, textAlign: 'center', outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          {totalQty > 0 && (
            <p style={{ color: colors.orange, fontSize: 13, margin: '6px 0 0', fontWeight: 600 }}>
              {totalQty} pieza{totalQty !== 1 ? 's' : ''} a asignar
            </p>
          )}
        </div>

        {/* Cliente */}
        <div>
          <label style={labelStyle}>Cliente</label>
          <select
            value={selectedCustomerId ?? 'new'}
            onChange={e => setSelectedCustomerId(e.target.value === 'new' ? null : e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="new">— Nuevo cliente —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name}{c.phone ? ` · ${c.phone}` : ''}
              </option>
            ))}
          </select>

          {selectedCustomerId === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <input style={inputStyle} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre *" />
              <input style={inputStyle} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Teléfono" />
              <input style={inputStyle} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Dirección" />
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Estado de la nueva orden</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(status === 'paid')} onClick={() => setStatus('paid')}>Pagado</button>
            <button style={toggleStyle(status === 'pending')} onClick={() => setStatus('pending')}>Pendiente</button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label style={labelStyle}>Notas</label>
          <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Opcional" />
        </div>

        {error && <p style={{ color: colors.error, fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || totalQty === 0}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: pending || totalQty === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: pending || totalQty === 0 ? 0.5 : 1 }}
          >
            {pending ? 'Creando…' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
