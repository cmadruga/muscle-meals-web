import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PedidosClient from './PedidosClient'
import type { OrderRow, ItemRow } from './PedidosClient'

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/cuenta/login')

  const admin = createAdminClient()

  const { data: customer } = await admin
    .from('customers').select('id').eq('user_id', user.id).maybeSingle()

  if (!customer) redirect('/cuenta')

  /* ── Fetch all orders (up to 50 for client-side filter) ── */
  const { data: ordersRaw } = await admin
    .from('orders')
    .select('id, created_at, total_amount, status, shipping_cost, order_number')
    .eq('customer_id', customer.id)
    .not('status', 'in', '("extra","admin")')
    .order('created_at', { ascending: false })
    .limit(50)

  const orders = (ordersRaw ?? []) as OrderRow[]

  /* ── Fetch items for all those orders ── */
  const orderIds = orders.map(o => o.id)
  const { data: itemsRaw } = orderIds.length > 0
    ? await admin.from('order_items')
        .select('id, order_id, meal_id, size_id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name)')
        .in('order_id', orderIds)
    : { data: [] }

  const items = (itemsRaw ?? []) as unknown as ItemRow[]

  /* ── Counts per status ── */
  const paid      = orders.filter(o => o.status === 'paid').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length
  const total     = orders.length
  const counts    = { paid, cancelled, total }

  /* ── Real total count (may exceed 50) ── */
  const { count: totalCount } = await admin
    .from('orders').select('id', { count: 'exact', head: true })
    .eq('customer_id', customer.id)
    .not('status', 'in', '("extra","admin")')

  return (
    <PedidosClient
      initialOrders={orders}
      items={items}
      counts={counts}
      totalCount={totalCount ?? total}
    />
  )
}
