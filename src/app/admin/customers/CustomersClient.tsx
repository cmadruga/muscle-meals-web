'use client'

import { useState, useEffect, useRef } from 'react'
import { colors } from '@/lib/theme'
import type { CustomerRow, CustomerOrder } from './page'

const STATUS_LABELS: Record<string, string> = {
  creado: 'En proceso', pending: 'Pendiente', paid: 'Pagado',
  cancelled: 'Cancelado', extra: 'Extra', admin: 'Admin',
}
const STATUS_COLORS: Record<string, string> = {
  creado: '#94a3b8', pending: '#f59e0b', paid: '#10b981',
  cancelled: '#ef4444', extra: '#a855f7', admin: '#06b6d4',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtAmt(cents: number) {
  return `$${(cents / 100).toFixed(0)} MXN`
}

function OrderDetail({ items, total }: { items: CustomerOrder['items']; total: number }) {
  const packages = new Map<string, typeof items>()
  const individuals: typeof items = []
  for (const i of items) {
    if (i.package_instance_id) {
      const g = packages.get(i.package_instance_id) ?? []
      g.push(i)
      packages.set(i.package_instance_id, g)
    } else {
      individuals.push(i)
    }
  }

  return (
    <div style={{
      margin: '0 0 0 0',
      background: colors.black,
      borderTop: `1px solid ${colors.grayLight}33`,
      padding: '12px 20px 14px',
    }}>
      {[...packages.values()].map((grp, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: colors.orange, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Paquete · ×{grp.reduce((s, i) => s + i.qty, 0)}
          </div>
          {grp.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0 5px 12px',
              borderBottom: i < grp.length - 1 ? `1px solid ${colors.grayLight}22` : 'none',
            }}>
              <div>
                <span style={{ fontSize: 13, color: colors.white }}>{item.meal_name}</span>
                <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>{item.size_name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
                <span style={{ fontSize: 12, color: colors.white, minWidth: 60, textAlign: 'right' }}>
                  {fmtAmt(item.unit_price * item.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
      {individuals.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {individuals.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0',
              borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}22` : 'none',
            }}>
              <div>
                <span style={{ fontSize: 13, color: colors.white }}>{item.meal_name}</span>
                <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>{item.size_name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
                <span style={{ fontSize: 12, color: colors.white, minWidth: 60, textAlign: 'right' }}>
                  {fmtAmt(item.unit_price * item.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        paddingTop: 8, borderTop: `1px solid ${colors.grayLight}44`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>
          Total: {fmtAmt(total)}
        </span>
      </div>
    </div>
  )
}

function CustomerCard({
  customer,
  isHighlight,
  highlightRef,
}: {
  customer: CustomerRow
  isHighlight: boolean
  highlightRef: React.RefObject<HTMLDivElement | null>
}) {
  const [openOrder, setOpenOrder] = useState<string | null>(null)

  const paidTotal = customer.orders
    .filter(o => o.status === 'paid')
    .reduce((s, o) => s + o.total_amount, 0)

  return (
    <div
      ref={isHighlight ? highlightRef : null}
      style={{
        background: colors.grayDark,
        border: `1px solid ${isHighlight ? colors.orange : colors.grayLight}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Customer info */}
      <div style={{ padding: '18px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.white, marginBottom: 4 }}>
            {customer.full_name}
          </div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
            {customer.email}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {customer.phone ? (
              <a
                href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#10b981', textDecoration: 'none' }}
              >
                📱 {customer.phone}
              </a>
            ) : (
              <span style={{ fontSize: 13, color: colors.grayLight }}>Sin teléfono</span>
            )}
          </div>
          {customer.address ? (
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 1.4 }}>
              📍 {customer.address}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: colors.grayLight, marginTop: 6 }}>Sin dirección guardada</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.orange }}>{fmtAmt(paidTotal)}</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {customer.orders.length} {customer.orders.length === 1 ? 'pedido' : 'pedidos'}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
            Cliente desde {fmtDate(customer.created_at)}
          </div>
        </div>
      </div>

      {/* Orders */}
      {customer.orders.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.grayLight}` }}>
          {customer.orders.map((order, idx) => {
            const isOpen = openOrder === order.id
            const sc = STATUS_COLORS[order.status] ?? colors.textMuted
            return (
              <div key={order.id}>
                <div
                  onClick={() => setOpenOrder(isOpen ? null : order.id)}
                  style={{
                    padding: '13px 20px',
                    borderBottom: !isOpen && idx < customer.orders.length - 1
                      ? `1px solid ${colors.grayLight}33`
                      : 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer',
                    background: isOpen ? colors.black + '88' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: colors.white, minWidth: 80 }}>
                      {order.order_number}
                    </span>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{fmtDate(order.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>{fmtAmt(order.total_amount)}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: sc,
                      background: sc + '22', border: `1px solid ${sc}55`,
                      borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
                    }}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <OrderDetail items={order.items} total={order.total_amount} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CustomersClient({
  customers,
  highlightId,
}: {
  customers: CustomerRow[]
  highlightId: string | null
}) {
  const [search, setSearch] = useState('')
  const highlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  const q = search.toLowerCase()
  const filtered = q
    ? customers.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
      )
    : customers

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.white, margin: 0 }}>Clientes</h1>
        <span style={{ fontSize: 13, color: colors.textMuted }}>{customers.length} cuentas</span>
      </div>

      <input
        placeholder="Buscar por nombre, email o teléfono…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 400, padding: '8px 14px', marginBottom: 20,
          background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, color: colors.white, fontSize: 14,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <p style={{ color: colors.textMuted }}>Sin resultados.</p>
        )}
        {filtered.map(c => (
          <CustomerCard
            key={c.id}
            customer={c}
            isHighlight={c.id === highlightId}
            highlightRef={c.id === highlightId ? highlightRef : { current: null }}
          />
        ))}
      </div>
    </div>
  )
}
