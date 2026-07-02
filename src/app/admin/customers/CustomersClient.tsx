'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { colors } from '@/lib/theme'
import { sendReorderBroadcast } from '@/app/actions/whatsapp'
import type { CustomerRow, CustomerOrder } from './page'

const STATUS_LABELS: Record<string, string> = {
  creado: 'En proceso', pending: 'Pendiente', paid: 'Pagado',
  cancelled: 'Cancelado', extra: 'Extra', admin: 'Admin',
}
const STATUS_COLORS: Record<string, string> = {
  creado: '#94a3b8', pending: '#f59e0b', paid: '#10b981',
  cancelled: '#ef4444', extra: '#a855f7', admin: '#06b6d4',
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtAmt(cents: number) {
  return `$${(cents / 100).toFixed(0)} MXN`
}
function lastOrderTs(c: CustomerRow): number {
  return c.orders[0] ? new Date(c.orders[0].created_at).getTime() : new Date(c.created_at).getTime()
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
    <div style={{ background: colors.black, borderTop: `1px solid ${colors.grayLight}33`, padding: '12px 20px 14px' }}>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${colors.grayLight}44` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>Total: {fmtAmt(total)}</span>
      </div>
    </div>
  )
}

function CustomerCard({ customer, isHighlight, highlightRef }: {
  customer: CustomerRow
  isHighlight: boolean
  highlightRef: React.RefObject<HTMLDivElement | null>
}) {
  const [openOrder, setOpenOrder] = useState<string | null>(null)
  const paidTotal = customer.orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0)

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
      <div style={{ padding: '18px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.white, marginBottom: 4 }}>{customer.full_name}</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{customer.email}</div>
          <div>
            {customer.phone ? (
              <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#10b981', textDecoration: 'none' }}>
                📱 {customer.phone}
              </a>
            ) : (
              <span style={{ fontSize: 13, color: colors.grayLight }}>Sin teléfono</span>
            )}
          </div>
          {customer.address
            ? <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 1.4 }}>📍 {customer.address}</div>
            : <div style={{ fontSize: 12, color: colors.grayLight, marginTop: 6 }}>Sin dirección guardada</div>
          }
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
                    borderBottom: !isOpen && idx < customer.orders.length - 1 ? `1px solid ${colors.grayLight}33` : 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer',
                    background: isOpen ? colors.black + '88' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: colors.white, minWidth: 80 }}>{order.order_number}</span>
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
                {isOpen && <OrderDetail items={order.items} total={order.total_amount} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WhatsAppModal({ sorted, onClose }: { sorted: CustomerRow[]; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<Set<string>>(() => {
    const now = Date.now()
    return new Set(
      sorted
        .filter(c => c.phone && c.orders[0] && now - new Date(c.orders[0].created_at).getTime() < TWO_WEEKS_MS)
        .map(c => c.id)
    )
  })

  const q = search.toLowerCase()
  const visible = q
    ? sorted.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    : sorted

  const visibleSelectable = visible.filter(c => c.phone)
  const allChecked = visibleSelectable.length > 0 && visibleSelectable.every(c => selected.has(c.id))
  const someChecked = visibleSelectable.some(c => selected.has(c.id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someChecked && !allChecked
      selectAllRef.current.checked = allChecked
    }
  }, [allChecked, someChecked])

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleSelectAll = () => {
    if (allChecked) {
      setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.delete(c.id)); return n })
    } else {
      setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.add(c.id)); return n })
    }
  }

  const handleSend = async () => {
    const recipients = sorted
      .filter(c => selected.has(c.id) && c.phone)
      .map(c => ({ phone: c.phone!, firstName: c.full_name.split(' ')[0] }))
    if (recipients.length === 0) return

    setSending(true)
    setResult(null)
    try {
      const { sent, failed } = await sendReorderBroadcast(recipients)
      setResult(failed === 0
        ? `✅ ${sent} mensajes enviados correctamente`
        : `✅ ${sent} enviados · ❌ ${failed} fallaron`)
    } catch {
      setResult('❌ Error al enviar — revisa los logs del servidor')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
      }}
    >
      <div style={{
        background: colors.grayDark,
        border: `1px solid ${colors.grayLight}`,
        borderRadius: 12,
        width: '100%', maxWidth: 440,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>Enviar WhatsApp</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Template: reordenar · {selected.size} seleccionados</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
          </div>

          {/* Search */}
          <input
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 12px', marginBottom: 12,
              background: colors.black, border: `1px solid ${colors.grayLight}`,
              borderRadius: 7, color: colors.white, fontSize: 13,
              boxSizing: 'border-box',
            }}
          />

          {/* Select all */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              ref={selectAllRef}
              type="checkbox"
              onChange={handleSelectAll}
              style={{ width: 15, height: 15, accentColor: colors.orange, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              Seleccionar todos · {visibleSelectable.length} con teléfono
            </span>
          </label>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px' }}>
          {visible.map((c, idx) => {
            const canSelect = !!c.phone
            return (
              <label
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0',
                  borderBottom: idx < visible.length - 1 ? `1px solid ${colors.grayLight}22` : 'none',
                  cursor: canSelect ? 'pointer' : 'default',
                  opacity: canSelect ? 1 : 0.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => canSelect && toggle(c.id)}
                  disabled={!canSelect}
                  style={{ width: 15, height: 15, accentColor: colors.orange, cursor: canSelect ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: colors.white }}>{c.full_name}</div>
                  {c.phone && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{c.phone}</div>}
                </div>
                {!canSelect && <span style={{ fontSize: 11, color: colors.textMuted, flexShrink: 0 }}>sin tel.</span>}
              </label>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          {result && (
            <div style={{
              padding: '8px 12px', marginBottom: 12,
              background: result.startsWith('✅') ? '#10b98118' : '#ef444418',
              border: `1px solid ${result.startsWith('✅') ? '#10b98144' : '#ef444444'}`,
              borderRadius: 8, fontSize: 13, color: colors.white,
            }}>
              {result}
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            style={{
              width: '100%', padding: '11px 20px',
              background: selected.size === 0 ? colors.grayLight : colors.orange,
              color: colors.white, border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700,
              cursor: selected.size === 0 || sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Enviando…' : `Enviar a ${selected.size} ${selected.size === 1 ? 'cliente' : 'clientes'} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersClient({ customers, highlightId }: {
  customers: CustomerRow[]
  highlightId: string | null
}) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const highlightRef = useRef<HTMLDivElement | null>(null)

  const sorted = useMemo(() =>
    [...customers].sort((a, b) => lastOrderTs(b) - lastOrderTs(a)),
    [customers]
  )

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  const q = search.toLowerCase()
  const filtered = q
    ? sorted.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
      )
    : sorted

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.white, margin: 0 }}>Clientes</h1>
          <span style={{ fontSize: 13, color: colors.textMuted }}>{customers.length} cuentas</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: '9px 20px',
            background: colors.orange,
            color: colors.white, border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Enviar WhatsApp
        </button>
      </div>

      <input
        placeholder="Buscar por nombre, email o teléfono…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 400, padding: '8px 14px', marginBottom: 20,
          background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, color: colors.white, fontSize: 14, boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && <p style={{ color: colors.textMuted }}>Sin resultados.</p>}
        {filtered.map(c => (
          <CustomerCard
            key={c.id}
            customer={c}
            isHighlight={c.id === highlightId}
            highlightRef={c.id === highlightId ? highlightRef : { current: null }}
          />
        ))}
      </div>

      {modalOpen && <WhatsAppModal sorted={sorted} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
