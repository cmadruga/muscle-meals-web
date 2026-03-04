import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { colors } from '@/lib/theme'
import type { OrderStatus } from '@/lib/types'

export default async function MisOrdenesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: orders } = customer
    ? await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  return (
    <main style={{ minHeight: '100vh', background: colors.black, padding: '32px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ color: colors.white, fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          Mis órdenes
        </h1>

        {!orders || orders.length === 0 ? (
          <div style={{
            background: colors.grayDark,
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
          }}>
            <p style={{ color: colors.textMuted, marginBottom: 20 }}>
              Aún no tienes órdenes.
            </p>
            <Link href="/menu" style={{ color: colors.orange, textDecoration: 'none', fontWeight: 600 }}>
              Ver menú →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: colors.grayDark,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ color: colors.white, fontWeight: 700, fontSize: 15 }}>
                    {order.order_number}
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 12 }}>
                    {new Date(order.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: colors.white, fontWeight: 600 }}>
                    ${(order.total_amount / 100).toFixed(0)} MXN
                  </span>
                  <StatusBadge status={order.status as OrderStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

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

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span style={{
      background: STATUS_COLORS[status] + '22',
      color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}55`,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
