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

export type SkippedSlot = {
  key: string
  originalMealName: string
  sizeId: string
  sizeName: string
  qty: number
  unitPrice: number
  packageInstanceId?: string
}

export type ActiveMealOption = {
  id: string
  name: string
  imageUrl?: string
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
    return (
      <RepetirClient
        packages={[]} individuals={[]} skippedSlots={[]} activeMealOptions={[]}
        orderDate={null} orderNumber={null}
      />
    )
  }

  const allMealIds = [...new Set(rawItems.map(i => i.meal_id))]
  const allSizeIds = [...new Set(rawItems.map(i => i.size_id))]

  const [
    { data: activeMealsInOrder },
    { data: allActiveMeals },
    { data: sizes },
  ] = await Promise.all([
    admin.from('meals').select('id').in('id', allMealIds).eq('active', true),
    admin.from('meals').select('id, name, img').eq('active', true).order('name'),
    admin.from('sizes').select('id, price').in('id', allSizeIds),
  ])

  const activeMealIdSet = new Set(activeMealsInOrder?.map(m => m.id) ?? [])
  const priceMap = new Map(sizes?.map(s => [s.id, s.price as number]) ?? [])
  const activeMealOptions: ActiveMealOption[] = allActiveMeals?.map(m => ({ id: m.id, name: m.name, imageUrl: m.img ?? undefined })) ?? []

  const activeItems = rawItems.filter(i => activeMealIdSet.has(i.meal_id))
  const skippedItems = rawItems.filter(i => !activeMealIdSet.has(i.meal_id))

  const toCartItem = (i: RawItem, extra?: Partial<CartItem>): CartItem => ({
    mealId: i.meal_id,
    mealName: i.meals?.name ?? 'Platillo',
    sizeId: i.size_id,
    sizeName: i.sizes?.name ?? '',
    qty: i.qty,
    unitPrice: priceMap.get(i.size_id) ?? i.unit_price,
    ...extra,
  })

  // Build packages first so we can map original → new instanceId
  const packageMap = new Map<string, RawItem[]>()
  const individualRaw: RawItem[] = []

  for (const item of activeItems) {
    if (item.package_instance_id) {
      const group = packageMap.get(item.package_instance_id) ?? []
      group.push(item)
      packageMap.set(item.package_instance_id, group)
    } else {
      individualRaw.push(item)
    }
  }

  // original DB id → new cart instanceId
  const packageInstanceIdMap = new Map<string, string>()

  const packages: PackageGroup[] = Array.from(packageMap.entries()).map(([originalId, group]) => {
    const instanceId = crypto.randomUUID()
    packageInstanceIdMap.set(originalId, instanceId)
    return {
      instanceId,
      items: group.map(i => toCartItem(i, { packageInstanceId: instanceId, packageName: 'Arma tu paquete' })),
    }
  })

  const individuals: CartItem[] = individualRaw.map(i => toCartItem(i))

  // For packages where ALL items were skipped (no active items), also assign a new shared instanceId
  const skippedOnlyPackageMap = new Map<string, string>()
  for (const item of skippedItems) {
    if (item.package_instance_id && !packageInstanceIdMap.has(item.package_instance_id)) {
      if (!skippedOnlyPackageMap.has(item.package_instance_id)) {
        skippedOnlyPackageMap.set(item.package_instance_id, crypto.randomUUID())
      }
    }
  }

  const skippedSlots: SkippedSlot[] = skippedItems.map((item, idx) => ({
    key: `skipped-${idx}`,
    originalMealName: item.meals?.name ?? 'Platillo',
    sizeId: item.size_id,
    sizeName: item.sizes?.name ?? '',
    qty: item.qty,
    unitPrice: priceMap.get(item.size_id) ?? item.unit_price,
    // Use the same new instanceId as the active items from this package
    packageInstanceId: item.package_instance_id
      ? (packageInstanceIdMap.get(item.package_instance_id) ?? skippedOnlyPackageMap.get(item.package_instance_id))
      : undefined,
  }))

  return (
    <RepetirClient
      packages={packages}
      individuals={individuals}
      skippedSlots={skippedSlots}
      activeMealOptions={activeMealOptions}
      orderDate={lastOrder.created_at}
      orderNumber={lastOrder.order_number}
    />
  )
}
