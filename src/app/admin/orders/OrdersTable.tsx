'use client'

import { useState, useRef } from 'react'
import type { OrderWithCustomer, OrderStatus, OrderItem } from '@/lib/types'
import type { MatrixRow } from '@/lib/utils/production'
import { colors } from '@/lib/theme'
import { saveOrderNote } from '@/app/actions/orders'
import AssignExtraModal from './AssignExtraModal'
import type { CustomerBasic } from '@/lib/db/customers'

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
}: {
  orders: OrderWithCustomer[]
  weekStr: string  // 'YYYY-MM-DD' — string para evitar serialización RSC de Date
  matrixData: { rows: MatrixRow[]; mealColumns: { id: string; name: string }[] }
  customers: CustomerBasic[]
}) {
  const [activeTab, setActiveTab] = useState<'cliente' | 'receta'>('cliente')
  const [rutaMode, setRutaMode] = useState(false)
  const [assigningOrder, setAssigningOrder] = useState<OrderWithCustomer | null>(null)

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

  return (
    <div>
      {/* Tabs + Ruta toggle */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${colors.grayLight}`, marginBottom: 24 }}>
        <button style={tabStyle(activeTab === 'cliente')} onClick={() => setActiveTab('cliente')}>
          Por Cliente
        </button>
        <button style={tabStyle(activeTab === 'receta')} onClick={() => setActiveTab('receta')}>
          Por Receta
        </button>
        <div style={{ marginLeft: 'auto', paddingBottom: 2 }}>
          <button
            onClick={() => setRutaMode(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: rutaMode ? colors.orange : 'transparent',
              border: `1px solid ${rutaMode ? colors.orange : colors.grayLight}`,
              borderRadius: 20,
              padding: '5px 12px',
              cursor: 'pointer',
              color: rutaMode ? colors.white : colors.textMuted,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: rutaMode ? colors.white : colors.grayLight,
              flexShrink: 0,
            }} />
            Ruta
          </button>
        </div>
      </div>

      {/* Tab: Por Cliente */}
      {activeTab === 'cliente' && (() => {
        const displayOrders = rutaMode ? orders.filter(o => o.status === 'paid' || o.status === 'admin') : orders

        if (displayOrders.length === 0) {
          return <p style={{ color: colors.textMuted, fontSize: 14 }}>
            {rutaMode ? 'No hay órdenes pagadas esta semana.' : 'No hay órdenes esta semana.'}
          </p>
        }

        if (rutaMode) {
          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {['Nombre', 'Teléfono', 'Dirección', 'Envío', 'Notas'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ ...tdStyle, color: colors.white, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {order.customer_name || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                        {order.customer_phone || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: colors.textSecondary, minWidth: 180 }}>
                        {order.shipping_type === 'pickup'
                          ? <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Pickup</span>
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
        }

        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['#', 'Cliente', 'Items', 'Total', 'Envío', 'Estado', 'Notas', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {order.order_number}
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
                      {SHIPPING_LABELS[order.shipping_type] || order.shipping_type}
                      {order.shipping_cost > 0 && (
                        <span style={{ color: colors.textMuted, fontSize: 12 }}>
                          {' '}({formatAmount(order.shipping_cost)})
                        </span>
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
                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      <NoteInput orderId={order.id} value={notes[order.id] ?? ''} onChange={setNote} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Tab: Por Receta */}
      {activeTab === 'receta' && <MatrixView matrixData={matrixData} />}
    </div>
  )
}
