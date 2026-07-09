'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { colors } from '@/lib/theme'
import { useCartStore } from '@/lib/store/cart'
import type { OrderStatus } from '@/lib/types'

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

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: string
}

type ItemRow = {
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

export default function OrdenesClient({
  orders,
  items,
}: {
  orders: OrderRow[]
  items: ItemRow[]
}) {
  const [openId, setOpenId] = useState<string | null>(orders[0]?.id ?? null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const itemsByOrder = new Map<string, ItemRow[]>()
  for (const item of items) {
    const g = itemsByOrder.get(item.order_id) ?? []
    g.push(item)
    itemsByOrder.set(item.order_id, g)
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  const fmtAmt = (cents: number) => `$${(cents / 100).toFixed(0)} MXN`

  const handleAddToCart = (order: OrderRow) => {
    const orderItems = itemsByOrder.get(order.id) ?? []

    // Map original package_instance_id → new unique id so packages stay grouped
    const pkgIdMap = new Map<string, string>()
    const newPkgId = (origId: string) => {
      if (!pkgIdMap.has(origId)) pkgIdMap.set(origId, crypto.randomUUID())
      return pkgIdMap.get(origId)!
    }

    for (const item of orderItems) {
      addItem({
        mealId: item.meal_id,
        mealName: item.meals?.name ?? '',
        sizeId: item.size_id,
        sizeName: item.sizes?.name ?? '',
        qty: item.qty,
        unitPrice: item.unit_price,
        ...(item.package_instance_id
          ? { packageInstanceId: newPkgId(item.package_instance_id), packageName: 'Arma tu paquete' }
          : {}),
      })
    }
    setAddedId(order.id)
    setTimeout(() => {
      router.push('/cart')
    }, 600)
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.black, padding: '32px 24px 64px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link href="/cuenta" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 22, lineHeight: 1 }}>←</Link>
          <h1 style={{ margin: 0, color: colors.white, fontSize: 22, fontWeight: 700 }}>Mis pedidos</h1>
        </div>

        {orders.length === 0 ? (
          <div style={{
            background: colors.grayDark, borderRadius: 12, padding: 40, textAlign: 'center',
          }}>
            <p style={{ color: colors.textMuted, marginBottom: 20 }}>Aún no tienes pedidos.</p>
            <Link href="/menu" style={{ color: colors.orange, textDecoration: 'none', fontWeight: 600 }}>
              Ver menú →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((order) => {
              const isOpen = openId === order.id
              const orderItems = itemsByOrder.get(order.id) ?? []
              const status = order.status as OrderStatus
              const statusColor = STATUS_COLORS[status] ?? '#94a3b8'
              const wasAdded = addedId === order.id

              const pkgMap = new Map<string, ItemRow[]>()
              const individuals: ItemRow[] = []
              for (const item of orderItems) {
                if (item.package_instance_id) {
                  const g = pkgMap.get(item.package_instance_id) ?? []
                  g.push(item)
                  pkgMap.set(item.package_instance_id, g)
                } else {
                  individuals.push(item)
                }
              }

              return (
                <div
                  key={order.id}
                  style={{
                    background: colors.grayDark,
                    border: `1px solid ${colors.grayLight}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Collapsible header */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : order.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      padding: '16px 20px', background: 'transparent', border: 'none',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 700, color: colors.white }}>
                      {fmtDate(order.created_at)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{
                        background: statusColor + '22',
                        color: statusColor,
                        border: `1px solid ${statusColor}55`,
                        borderRadius: 20, padding: '3px 12px',
                        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span style={{ color: colors.textMuted, fontSize: 16 }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded items */}
                  {isOpen && (
                    <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${colors.grayLight}22` }}>
                      <div style={{ background: colors.black, borderRadius: 10, padding: '8px 16px 4px', marginTop: 12 }}>
                        {[...pkgMap.values()].map((grp, gi) => (
                          <div key={gi} style={{ marginBottom: 10 }}>
                            <div style={{
                              fontSize: 13, color: colors.orange, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
                            }}>
                              Paquete · ×{grp.reduce((s, i) => s + i.qty, 0)}
                            </div>
                            {grp.map((item, i) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '7px 0 7px 12px',
                                  borderBottom: i < grp.length - 1 ? `1px solid ${colors.grayLight}22` : 'none',
                                }}
                              >
                                <div>
                                  <span style={{ fontSize: 15, color: colors.white }}>{item.meals?.name ?? 'Platillo'}</span>
                                  <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>{item.sizes?.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                                  <span style={{ fontSize: 13, color: colors.textMuted }}>×{item.qty}</span>
                                  <span style={{ fontSize: 14, color: colors.white, minWidth: 60, textAlign: 'right' }}>
                                    {fmtAmt(item.unit_price * item.qty)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        {individuals.map((item, i) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '7px 0',
                              borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}22` : 'none',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: 15, color: colors.white }}>{item.meals?.name ?? 'Platillo'}</span>
                              <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>{item.sizes?.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                              <span style={{ fontSize: 13, color: colors.textMuted }}>×{item.qty}</span>
                              <span style={{ fontSize: 14, color: colors.white, minWidth: 60, textAlign: 'right' }}>
                                {fmtAmt(item.unit_price * item.qty)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div style={{
                          display: 'flex', justifyContent: 'flex-end',
                          paddingTop: 8, borderTop: `1px solid ${colors.grayLight}44`, marginTop: 4,
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: colors.orange }}>
                            Total: {fmtAmt(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Agregar al carrito */}
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleAddToCart(order)}
                          disabled={wasAdded}
                          style={{
                            background: wasAdded ? '#10b981' : colors.orange,
                            color: colors.white,
                            border: 'none',
                            fontWeight: 700, fontSize: 15,
                            borderRadius: 8, padding: '10px 20px',
                            cursor: wasAdded ? 'default' : 'pointer',
                            transition: 'background 0.2s',
                            fontFamily: 'inherit',
                          }}
                        >
                          {wasAdded ? '✓ Agregado' : 'Agregar al carrito'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
