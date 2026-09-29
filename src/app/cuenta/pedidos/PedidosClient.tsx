'use client'

import { useState } from 'react'
import { F } from '@/lib/ui-fonts'

/* ── Design tokens ── */
const C = {
  page:    '#0f0d0c',
  card:    '#141110',
  orange:  '#F79138',
  onOrange:'#17140f',
  text:    '#F5F1EC',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtAmt(cents: number) { return `$${(cents / 100).toFixed(0)} MXN` }
function fmtAmtShort(cents: number) { return `$${(cents / 100).toFixed(0)}` }

/* ── Types ── */
type SizeGroup = {
  sizeName: string
  items: { name: string; qty: number; unitPrice: number }[]
}

/* ── groupBySize — aggregates same-meal same-size into one row ── */
function groupBySize(items: ItemRow[]): SizeGroup[] {
  const SIZE_ORDER = ['LOW', 'FIT', 'PLUS', 'CUSTOM']
  const sizeMap = new Map<string, Map<string, { qty: number; unitPrice: number }>>()
  for (const item of items) {
    const sizeName = (item.sizes?.name ?? '?').toUpperCase()
    const mealName = item.meals?.name ?? 'Platillo'
    if (!sizeMap.has(sizeName)) sizeMap.set(sizeName, new Map())
    const mealMap = sizeMap.get(sizeName)!
    const existing = mealMap.get(mealName)
    if (existing) {
      existing.qty += item.qty
    } else {
      mealMap.set(mealName, { qty: item.qty, unitPrice: item.unit_price })
    }
  }
  return Array.from(sizeMap.entries())
    .sort(([a], [b]) => {
      const ai = SIZE_ORDER.indexOf(a)
      const bi = SIZE_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .map(([sizeName, mealMap]) => ({
      sizeName,
      items: Array.from(mealMap.entries()).map(([name, { qty, unitPrice }]) => ({ name, qty, unitPrice })),
    }))
}

/* ── SizeBlock component ── */
function SizeBlock({ group, isMobile = false }: { group: SizeGroup; isMobile?: boolean }) {
  const totalQty = group.items.reduce((s, i) => s + i.qty, 0)
  const subtotal = group.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  return (
    <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, background: 'rgba(0,0,0,.22)', overflow: 'hidden' }}>
      {/* Left rail — desktop only */}
      {!isMobile && (
        <div style={{ width: 92, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.06)', padding: '14px 0 14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ font: `700 24px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>{group.sizeName}</div>
          <div style={{ marginTop: 4, font: `400 11.5px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>{totalQty} platillo{totalQty !== 1 ? 's' : ''}</div>
        </div>
      )}
      {/* Right content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile header */}
        {isMobile && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'baseline', gap: 4, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <span style={{ font: `700 20px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>{group.sizeName}</span>
            <span style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', marginLeft: 4 }}>· {totalQty} platillo{totalQty !== 1 ? 's' : ''}</span>
          </div>
        )}
        {/* Items */}
        {group.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '8px 14px' : '9px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,.06)' : undefined }}>
            <span style={{
              minWidth: 30, textAlign: 'center', padding: '3px 6px', borderRadius: 5, fontSize: 12, fontWeight: 700,
              background: item.qty === 1 ? 'rgba(255,255,255,.06)' : 'rgba(247,145,56,.14)',
              color: item.qty === 1 ? 'rgba(245,241,236,.6)' : C.orange,
            }}>{item.qty}×</span>
            <span style={{ flex: 1, font: `500 ${isMobile ? 14 : 14.5}px/1.25 ${F.body}`, color: C.text }}>{item.name}</span>
            {item.qty > 1 && (
              <span style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.4)' }}>{fmtAmtShort(item.unitPrice)} c/u</span>
            )}
            <span style={{ width: 58, textAlign: 'right', font: `600 14px/1 ${F.body}`, color: 'rgba(245,241,236,.85)' }}>{fmtAmtShort(item.qty * item.unitPrice)}</span>
          </div>
        ))}
        {/* Block footer */}
        <div style={{ borderTop: '1px dashed rgba(255,255,255,.08)', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: `400 11.5px/1 ${F.body}`, color: 'rgba(245,241,236,.42)' }}>
            {group.sizeName} · {totalQty} platillo{totalQty !== 1 ? 's' : ''}
          </span>
          <span style={{ font: `600 13px/1 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>{fmtAmtShort(subtotal)}</span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const cfg: Record<string, { label: string; bg: string; border?: string; color: string }> = {
    paid:      { label: 'Pagado',    bg: 'rgba(47,168,116,.14)', border: '1px solid rgba(47,168,116,.4)',  color: '#4fce93' },
    cancelled: { label: 'Cancelado', bg: 'rgba(214,84,74,.12)', border: '1px solid rgba(214,84,74,.34)',  color: '#e08078' },
    creado:    { label: 'Creado',    bg: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.6)' },
    pending:   { label: 'Pendiente', bg: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.6)' },
    extra:     { label: 'Extra',     bg: 'rgba(168,85,247,.12)',  color: '#c084fc' },
    admin:     { label: 'Admin',     bg: 'rgba(6,182,212,.12)',   color: '#67e8f9' },
  }
  const c = cfg[status] ?? cfg.creado
  const pad = size === 'md' ? '5px 10px' : '4px 9px'
  return (
    <span style={{
      padding: pad, borderRadius: 20, flexShrink: 0,
      background: c.bg, border: c.border,
      font: `600 10.5px/1 ${F.body}`, letterSpacing: '.06em',
      textTransform: 'uppercase', color: c.color,
    }}>{c.label}</span>
  )
}

/* ── Types ── */
export type OrderRow = {
  id: string
  created_at: string
  total_amount: number
  status: string
  shipping_cost: number | null
  order_number: string | null
}
export type ItemRow = {
  id: string
  order_id: string
  meal_id: string
  size_id: string
  qty: number
  unit_price: number
  package_instance_id: string | null
  meals: { name: string } | null
  sizes: { name: string } | null
}
type Counts = { paid: number; pending: number; cancelled: number; total: number }

/* ── Component ── */
export default function PedidosClient({
  initialOrders,
  items,
  counts,
  totalCount,
}: {
  initialOrders: OrderRow[]
  items: ItemRow[]
  counts: Counts
  totalCount: number
}) {
  type Filter = 'todos' | 'paid' | 'pending' | 'cancelled'
  const [filter, setFilter]   = useState<Filter>('todos')
  const [openId, setOpenId]   = useState<string | null>(initialOrders[0]?.id ?? null)
  const [page, setPage]       = useState(1)

  const PAGE_SIZE = 10

  // Only the most recent paid order can be re-ordered
  const lastPaidId = initialOrders.find(o => o.status === 'paid')?.id ?? null

  const filtered = initialOrders.filter(o => {
    if (filter === 'todos') return true
    return o.status === filter
  })
  const displayed = filtered.slice(0, page * PAGE_SIZE)
  const hasMore   = filtered.length > displayed.length

  const itemsByOrder = new Map<string, ItemRow[]>()
  for (const item of items) {
    const g = itemsByOrder.get(item.order_id) ?? []
    g.push(item)
    itemsByOrder.set(item.order_id, g)
  }

  const filterPills: { key: Filter; label: string; count: number }[] = [
    { key: 'todos',     label: 'Todos',      count: counts.total },
    { key: 'paid',      label: 'Pagados',    count: counts.paid },
    { key: 'pending',   label: 'Pendientes', count: counts.pending },
    { key: 'cancelled', label: 'Cancelados', count: counts.cancelled },
  ]

  return (
    <>
      <style>{`
        body { background: ${C.page}; }
        .pd-row:hover { background: rgba(255,255,255,.025) !important; }
        .pd-btn:hover  { background: #ffa252 !important; }
        .pd-load:hover { background: rgba(255,255,255,.05) !important; }
        /* Mobile */
        .pd-desktop { display: block; }
        .pd-mobile  { display: none; }
        @media (max-width: 900px) {
          .pd-desktop { display: none !important; }
          .pd-mobile  { display: block !important; }
        }
      `}</style>

      {/* ══ DESKTOP ═══════════════════════════════════════════════════════════ */}
      <main className="pd-desktop" style={{ background: C.page, padding: '32px 40px 60px', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
          <h1 style={{ margin: 0, font: `700 44px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
            Mis <span style={{ color: C.orange }}>pedidos</span>
          </h1>
          <div style={{ display: 'flex', gap: 7 }}>
            {filterPills.map(p => (
              <button key={p.key} onClick={() => { setFilter(p.key); setPage(1) }} style={{
                padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                background: filter === p.key ? 'rgba(255,255,255,.09)' : 'transparent',
                border: filter === p.key ? 'none' : '1px solid rgba(255,255,255,.12)',
                font: `600 12px/1 ${F.body}`,
                color: filter === p.key ? C.text : 'rgba(245,241,236,.6)',
              }}>{p.label} · {p.count}</button>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
          {displayed.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', font: `400 14px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>
              No hay pedidos con este filtro.
            </div>
          ) : displayed.map((order, idx) => {
            const isOpen = openId === order.id
            const orderItems = itemsByOrder.get(order.id) ?? []
            const totalItems = orderItems.reduce((s, i) => s + i.qty, 0)
            const shipping   = order.shipping_cost ?? 0
            const subtotal   = order.total_amount - shipping
            const groups     = groupBySize(orderItems)

            return (
              <div key={order.id} style={{ borderBottom: idx < displayed.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                {/* Row header */}
                <div
                  className={isOpen ? '' : 'pd-row'}
                  onClick={() => setOpenId(isOpen ? null : order.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px',
                    cursor: 'pointer',
                    background: isOpen ? 'rgba(247,145,56,.05)' : 'transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: `600 15px/1 ${F.body}`, color: C.text }}>{fmtDate(order.created_at)}</div>
                    <div style={{ marginTop: 5, font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>
                      {totalItems} platillo{totalItems !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <StatusBadge status={order.status} size="md" />
                  <span style={{ width: 92, textAlign: 'right', font: isOpen ? `700 19px/1 ${F.display}` : `600 15px/1 ${F.body}`, color: order.status === 'cancelled' ? 'rgba(245,241,236,.45)' : C.text }}>
                    {fmtAmt(order.total_amount)}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isOpen ? C.orange : 'rgba(245,241,236,.45)'} strokeWidth="2.6" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                  </svg>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', background: 'rgba(247,145,56,.05)' }}>
                    {/* Bloques por tamaño */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                      {groups.map((group) => (
                        <SizeBlock key={group.sizeName} group={group} />
                      ))}
                    </div>

                    {/* Footer: subtotals + reorder */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 14 }}>
                      <div style={{ font: `400 12.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>
                        Subtotal {fmtAmtShort(subtotal)}
                        {shipping > 0 && ` · envío ${fmtAmtShort(shipping)}`}
                      </div>
                      {order.id === lastPaidId && (
                        <a href="/reorder" className="pd-btn" style={{
                          flexShrink: 0, padding: '13px 22px', border: 'none', borderRadius: 8,
                          background: C.orange, color: C.onOrange,
                          font: `700 17px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase',
                          textDecoration: 'none',
                        }}>
                          Volver a pedir →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hasMore && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="pd-load" onClick={() => setPage(p => p + 1)} style={{ display: 'inline-block', padding: '12px 26px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 8, background: 'transparent', font: `600 12.5px/1 ${F.body}`, color: C.text, cursor: 'pointer' }}>
              Cargar 10 pedidos más
            </button>
          </div>
        )}
      </main>

      {/* ══ MOBILE ════════════════════════════════════════════════════════════ */}
      <main className="pd-mobile" style={{ background: C.page, minHeight: '100vh' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 6px' }}>
          <h1 style={{ margin: 0, font: `700 30px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
            Mis <span style={{ color: C.orange }}>pedidos</span>
          </h1>
          <span style={{ font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>{totalCount}</span>
        </div>

        {/* Filter pills (scroll horizontal) */}
        <div style={{ display: 'flex', gap: 7, padding: '14px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,.07)', WebkitOverflowScrolling: 'touch' }}>
          {filterPills.map(p => (
            <button key={p.key} onClick={() => { setFilter(p.key); setPage(1) }} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
              background: filter === p.key ? 'rgba(255,255,255,.09)' : 'transparent',
              border: filter === p.key ? 'none' : '1px solid rgba(255,255,255,.12)',
              font: `600 12px/1 ${F.body}`,
              color: filter === p.key ? C.text : 'rgba(245,241,236,.6)',
            }}>{p.label} · {p.count}</button>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', font: `400 14px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>No hay pedidos con este filtro.</div>
          ) : displayed.map((order, idx) => {
            const isOpen = openId === order.id
            const orderItems = itemsByOrder.get(order.id) ?? []
            const totalItems = orderItems.reduce((s, i) => s + i.qty, 0)
            const shipping   = order.shipping_cost ?? 0
            const subtotal   = order.total_amount - shipping
            const groups     = groupBySize(orderItems)

            if (isOpen) {
              return (
                <div key={order.id} style={{ background: C.card, border: '1px solid rgba(247,145,56,.3)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  {/* Open header */}
                  <div onClick={() => setOpenId(null)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '15px 16px 13px', background: 'rgba(247,145,56,.05)', cursor: 'pointer' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: `600 14.5px/1 ${F.body}`, color: C.text }}>{fmtDate(order.created_at)}</div>
                      <div style={{ marginTop: 5, font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>{totalItems} platillo{totalItems !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
                      <StatusBadge status={order.status} />
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.6" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                    </div>
                  </div>

                  {/* Open body */}
                  <div style={{ padding: '12px 14px 16px', background: 'rgba(247,145,56,.03)' }}>
                    {/* Bloques por tamaño (mobile) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      {groups.map((group) => (
                        <SizeBlock key={group.sizeName} group={group} isMobile />
                      ))}
                    </div>

                    {/* Subtotals */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 13 }}>
                      <span style={{ font: `400 11.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>
                        Subtotal {fmtAmtShort(subtotal)}{shipping > 0 ? ` · envío ${fmtAmtShort(shipping)}` : ''}
                      </span>
                      <span style={{ flexShrink: 0, font: `700 18px/1 ${F.display}`, color: C.text }}>{fmtAmtShort(order.total_amount)}</span>
                    </div>

                    {/* Reorder */}
                    {order.id === lastPaidId && (
                      <a href="/reorder" className="pd-btn" style={{
                        display: 'block', width: '100%', boxSizing: 'border-box',
                        marginTop: 14, padding: '15px 0', border: 'none', borderRadius: 9,
                        background: C.orange, color: C.onOrange,
                        font: `700 18px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase',
                        textDecoration: 'none', textAlign: 'center',
                      }}>
                        Volver a pedir →
                      </a>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div key={order.id} onClick={() => setOpenId(order.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: `600 14px/1 ${F.body}`, color: C.text }}>{fmtDate(order.created_at)}</div>
                  <div style={{ marginTop: 5, font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>
                    {totalItems} platillo{totalItems !== 1 ? 's' : ''} · {fmtAmtShort(order.total_amount)}
                  </div>
                </div>
                <StatusBadge status={order.status} />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.45)" strokeWidth="2.6" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            )

            // suppress unused var warning
            void idx
          })}

          {hasMore && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button className="pd-load" onClick={() => setPage(p => p + 1)} style={{ display: 'inline-block', padding: '13px 24px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, background: 'transparent', font: `600 12.5px/1 ${F.body}`, color: C.text, cursor: 'pointer' }}>
                Cargar 10 más
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
