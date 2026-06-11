import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getOrdersByCustomerId } from '@/lib/db/orders'
import RepetirClient from './RepetirClient'
import type { CartItem } from '@/lib/store/cart'

export const dynamic = 'force-dynamic'

export default async function RepetirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login?next=/repetir')

  const admin = createAdminClient()

  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) redirect('/cuenta/login?next=/repetir')

  const orders = await getOrdersByCustomerId(supabase, customer.id)
  const lastOrder = orders.find(o => o.status !== 'extra' && o.status !== 'admin') ?? null

  if (!lastOrder || lastOrder.items.length === 0) {
    return <RepetirClient items={null} orderDate={null} orderNumber={null} />
  }

  // Precios actuales para cada size_id del pedido
  const sizeIds = [...new Set(lastOrder.items.map(i => i.size_id))]
  const { data: sizes } = await admin
    .from('sizes')
    .select('id, price')
    .in('id', sizeIds)

  const priceMap = new Map(sizes?.map(s => [s.id, s.price as number]) ?? [])

  const items: CartItem[] = lastOrder.items
    .filter(i => i.meal_id && i.size_id)
    .map(i => ({
      mealId: i.meal_id,
      mealName: i.meal_name ?? 'Platillo',
      sizeId: i.size_id,
      sizeName: i.size_name ?? '',
      qty: i.qty,
      unitPrice: priceMap.get(i.size_id) ?? i.unit_price,
    }))

  return (
    <RepetirClient
      items={items}
      orderDate={lastOrder.created_at}
      orderNumber={lastOrder.order_number}
    />
  )
}
