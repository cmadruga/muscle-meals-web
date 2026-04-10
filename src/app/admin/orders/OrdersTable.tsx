'use client'

import React, { useState, useRef } from 'react'
import type { OrderWithCustomer, OrderStatus, OrderItem } from '@/lib/types'
import type { MatrixRow } from '@/lib/utils/production'
import { colors } from '@/lib/theme'
import { saveOrderNote } from '@/app/actions/orders'
import AssignExtraModal from './AssignExtraModal'
import EditOrderModal from './EditOrderModal'
import type { CustomerBasic } from '@/lib/db/customers'

type Meal = { id: string; name: string }
type Size = { id: string; name: string }

const STATUS_LABELS: Record<OrderStatus, string> = {
  creado: 'Creado',
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  extra: 'Extra',
  admin: 'Admin',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  creado: '#94a3b8',
  pending: '#f59e0b',
  paid: '#10b981',
  cancelled: '#ef4444',
  extra: '#a855f7',
  admin: '#06b6d4',
}

function formatAmount(centavos: number): string {
  return `$${(centavos / 100).toFixed(0)}`
}

const SHIPPING_LABELS: Record<string, string> = {
  standard: 'Estándar',
  priority: 'Prioridad',
  pickup: 'Pickup',
}

function OrderItemsCell({ items }: { items: OrderItem[] }) {
  // Separate packages from individual items
  const packages = new Map<string, OrderItem[]>()
  const individual: OrderItem[] = []

  for (const item of items) {
    if (item.package_instance_id) {
      const grp = packages.get(item.package_instance_id) ?? []
      grp.push(item)
      packages.set(item.package_instance_id, grp)
    } else {
      individual.push(item)
    }
  }

  return (
    <div>
      {/* Paquetes agrupados */}
      {[...packages.values()].map((pkgItems, pkgIdx) => {
        const totalMeals = pkgItems.reduce((s, i) => s + i.qty, 0)
        return (
          <div key={pkgIdx} style={{ marginBottom: pkgIdx < packages.size - 1 || individual.length > 0 ? 6 : 0 }}>
            <div style={{ fontSize: 11, color: colors.orange, fontWeight: 700, marginBottom: 2 }}>
              Paquete · x{totalMeals}
            </div>
            {pkgItems.map((item, i) => (
              <div key={i} style={{ whiteSpace: 'nowrap', paddingLeft: 8, fontSize: 12 }}>
                {item.qty}× {item.meal_name}
                {item.size_name ? ` (${item.size_name})` : ''}
              </div>
            ))}
          </div>
        )
      })}
      {/* Items individuales */}
      {individual.map((item, i) => (
        <div key={i} style={{ whiteSpace: 'nowrap' }}>
          <span style={{ color: colors.orange, fontWeight: 700 }}>{item.qty}×</span> {item.meal_name}
          {item.size_name ? ` (${item.size_name})` : ''}
        </div>
      ))}
    </div>
  )
}

function MatrixView({
  matrixData,
}: {
  matrixData: { rows: MatrixRow[]; mealColumns: { id: string; name: string }[] }
}) {
  const { rows, mealColumns } = matrixData

  if (rows.length === 0) {
    return <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay datos esta semana.</p>
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
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    verticalAlign: 'top',
    borderBottom: '1px solid #2a2a2a',
  }

  // Compute per-meal totals for footer
  const mealPortionTotals = new Map<string, number>()
  for (const row of rows) {
    for (const col of mealColumns) {
      const cells = row.cells[col.id] ?? []
      const sum = cells.reduce((s, c) => s + c.qty, 0)
      mealPortionTotals.set(col.id, (mealPortionTotals.get(col.id) ?? 0) + sum)
    }
  }
  const grandTotal = rows.reduce((s, r) => s + r.totalPortions, 0)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>Cliente</th>
            {mealColumns.map(col => (
              <th key={col.id} style={{ ...thStyle, color: colors.orange }}>
                {col.name}
              </th>
            ))}
            <th style={thStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.orderId}>
              <td style={{ ...tdStyle, color: colors.white, fontWeight: 500, whiteSpace: 'nowrap' }}>
                <div>{row.customerName}</div>
                <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>{row.orderNumber}</div>
              </td>
              {mealColumns.map(col => {
                const cells = row.cells[col.id] ?? []
                return (
                  <td key={col.id} style={{ ...tdStyle, color: colors.textSecondary }}>
                    {cells.length === 0 ? (
                      <span style={{ color: colors.textMuted }}>—</span>
                    ) : (
                      cells.map((c, i) => (
                        <span key={i}>
                          {i > 0 ? ', ' : ''}
                          {c.qty}× {c.sizeName}
                        </span>
                      ))
                    )}
                  </td>
                )
              })}
              <td style={{ ...tdStyle, color: colors.white, fontWeight: 700 }}>
                {row.totalPortions}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#1a1a1a' }}>
            <td
              style={{
                padding: '10px 12px',
                color: colors.textMuted,
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              Total
            </td>
            {mealColumns.map(col => (
              <td
                key={col.id}
                style={{
                  padding: '10px 12px',
                  color: colors.white,
                  fontWeight: 700,
                }}
              >
                {mealPortionTotals.get(col.id) ?? 0}
              </td>
            ))}
            <td
              style={{
                padding: '10px 12px',
                color: colors.orange,
                fontWeight: 700,
              }}
            >
              {grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function NoteInput({
  orderId,
  value,
  onChange,
}: {
  orderId: string
  value: string
  onChange: (id: string, val: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(orderId, e.target.value)}
      placeholder="Notas..."
      style={{
        background: 'transparent',
        border: `1px solid ${colors.grayLight}`,
        borderRadius: 6,
        color: colors.white,
        padding: '5px 8px',
        fontSize: 13,
        width: '100%',
        outline: 'none',
        minWidth: 140,
      }}
    />
  )
}

export default function OrdersTable({
  orders,
  weekStr,
  matrixData,
  customers,
  meals,
  sizes,
}: {
  orders: OrderWithCustomer[]
  weekStr: string
  matrixData: { rows: MatrixRow[]; mealColumns: { id: string; name: string }[] }
  customers: CustomerBasic[]
  meals: Meal[]
  sizes: Size[]
}) {
  const [activeTab, setActiveTab] = useState<'ordenes' | 'empaquetado' | 'ruta'>('ordenes')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [assigningOrder, setAssigningOrder] = useState<OrderWithCustomer | null>(null)
  const [editingOrder, setEditingOrder] = useState<OrderWithCustomer | null>(null)
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)

  // Notas: inicializar desde DB (orders prop), guardar con debounce
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(orders.map(o => [o.id, o.note ?? '']))
  )
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const setNote = (orderId: string, value: string) => {
    setNotes(prev => ({ ...prev, [orderId]: value }))
    clearTimeout(noteTimers.current[orderId])
    noteTimers.current[orderId] = setTimeout(() => {
      saveOrderNote(orderId, value).catch(console.error)
    }, 600)
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
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    verticalAlign: 'top',
    borderBottom: '1px solid #2a2a2a',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    borderBottom: active ? `2px solid ${colors.orange}` : '2px solid transparent',
    color: active ? colors.white : colors.textMuted,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
  })

  function formatDate(isoStr: string) {
    const d = new Date(isoStr)
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { date, time }
  }

  function shippingSubtitle(order: OrderWithCustomer) {
    if (order.shipping_type === 'pickup') {
      return order.pickup_spot_name || order.pickup_spot_address || null
    }
    return order.customer_address || null
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${colors.grayLight}`, marginBottom: 24 }}>
        <button style={tabStyle(activeTab === 'ordenes')} onClick={() => setActiveTab('ordenes')}>
          Órdenes
        </button>
        <button style={tabStyle(activeTab === 'empaquetado')} onClick={() => setActiveTab('empaquetado')}>
          Empaquetado
        </button>
        <button style={tabStyle(activeTab === 'ruta')} onClick={() => setActiveTab('ruta')}>
          Ruta
        </button>
      </div>

      {/* Tab: Órdenes */}
      {activeTab === 'ordenes' && (() => {
        const q = search.trim().toLowerCase()
        const filtered = orders
          .filter(o => statusFilter === 'all' || o.status === statusFilter)
          .filter(o =>
            !q ||
            o.order_number.toLowerCase().includes(q) ||
            (o.customer_name ?? '').toLowerCase().includes(q) ||
            (o.customer_phone ?? '').toLowerCase().includes(q)
          )
        const displayOrders = [...filtered].sort((a, b) =>
          b.order_number.localeCompare(a.order_number)
        )

        const inputStyle: React.CSSProperties = {
          background: '#111', border: '1px solid #333', borderRadius: 8,
          padding: '8px 12px', color: '#fff', fontSize: 14,
          outline: 'none', boxSizing: 'border-box',
        }

        return (
          <>
            {/* Search + Status filter */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="search"
                placeholder="Buscar por # pedido, nombre o teléfono…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 240px', maxWidth: 360 }}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
                style={{ ...inputStyle, flex: '0 0 auto' }}
              >
                <option value="all">Todos los estados</option>
                {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {displayOrders.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 14 }}>
                {q ? 'Sin resultados.' : 'No hay órdenes esta semana.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['#', 'Cliente', 'Items', 'Total', 'Envío', 'Estado', ''].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrders.map(order => {
                      const noteOpen = openNoteId === order.id
                      const subtitle = shippingSubtitle(order)
                      const { date, time } = formatDate(order.created_at)
                      return (
                        <React.Fragment key={order.id}>
                          <tr>
                            <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                              <div>{order.order_number}</div>
                              <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{date} · {time}</div>
                            </td>
                            <td style={{ ...tdStyle, color: colors.white, minWidth: 160 }}>
                              <div style={{ fontWeight: 500 }}>{order.customer_name || '—'}</div>
                              {order.customer_phone && (
                                <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                                  {order.customer_phone}
                                </div>
                              )}
                            </td>
                            <td style={{ ...tdStyle, color: colors.textSecondary, minWidth: 200 }}>
                              <OrderItemsCell items={order.items} />
                            </td>
                            <td style={{ ...tdStyle, color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {formatAmount(order.total_amount)}
                            </td>
                            <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                              <div>{SHIPPING_LABELS[order.shipping_type] || order.shipping_type}
                                {order.shipping_cost > 0 && (
                                  <span style={{ color: colors.textMuted, fontSize: 12 }}>
                                    {' '}({formatAmount(order.shipping_cost)})
                                  </span>
                                )}
                              </div>
                              {subtitle && (
                                <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, maxWidth: 180, whiteSpace: 'normal' }}>
                                  {subtitle}
                                </div>
                              )}
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-block',
                                background: STATUS_COLORS[order.status] + '22',
                                color: STATUS_COLORS[order.status],
                                border: `1px solid ${STATUS_COLORS[order.status]}55`,
                                borderRadius: 20,
                                padding: '3px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {STATUS_LABELS[order.status]}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                  onClick={() => setOpenNoteId(id => id === order.id ? null : order.id)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 6,
                                    border: noteOpen ? `1px solid ${colors.grayLight}` : `1px solid #33333388`,
                                    background: noteOpen ? '#222' : 'transparent',
                                    color: notes[order.id] ? colors.white : colors.textMuted,
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                  }}
                                >
                                  {notes[order.id] ? '✎ Nota' : 'Nota'}
                                </button>
                                {(order.status === 'admin' || order.status === 'extra') && (
                                  <button
                                    onClick={() => setEditingOrder(order)}
                                    style={{
                                      padding: '5px 12px', borderRadius: 6, border: `1px solid ${colors.orange}55`,
                                      background: `${colors.orange}11`, color: colors.orange, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    }}
                                  >
                                    Editar
                                  </button>
                                )}
                                {order.status === 'extra' && order.items.length > 0 && (
                                  <button
                                    onClick={() => setAssigningOrder(order)}
                                    style={{
                                      padding: '5px 12px', borderRadius: 6, border: '1px solid #a855f755',
                                      background: '#a855f711', color: '#a855f7', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    }}
                                  >
                                    Asignar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {noteOpen && (
                            <tr>
                              <td colSpan={7} style={{ padding: '0 12px 12px', borderBottom: '1px solid #2a2a2a' }}>
                                <NoteInput orderId={order.id} value={notes[order.id] ?? ''} onChange={setNote} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      })()}

      {assigningOrder && (
        <AssignExtraModal
          order={assigningOrder}
          weekStr={weekStr}
          customers={customers}
          onClose={() => setAssigningOrder(null)}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          meals={meals}
          sizes={sizes}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* Tab: Empaquetado */}
      {activeTab === 'empaquetado' && (() => {
        const q = search.trim().toLowerCase()
        const sorted = [...matrixData.rows]
          .filter(r =>
            !q ||
            r.orderNumber.toLowerCase().includes(q) ||
            r.customerName.toLowerCase().includes(q)
          )
          .sort((a, b) => {
            const aIsExtra = a.orderStatus === 'extra' ? 1 : 0
            const bIsExtra = b.orderStatus === 'extra' ? 1 : 0
            if (aIsExtra !== bIsExtra) return aIsExtra - bIsExtra
            return a.orderNumber.localeCompare(b.orderNumber)
          })
        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <input
                type="search"
                placeholder="Buscar por # pedido o nombre…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: '#111', border: '1px solid #333', borderRadius: 8,
                  padding: '8px 12px', color: '#fff', fontSize: 14,
                  outline: 'none', width: '100%', maxWidth: 360, boxSizing: 'border-box',
                }}
              />
            </div>
            <MatrixView matrixData={{ ...matrixData, rows: sorted }} />
          </>
        )
      })()}

      {/* Tab: Ruta */}
      {activeTab === 'ruta' && (() => {
        const rutaOrders = [...orders]
          .filter(o => o.status === 'paid' || o.status === 'admin')
          .sort((a, b) => a.order_number.localeCompare(b.order_number))

        if (rutaOrders.length === 0) {
          return <p style={{ color: colors.textMuted, fontSize: 14 }}>No hay órdenes pagadas esta semana.</p>
        }

        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['#', 'Nombre', 'Teléfono', 'Dirección', 'Envío', 'Nota'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rutaOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {order.order_number}
                    </td>
                    <td style={{ ...tdStyle, color: colors.white, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {order.customer_name || '—'}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {order.customer_phone || '—'}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary, minWidth: 180 }}>
                      {order.shipping_type === 'pickup'
                        ? <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>{order.pickup_spot_name || 'Pickup'}</span>
                        : (order.customer_address || '—')}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {SHIPPING_LABELS[order.shipping_type] || order.shipping_type}
                    </td>
                    <td style={{ ...tdStyle, minWidth: 180 }}>
                      <NoteInput orderId={order.id} value={notes[order.id] ?? ''} onChange={setNote} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })()}

    </div>
  )
}
