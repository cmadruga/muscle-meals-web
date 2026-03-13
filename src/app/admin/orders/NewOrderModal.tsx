'use client'

import { useState, useTransition, useEffect } from 'react'
import { colors } from '@/lib/theme'
import { createAdminOrder, type AdminOrderItem } from '@/app/actions/orders'
import type { CustomerBasic } from '@/lib/db/customers'
import type { PickupSpot } from '@/lib/db/pickup-spots'

type Meal = { id: string; name: string }
type Size = { id: string; name: string }

interface Props {
  weekStr: string
  meals: Meal[]
  sizes: Size[]
  customers: CustomerBasic[]
  pickupSpots: PickupSpot[]
  onClose: () => void
}

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

type ItemRow = { mealId: string; sizeId: string; qty: number }

function emptyRow(meals: Meal[], sizes: Size[]): ItemRow {
  return { mealId: meals[0]?.id ?? '', sizeId: sizes[0]?.id ?? '', qty: 1 }
}

function getMondayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatWeekRange(mondayStr: string): string {
  const [y, m, d] = mondayStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('es-MX', opts)} – ${end.toLocaleDateString('es-MX', opts)}`
}

export default function NewOrderModal({ weekStr, meals, sizes, customers, pickupSpots, onClose }: Props) {
  const [type, setType] = useState<'extras' | 'cliente'>('extras')
  const [selectedWeek, setSelectedWeek] = useState(weekStr)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [shippingType, setShippingType] = useState<'pickup' | 'standard' | 'priority'>('pickup')
  const [pickupSpotId, setPickupSpotId] = useState<string>(pickupSpots[0]?.id ?? '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemRow[]>([emptyRow(meals, sizes)])
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addItem() {
    setItems(prev => [...prev, emptyRow(meals, sizes)])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem<K extends keyof ItemRow>(idx: number, key: K, value: ItemRow[K]) {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  }

  function handleSubmit() {
    setError('')
    if (type === 'cliente' && !selectedCustomerId && !customerName.trim()) {
      setError('Selecciona o ingresa un cliente')
      return
    }
    if (type === 'cliente' && shippingType !== 'pickup' && !shippingAddress.trim()) {
      setError('Ingresa la dirección de envío')
      return
    }
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
      const result = await createAdminOrder({
        type,
        customerId: selectedCustomerId ?? undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        note: note.trim() || undefined,
        weekStr: selectedWeek,
        items: orderItems,
        shippingType: type === 'cliente' ? shippingType : 'pickup',
        pickupSpotId: type === 'cliente' && shippingType === 'pickup' ? pickupSpotId || undefined : undefined,
        shippingAddress: type === 'cliente' && shippingType !== 'pickup' ? shippingAddress.trim() || undefined : undefined,
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
        width: '100%', maxWidth: 520, border: `1px solid #2a2a2a`,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Header */}
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
          Nueva orden
        </h3>

        {/* Semana */}
        <div>
          <label style={labelStyle}>Semana de entrega</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="date"
              value={selectedWeek}
              onChange={e => {
                if (e.target.value) setSelectedWeek(getMondayStr(e.target.value))
              }}
              style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
            />
            <span style={{ color: colors.orange, fontWeight: 600, fontSize: 14 }}>
              {formatWeekRange(selectedWeek)}
            </span>
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label style={labelStyle}>Tipo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(type === 'extras')} onClick={() => setType('extras')}>
              Extras
            </button>
            <button style={toggleStyle(type === 'cliente')} onClick={() => setType('cliente')}>
              Cliente
            </button>
          </div>
        </div>

        {/* Cliente fields */}
        {type === 'cliente' && (
          <div>
            <label style={labelStyle}>Cliente</label>
            <select
              value={selectedCustomerId ?? 'new'}
              onChange={e => {
                const id = e.target.value === 'new' ? null : e.target.value
                setSelectedCustomerId(id)
                const c = customers.find(c => c.id === id)
                setShippingAddress(c?.address ?? '')
              }}
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
              </div>
            )}
          </div>
        )}

        {type === 'extras' && (
          <p style={{ color: colors.textMuted, fontSize: 13, margin: 0, padding: '8px 12px', background: '#ffffff08', borderRadius: 8 }}>
            Sin cliente asignado. Se guardará como orden extra.
          </p>
        )}

        {/* Envío — solo para cliente */}
        {type === 'cliente' && (
          <div>
            <label style={labelStyle}>Tipo de entrega</label>
            <select
              value={shippingType}
              onChange={e => setShippingType(e.target.value as 'pickup' | 'standard' | 'priority')}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="pickup">Pickup</option>
              <option value="standard">Envío estándar</option>
              <option value="priority">Envío prioritario</option>
            </select>

            {shippingType === 'pickup' && pickupSpots.length > 0 && (
              <select
                value={pickupSpotId}
                onChange={e => setPickupSpotId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', marginTop: 8 }}
              >
                {pickupSpots.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {shippingType !== 'pickup' && (
              <input
                style={{ ...inputStyle, marginTop: 8 }}
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="Dirección de envío *"
              />
            )}
          </div>
        )}

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
                  {meals.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select
                  style={{ ...inputStyle, padding: '7px 10px' }}
                  value={row.sizeId}
                  onChange={e => updateItem(idx, 'sizeId', e.target.value)}
                >
                  {sizes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
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

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={addItem}
              style={{
                flex: 1, padding: '7px 0',
                borderRadius: 8, border: `1px dashed #333`,
                background: 'transparent', color: colors.textMuted,
                cursor: 'pointer', fontSize: 13,
              }}
            >
              + Agregar ítem
            </button>
            <button
              onClick={() => setItems(meals.map(m => ({ mealId: m.id, sizeId: sizes[0]?.id ?? '', qty: 1 })))}
              style={{
                flex: 1, padding: '7px 0',
                borderRadius: 8, border: `1px dashed #333`,
                background: 'transparent', color: colors.textMuted,
                cursor: 'pointer', fontSize: 13,
              }}
            >
              + Agregar todas
            </button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label style={labelStyle}>Notas</label>
          <input
            style={inputStyle}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        {error && (
          <p style={{ color: colors.error, fontSize: 13, margin: 0 }}>{error}</p>
        )}

        {/* Actions */}
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
            {pending ? 'Creando…' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
