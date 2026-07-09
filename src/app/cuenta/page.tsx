import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { colors } from '@/lib/theme'
import PerfilForm from './perfil/PerfilForm'
import type { OrderStatus } from '@/lib/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  creado: 'En proceso',
  pending: 'Pendiente de pago',
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

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login')

  const admin = createAdminClient()

  const { data: customer } = await admin
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch last order + membership size in parallel, then fetch items
  const [lastOrderRes, sizeRes] = await Promise.all([
    customer
      ? admin.from('orders').select('id, order_number, created_at, total_amount, status')
          .eq('customer_id', customer.id)
          .in('status', ['paid', 'admin'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    customer?.membership_size_id
      ? admin.from('sizes').select('name').eq('id', customer.membership_size_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const lastOrder = lastOrderRes.data ?? null

  const { data: lastOrderItems } = lastOrder
    ? await admin.from('order_items')
        .select('id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name)')
        .eq('order_id', lastOrder.id)
    : { data: [] }
  const membershipSizeName = sizeRes.data?.name ?? null

  const initial = customer?.full_name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? '?'
  const memberSince = customer?.created_at
    ? new Date(customer.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : null

  const sectionStyle: React.CSSProperties = {
    background: colors.grayDark,
    border: `1px solid ${colors.grayLight}`,
    borderRadius: 14,
    padding: '20px 24px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.orange,
    marginBottom: 16,
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.black, padding: '32px 24px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Profile header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: colors.white, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.white }}>
              {customer?.full_name ?? 'Mi cuenta'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: colors.textMuted }}>
              {user.email}
              {memberSince && <span style={{ marginLeft: 10, color: colors.grayLight }}>· Desde {memberSince}</span>}
            </p>
          </div>
        </div>

        {/* ── Membresía ── */}
        {customer?.is_member && (
          <div style={{
            background: `${colors.orange}15`,
            border: `2px solid ${colors.orange}`,
            borderRadius: 14,
            padding: '18px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.orange }}>
                Membresía activa
              </span>
              <span style={{
                background: colors.orange, color: colors.white,
                borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
              }}>
                MIEMBRO
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: `${colors.orange}18`, borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.white }}>
                  {customer.membership_weeks_left}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
                  Semanas restantes
                </p>
              </div>
              {customer.membership_qty !== null && (
                <div style={{ background: `${colors.orange}18`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.white }}>
                    {customer.membership_qty}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
                    Comidas / semana
                  </p>
                </div>
              )}
              {membershipSizeName && (
                <div style={{ background: `${colors.orange}18`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.white }}>
                    {membershipSizeName}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
                    Talla
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Información personal ── */}
        <div style={sectionStyle}>
          <PerfilForm customer={customer} />
        </div>

        {/* ── Último pedido ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 0 }}>Último pedido</p>
            <Link
              href="/cuenta/ordenes"
              style={{
                fontSize: 14, color: colors.orange, textDecoration: 'none', fontWeight: 600,
                border: `1px solid ${colors.orange}`, borderRadius: 8,
                padding: '6px 14px', flexShrink: 0,
              }}
            >
              Ver todos →
            </Link>
          </div>

          {!lastOrder ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 12 }}>
                Aún no tienes pedidos.
              </p>
              <Link href="/menu" style={{ color: colors.orange, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                Ver menú →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Order header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <p style={{ margin: 0, color: colors.white, fontWeight: 700, fontSize: 18 }}>
                  {new Date(lastOrder.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: STATUS_COLORS[lastOrder.status as OrderStatus] + '22',
                    color: STATUS_COLORS[lastOrder.status as OrderStatus],
                    border: `1px solid ${STATUS_COLORS[lastOrder.status as OrderStatus]}55`,
                    borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600,
                  }}>
                    {STATUS_LABELS[lastOrder.status as OrderStatus]}
                  </span>
                </div>
              </div>

              {/* Items list */}
              {lastOrderItems && lastOrderItems.length > 0 && (() => {
                type Item = { id: string; qty: number; unit_price: number; package_instance_id: string | null; meals: { name: string } | null; sizes: { name: string } | null }
                const items = lastOrderItems as Item[]
                const pkgMap = new Map<string, Item[]>()
                const individuals: Item[] = []
                for (const item of items) {
                  if (item.package_instance_id) {
                    const g = pkgMap.get(item.package_instance_id) ?? []
                    g.push(item)
                    pkgMap.set(item.package_instance_id, g)
                  } else {
                    individuals.push(item)
                  }
                }
                const fmtAmt = (cents: number) => `$${(cents / 100).toFixed(0)} MXN`
                return (
                  <div style={{ background: colors.black, borderRadius: 10, padding: '8px 16px 4px' }}>
                    {[...pkgMap.values()].map((grp, gi) => (
                      <div key={gi} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 13, color: colors.orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          Paquete · ×{grp.reduce((s, i) => s + i.qty, 0)}
                        </div>
                        {grp.map((item, i) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 8px 12px', borderBottom: i < grp.length - 1 ? `1px solid ${colors.grayLight}22` : 'none' }}>
                            <div>
                              <span style={{ fontSize: 16, color: colors.white }}>{item.meals?.name ?? 'Platillo'}</span>
                              <span style={{ fontSize: 14, color: colors.textMuted, marginLeft: 8 }}>{item.sizes?.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                              <span style={{ fontSize: 14, color: colors.textMuted }}>×{item.qty}</span>
                              <span style={{ fontSize: 15, color: colors.white, minWidth: 60, textAlign: 'right' }}>{fmtAmt(item.unit_price * item.qty)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {individuals.map((item, i) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}22` : 'none' }}>
                        <div>
                          <span style={{ fontSize: 16, color: colors.white }}>{item.meals?.name ?? 'Platillo'}</span>
                          <span style={{ fontSize: 14, color: colors.textMuted, marginLeft: 8 }}>{item.sizes?.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: 14, color: colors.textMuted }}>×{item.qty}</span>
                          <span style={{ fontSize: 15, color: colors.white, minWidth: 60, textAlign: 'right' }}>{fmtAmt(item.unit_price * item.qty)}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${colors.grayLight}44`, marginTop: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: colors.orange }}>
                        Total: {fmtAmt(lastOrder.total_amount)}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Reorder button */}
              <Link
                href="/reorder"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 0',
                  background: colors.orange,
                  color: colors.white,
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Repetir pedido →
              </Link>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
