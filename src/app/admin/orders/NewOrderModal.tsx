'use client'

import { useState, useTransition, useEffect } from 'react'
import { colors } from '@/lib/theme'
import { createAdminOrder, type AdminOrderItem } from '@/app/actions/orders'
import { createMemberOrders, type MemberForAdmin, type MemberLastOrderItem, type MembershipSlot } from '@/app/actions/admin-members'
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
  members: MemberForAdmin[]
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

function emptyExtraRow(meals: Meal[]): ItemRow {
  return { mealId: meals[0]?.id ?? '', sizeId: '', qty: 1 }
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

type MemberEditSlot = {
  mealId: string
  sizeId: string   // limited to membership sizes
  qty: number
}

type MemberEditState = {
  shippingType: 'standard' | 'priority' | 'pickup'
  pickupSpotId: string
  slots: MemberEditSlot[]
}

function memberToEditState(m: MemberForAdmin, firstPickupId: string): MemberEditState {
  // Pre-populate from last order; fallback to one slot per membership size
  const slots: MemberEditSlot[] = m.last_order?.items.length
    ? m.last_order.items.map(i => ({ mealId: i.meal_id, sizeId: i.size_id, qty: i.qty }))
    : m.membership_slots.map(s => ({ mealId: '', sizeId: s.size_id, qty: s.total_qty }))
  return {
    shippingType: m.last_order?.shipping_type ?? 'pickup',
    pickupSpotId: m.last_order?.pickup_spot_id ?? firstPickupId,
    slots,
  }
}

function usedPerSize(slots: MemberEditSlot[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of slots) m.set(s.sizeId, (m.get(s.sizeId) ?? 0) + s.qty)
  return m
}

function isBudgetValid(slots: MemberEditSlot[], membershipSlots: MembershipSlot[]): boolean {
  const used = usedPerSize(slots)
  return membershipSlots.every(s => (used.get(s.size_id) ?? 0) === s.total_qty)
}

function summarizeOrder(last: MemberForAdmin['last_order']): string {
  if (!last || last.items.length === 0) return 'Sin pedido previo'
  const parts = last.items.map((i) => `${i.qty}× ${i.size_name || '?'} ${i.meal_name || '?'}`)
  const delivery = last.shipping_type === 'pickup' ? 'Pickup' : last.shipping_type === 'standard' ? 'Envío std' : 'Prioritario'
  return `${parts.join(', ')} · ${delivery}`
}

export default function NewOrderModal({ weekStr, meals, sizes, customers, pickupSpots, members, onClose }: Props) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480
  const [type, setType] = useState<'extras' | 'cliente' | 'members'>('extras')
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

  // Members tab state
  const firstPickupId = pickupSpots[0]?.id ?? ''
  const [checkedMembers, setCheckedMembers] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const m of members) {
      if ((m.membership_weeks_left ?? 0) > 0 && !m.has_order_this_week) s.add(m.id)
    }
    return s
  })
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [memberEdits, setMemberEdits] = useState<Map<string, MemberEditState>>(new Map())
  const [editSnapshot, setEditSnapshot] = useState<MemberEditState | null>(null)
  const [memberResult, setMemberResult] = useState<{ created: number; errors: string[] } | null>(null)

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
    if (items.some(r => !r.mealId || (type !== 'extras' && !r.sizeId) || r.qty < 1)) {
      setError('Revisa los ítems — todos necesitan platillo' + (type !== 'extras' ? ', talla' : '') + ' y cantidad')
      return
    }

    const orderItems: AdminOrderItem[] = items.map(row => ({
      meal_id: row.mealId,
      size_id: type === 'extras' ? null : row.sizeId,
      qty: row.qty,
      meal_name: meals.find(m => m.id === row.mealId)?.name ?? '',
      size_name: type === 'extras' ? '' : (sizes.find(s => s.id === row.sizeId)?.name ?? ''),
    }))

    startTransition(async () => {
      const result = await createAdminOrder({
        type: type as 'extras' | 'cliente',
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

  function handleCreateMemberOrders() {
    const selected = members.filter(
      m => checkedMembers.has(m.id) && (m.membership_weeks_left ?? 0) > 0 && !m.has_order_this_week
    )
    if (selected.length === 0) return
    setError('')
    setMemberResult(null)

    startTransition(async () => {
      const payload = selected.map(m => {
        const edit = memberEdits.get(m.id) ?? memberToEditState(m, firstPickupId)
        const orderItems: MemberLastOrderItem[] = edit.slots.map(slot => ({
          meal_id: slot.mealId,
          meal_name: meals.find(x => x.id === slot.mealId)?.name ?? '',
          size_id: slot.sizeId,
          size_name: m.membership_slots.find(s => s.size_id === slot.sizeId)?.size_name ?? '',
          qty: slot.qty,
        }))
        return {
          customerId: m.id,
          customerName: m.full_name,
          shippingType: edit.shippingType,
          pickupSpotId: edit.shippingType === 'pickup' ? edit.pickupSpotId : null,
          items: orderItems,
        }
      })
      const result = await createMemberOrders(payload)
      setMemberResult(result)
      if (result.errors.length === 0) onClose()
    })
  }

  function getMemberEdit(m: MemberForAdmin): MemberEditState {
    return memberEdits.get(m.id) ?? memberToEditState(m, firstPickupId)
  }

  function setMemberEdit(id: string, fn: (prev: MemberEditState) => MemberEditState) {
    setMemberEdits(prev => {
      const next = new Map(prev)
      const member = members.find(m => m.id === id)!
      const current = prev.get(id) ?? memberToEditState(member, firstPickupId)
      next.set(id, fn(current))
      return next
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

  const activeCount = members.filter(
    m => checkedMembers.has(m.id) && (m.membership_weeks_left ?? 0) > 0 && !m.has_order_this_week
  ).length

  return (
  <>
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: '#000000cc', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#1a1a1a', borderRadius: 14, padding: isMobile ? 16 : 24,
        width: '100%', maxWidth: 560, border: `1px solid #2a2a2a`,
        display: 'flex', flexDirection: 'column', gap: 20,
        boxSizing: 'border-box',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
          Nueva orden
        </h3>

        {/* Semana */}
        {type !== 'members' && (
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
        )}

        {/* Tipo */}
        <div>
          <label style={labelStyle}>Tipo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(type === 'extras')} onClick={() => { setType('extras'); setItems([emptyExtraRow(meals)]) }}>
              Extras
            </button>
            <button style={toggleStyle(type === 'cliente')} onClick={() => { setType('cliente'); setItems([emptyRow(meals, sizes)]) }}>
              Cliente
            </button>
            <button style={toggleStyle(type === 'members')} onClick={() => setType('members')}>
              Members
            </button>
          </div>
        </div>

        {/* ── EXTRAS / CLIENTE ── */}
        {type !== 'members' && (
          <>
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

            {/* Envío */}
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
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: type === 'extras' ? '1fr 56px 32px' : '1fr 120px 56px 32px', gap: 8, alignItems: 'center' }}>
                    <select
                      style={{ ...inputStyle, padding: '7px 10px' }}
                      value={row.mealId}
                      onChange={e => updateItem(idx, 'mealId', e.target.value)}
                    >
                      {meals.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>

                    {type !== 'extras' && (
                      <select
                        style={{ ...inputStyle, padding: '7px 10px' }}
                        value={row.sizeId}
                        onChange={e => updateItem(idx, 'sizeId', e.target.value)}
                      >
                        {sizes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}

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
                  onClick={() => setItems(prev => [...prev, type === 'extras' ? emptyExtraRow(meals) : emptyRow(meals, sizes)])}
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
                  onClick={() => setItems(type === 'extras'
                    ? meals.map(m => ({ mealId: m.id, sizeId: '', qty: 1 }))
                    : meals.map(m => ({ mealId: m.id, sizeId: sizes[0]?.id ?? '', qty: 1 }))
                  )}
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
          </>
        )}

        {/* ── MEMBERS TAB ── */}
        {type === 'members' && (() => {
          const activeMembers = members.filter(m => (m.membership_weeks_left ?? 0) > 0)
          const inactiveMembers = members.filter(m => (m.membership_weeks_left ?? 0) === 0)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.length === 0 && (
                <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>No hay miembros registrados.</p>
              )}

              {/* Activos */}
              {activeMembers.map(m => {
                const blocked = m.has_order_this_week
                const checked = checkedMembers.has(m.id)
                return (
                  <div key={m.id} style={{
                    borderRadius: 10,
                    border: `1px solid ${blocked ? '#252525' : '#2e2e2e'}`,
                    background: blocked ? '#161616' : '#1e1e1e',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px' }}>
                      <input
                        type="checkbox"
                        checked={checked && !blocked}
                        disabled={blocked}
                        onChange={e => setCheckedMembers(prev => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(m.id); else next.delete(m.id)
                          return next
                        })}
                        style={{ width: 16, height: 16, accentColor: colors.orange, cursor: blocked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ color: colors.white, fontSize: 14, fontWeight: 600 }}>{m.full_name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: colors.orange + '22', color: colors.orange }}>
                            {m.membership_weeks_left} sem
                          </span>
                          {blocked && (
                            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: '#7ac77a22', color: '#7ac77a' }}>
                              ya ordenó ✓
                            </span>
                          )}
                        </div>
                        {/* Item pills — edited state takes priority over last_order */}
                        {(() => {
                          const edit = memberEdits.get(m.id)
                          if (edit) {
                            const slots = edit.slots.filter(s => s.mealId)
                            return slots.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {slots.map((slot, i) => {
                                  const mealName = meals.find(ml => ml.id === slot.mealId)?.name ?? '?'
                                  const sizeName = m.membership_slots.find(s => s.size_id === slot.sizeId)?.size_name ?? slot.sizeId
                                  return (
                                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#ffffff0a', color: colors.textMuted, whiteSpace: 'nowrap' }}>
                                      {slot.qty}× {sizeName} {mealName}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : null
                          }
                          return m.last_order && m.last_order.items.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {m.last_order.items.map((item, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#ffffff0a', color: colors.textMuted, whiteSpace: 'nowrap' }}>
                                  {item.qty}× {item.size_name} {item.meal_name}
                                </span>
                              ))}
                            </div>
                          ) : null
                        })()}
                      </div>
                      {!blocked && (
                        <button
                          onClick={() => { setEditSnapshot(getMemberEdit(m)); setEditingMember(m.id) }}
                          style={{ padding: '4px 11px', borderRadius: 7, border: '1px solid #444', background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Inactivos — colapsados */}
              {inactiveMembers.length > 0 && (
                <details style={{ borderRadius: 10, border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                  <summary style={{
                    padding: '9px 14px', cursor: 'pointer', fontSize: 12,
                    color: colors.textMuted, background: '#161616',
                    listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ opacity: 0.5 }}>▶</span>
                    Inactivos ({inactiveMembers.length})
                  </summary>
                  <div style={{ background: '#161616', borderTop: '1px solid #1f1f1f' }}>
                    {inactiveMembers.map((m, i) => (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px',
                        borderTop: i > 0 ? '1px solid #1f1f1f' : 'none',
                      }}>
                        <span style={{ flex: 1, color: '#555', fontSize: 13 }}>{m.full_name}</span>
                        <button disabled style={{ padding: '4px 11px', borderRadius: 7, border: '1px solid #252525', background: 'transparent', color: '#3a3a3a', cursor: 'default', fontSize: 12 }}>
                          Recordar
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {memberResult && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: memberResult.errors.length > 0 ? '#ff808022' : '#7ac77a22', fontSize: 13 }}>
                  <span style={{ color: memberResult.errors.length > 0 ? '#ff9b9b' : '#7ac77a' }}>
                    {memberResult.created > 0 && `${memberResult.created} pedido${memberResult.created > 1 ? 's' : ''} creado${memberResult.created > 1 ? 's' : ''}.`}
                    {memberResult.errors.length > 0 && ` Errores: ${memberResult.errors.join(' · ')}`}
                  </span>
                </div>
              )}
            </div>
          )
        })()}

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
          {type === 'members' ? (
            <button
              onClick={handleCreateMemberOrders}
              disabled={pending || activeCount === 0}
              style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: activeCount === 0 ? '#333' : colors.orange, color: colors.white, cursor: activeCount === 0 ? 'default' : 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
            >
              {pending ? 'Creando…' : `Crear pedidos (${activeCount})`}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={pending}
              style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
            >
              {pending ? 'Creando…' : 'Crear orden'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* ── MINI-MODAL DE EDICIÓN DE MEMBER ── */}
    {editingMember && (() => {
      const m = members.find(x => x.id === editingMember)
      if (!m) return null
      const edit = getMemberEdit(m)
      const editValid = isBudgetValid(edit.slots, m.membership_slots)
        && edit.slots.every(s => s.mealId !== '')
      function cancelEdit() {
        if (editSnapshot && m) {
          const memberId = m.id
          setMemberEdits(prev => { const n = new Map(prev); n.set(memberId, editSnapshot); return n })
        }
        setEditingMember(null)
        setEditSnapshot(null)
      }
      function confirmEdit() {
        if (!editValid) return
        setEditingMember(null)
        setEditSnapshot(null)
      }
      return (
        <div
          onClick={cancelEdit}
          style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a1a1a', borderRadius: 14, padding: isMobile ? 16 : 24,
            width: '100%', maxWidth: 480, border: `1px solid #333`,
            display: 'flex', flexDirection: 'column', gap: 18,
            boxShadow: '0 24px 64px #000a',
            boxSizing: 'border-box',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: colors.white, fontSize: 15, fontWeight: 700 }}>{m.full_name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: colors.orange + '22', color: colors.orange, flexShrink: 0 }}>
                  {m.membership_weeks_left} sem
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={cancelEdit}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #444', background: 'transparent', color: colors.textMuted, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmEdit}
                  disabled={!editValid}
                  style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${editValid ? colors.orange : '#444'}`,
                    background: editValid ? colors.orange + '22' : 'transparent',
                    color: editValid ? colors.orange : '#555',
                    cursor: editValid ? 'pointer' : 'default',
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Entrega */}
            <div>
              <label style={labelStyle}>Entrega</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['pickup', 'standard', 'priority'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setMemberEdit(m.id, prev => ({ ...prev, shippingType: opt }))}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13,
                      border: `1px solid ${edit.shippingType === opt ? colors.orange : '#333'}`,
                      background: edit.shippingType === opt ? colors.orange + '22' : 'transparent',
                      color: edit.shippingType === opt ? colors.orange : colors.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    {opt === 'pickup' ? 'Pickup' : opt === 'standard' ? 'Estándar' : 'Prioritario'}
                  </button>
                ))}
              </div>
              {edit.shippingType === 'pickup' && pickupSpots.length > 0 && (
                <select
                  value={edit.pickupSpotId}
                  onChange={e => setMemberEdit(m.id, prev => ({ ...prev, pickupSpotId: e.target.value }))}
                  style={{ ...inputStyle, marginTop: 8, fontSize: 13 }}
                >
                  {pickupSpots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            {/* Presupuesto por talla */}
            {m.membership_slots.length > 0 && (() => {
              const used = usedPerSize(edit.slots)
              return (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {m.membership_slots.map(s => {
                    const u = used.get(s.size_id) ?? 0
                    const ok = u === s.total_qty
                    return (
                      <div key={s.size_id} style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${ok ? '#7ac77a44' : '#ff808044'}`,
                        background: ok ? '#7ac77a11' : '#ff808011',
                        color: ok ? '#7ac77a' : '#ff9b9b',
                      }}>
                        {s.size_name}: {u}/{s.total_qty}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Platillos — filas libres, solo limitadas al presupuesto */}
            <div>
              <label style={labelStyle}>Platillos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {edit.slots.map((slot, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 76px 44px 28px' : '1fr 100px 52px 32px', gap: isMobile ? 6 : 8, alignItems: 'center' }}>
                    <select
                      style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }}
                      value={slot.mealId}
                      onChange={e => setMemberEdit(m.id, prev => ({
                        ...prev,
                        slots: prev.slots.map((s, i) => i === idx ? { ...s, mealId: e.target.value } : s),
                      }))}
                    >
                      <option value="">— Platillo —</option>
                      {meals.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
                    </select>
                    <select
                      style={{ ...inputStyle, padding: '7px 8px', fontSize: 13 }}
                      value={slot.sizeId}
                      onChange={e => setMemberEdit(m.id, prev => ({
                        ...prev,
                        slots: prev.slots.map((s, i) => i === idx ? { ...s, sizeId: e.target.value } : s),
                      }))}
                    >
                      {m.membership_slots.map(s => (
                        <option key={s.size_id} value={s.size_id}>{s.size_name}</option>
                      ))}
                    </select>
                    <input
                      type="number" min={1}
                      style={{ ...inputStyle, padding: '7px 4px', textAlign: 'center', fontSize: 13 }}
                      value={slot.qty}
                      onChange={e => setMemberEdit(m.id, prev => ({
                        ...prev,
                        slots: prev.slots.map((s, i) => i === idx ? { ...s, qty: Math.max(1, parseInt(e.target.value) || 1) } : s),
                      }))}
                    />
                    <button
                      onClick={() => setMemberEdit(m.id, prev => ({ ...prev, slots: prev.slots.filter((_, i) => i !== idx) }))}
                      disabled={edit.slots.length === 1}
                      style={{ background: 'transparent', border: '1px solid #333', borderRadius: 6, color: edit.slots.length === 1 ? '#333' : '#ef4444', cursor: edit.slots.length === 1 ? 'default' : 'pointer', fontSize: 14, padding: '6px 0', width: '100%' }}
                    >×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const defaultSize = m.membership_slots[0]?.size_id ?? ''
                  setMemberEdit(m.id, prev => ({ ...prev, slots: [...prev.slots, { mealId: '', sizeId: defaultSize, qty: 1 }] }))
                }}
                style={{ marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 8, border: '1px dashed #333', background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 13 }}
              >
                + Fila
              </button>
            </div>
          </div>
        </div>
      )
    })()}
  </>
  )
}
