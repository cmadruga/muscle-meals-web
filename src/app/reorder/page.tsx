import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import RepetirClient from './RepetirClient'
import type { CartItem } from '@/lib/store/cart'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'
import { getCurrentWeekMonday } from '@/lib/utils/delivery'
import { normalizePhone } from '@/lib/address-validation'

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

  const [{ data: customer }, pickupSpots] = await Promise.all([
    admin.from('customers')
      .select('id, full_name, phone, address, is_member, membership_weeks_left, membership_qty, membership_size_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    getActivePickupSpots(),
  ])

  if (!customer) redirect('/cuenta/login?next=/reorder')

  const prefill = {
    customerId: customer.id,
    name: customer.full_name ?? '',
    phone: normalizePhone(customer.phone ?? ''),
    address: customer.address ?? null,
  }

  const membership = {
    is_member: customer.is_member ?? false,
    membership_weeks_left: customer.membership_weeks_left ?? 0,
    membership_qty: customer.membership_qty ?? null,
    membership_size_id: customer.membership_size_id ?? null,
  }

  let usedMembershipThisWeek = false
  if (customer.is_member) {
    const weekStart = getCurrentWeekMonday().toISOString()
    const { data: thisWeekOrders } = await admin
      .from('orders')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'paid')
      .gte('created_at', weekStart)
      .limit(1)
    usedMembershipThisWeek = (thisWeekOrders?.length ?? 0) > 0
  }

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
        prefill={prefill} membership={membership} pickupSpots={pickupSpots} usedMembershipThisWeek={usedMembershipThisWeek}
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
      prefill={prefill}
      membership={membership}
      pickupSpots={pickupSpots}
      usedMembershipThisWeek={usedMembershipThisWeek}
    />
  )
}
