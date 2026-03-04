'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changeOrderStatus } from '@/app/actions/orders'
import type { OrderWithCustomer, OrderStatus } from '@/lib/types'
import { colors } from '@/lib/theme'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  paid: '#10b981',
  preparing: '#3b82f6',
  delivered: '#6b7280',
  cancelled: '#ef4444',
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'preparing', 'delivered', 'cancelled']

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${weekStart.toLocaleDateString('es-MX', opts)} – ${weekEnd.toLocaleDateString('es-MX', opts)}`
}

function formatAmount(centavos: number): string {
  return `$${(centavos / 100).toFixed(0)}`
}

const SHIPPING_LABELS: Record<string, string> = {
  standard: 'Estándar',
  priority: 'Prioridad',
  pickup: 'Pickup',
}

export default function OrdersTable({
  orders,
  weekStart,
}: {
  orders: OrderWithCustomer[]
  weekStart: Date
}) {
  const router = useRouter()
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())

  const navigate = (direction: -1 | 1) => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() + direction * 7)
    router.push(`/panel/orders?semana=${newDate.toISOString().split('T')[0]}`)
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setLoadingOrders(prev => new Set([...prev, orderId]))
    try {
      await changeOrderStatus(orderId, status)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOrders(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
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

  return (
    <div>
      {/* Navegación semanal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: colors.grayLight,
            border: 'none',
            color: colors.white,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ←
        </button>

        <span style={{ color: colors.white, fontWeight: 600, fontSize: 16, minWidth: 180, textAlign: 'center' }}>
          {formatWeekRange(weekStart)}
        </span>

        <button
          onClick={() => navigate(1)}
          style={{
            background: colors.grayLight,
            border: 'none',
            color: colors.white,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          →
        </button>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>
          No hay órdenes esta semana.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['#', 'Cliente', 'Items', 'Total', 'Envío', 'Estado', 'Cambiar'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  {/* Número */}
                  <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {order.order_number}
                  </td>

                  {/* Cliente */}
                  <td style={{ ...tdStyle, color: colors.white, minWidth: 160 }}>
                    <div style={{ fontWeight: 500 }}>{order.customer_name || '—'}</div>
                    {order.customer_phone && (
                      <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        {order.customer_phone}
                      </div>
                    )}
                  </td>

                  {/* Items */}
                  <td style={{ ...tdStyle, color: colors.textSecondary, minWidth: 200 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ whiteSpace: 'nowrap' }}>
                        {item.qty}× {item.meal_name}
                        {item.size_name ? ` (${item.size_name})` : ''}
                      </div>
                    ))}
                  </td>

                  {/* Total */}
                  <td style={{ ...tdStyle, color: colors.white, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatAmount(order.total_amount)}
                  </td>

                  {/* Envío */}
                  <td style={{ ...tdStyle, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {SHIPPING_LABELS[order.shipping_type] || order.shipping_type}
                    {order.shipping_cost > 0 && (
                      <span style={{ color: colors.textMuted, fontSize: 12 }}>
                        {' '}({formatAmount(order.shipping_cost)})
                      </span>
                    )}
                  </td>

                  {/* Badge estado */}
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

                  {/* Selector de estado */}
                  <td style={tdStyle}>
                    <select
                      value={order.status}
                      disabled={loadingOrders.has(order.id)}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      style={{
                        background: colors.grayLight,
                        border: '1px solid #444',
                        borderRadius: 6,
                        color: colors.white,
                        padding: '5px 8px',
                        fontSize: 13,
                        cursor: 'pointer',
                        opacity: loadingOrders.has(order.id) ? 0.5 : 1,
                      }}
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
