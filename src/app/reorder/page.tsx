import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import RepetirClient from './RepetirClient'
import type { CartItem } from '@/lib/store/cart'

export const dynamic = 'force-dynamic'

export type PackageGroup = {
  instanceId: string
  items: CartItem[]
}

export default async function RepetirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login?next=/reorder')

  const admin = createAdminClient()

  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) redirect('/cuenta/login?next=/reorder')

  const { data: rawOrders } = await admin
    .from('orders')
    .select(`*, order_items(*, meals:meal_id(name), sizes:size_id(name))`)
    .eq('customer_id', customer.id)
    .not('status', 'in', '("extra","admin")')
    .order('created_at', { ascending: false })
    .limit(10)

  const lastOrder = rawOrders?.[0] ?? null

  type RawItem = {
    meal_id: string
    size_id: string
    qty: number
    unit_price: number
    package_instance_id?: string | null
    meals: { name: string } | null
    sizes: { name: string } | null
  }
  const rawItems: RawItem[] = (lastOrder as any)?.order_items ?? []

  if (!lastOrder || rawItems.length === 0) {
    return <RepetirClient packages={[]} individuals={[]} orderDate={null} orderNumber={null} />
  }

  // Precios actuales
  const sizeIds = [...new Set(rawItems.map(i => i.size_id))]
  const { data: sizes } = await admin.from('sizes').select('id, price').in('id', sizeIds)
  const priceMap = new Map(sizes?.map(s => [s.id, s.price as number]) ?? [])

  // Agrupar por package_instance_id
  const packageMap = new Map<string, RawItem[]>()
  const individualRaw: RawItem[] = []

  for (const item of rawItems) {
    if (item.package_instance_id) {
      const group = packageMap.get(item.package_instance_id) ?? []
      group.push(item)
      packageMap.set(item.package_instance_id, group)
    } else {
      individualRaw.push(item)
    }
  }

  const toCartItem = (i: RawItem, extra?: Partial<CartItem>): CartItem => ({
    mealId: i.meal_id,
    mealName: i.meals?.name ?? 'Platillo',
    sizeId: i.size_id,
    sizeName: i.sizes?.name ?? '',
    qty: i.qty,
    unitPrice: priceMap.get(i.size_id) ?? i.unit_price,
    ...extra,
  })

  const packages: PackageGroup[] = Array.from(packageMap.values()).map(group => {
    const instanceId = crypto.randomUUID()
    return {
      instanceId,
      items: group.map(i => toCartItem(i, { packageInstanceId: instanceId, packageName: 'Paquete' })),
    }
  })

  const individuals: CartItem[] = individualRaw.map(i => toCartItem(i))

  return (
    <RepetirClient
      packages={packages}
      individuals={individuals}
      orderDate={lastOrder.created_at}
      orderNumber={lastOrder.order_number}
    />
  )
}
