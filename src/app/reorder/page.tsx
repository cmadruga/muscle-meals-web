import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import RepetirClient from './RepetirClient'
import type { CartItem } from '@/lib/store/cart'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'
import { getCriticalPeriodConfig, getMembershipDiscounts } from '@/lib/db/settings'
import type { MembershipDiscounts } from '@/lib/db/settings'
import { isInCutoffWindow, getCurrentWeekMonday } from '@/lib/utils/delivery'
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

export type MainSize = {
  sizeId: string
  name: string
  price: number
  protein_qty: number
  carb_qty: number
  veg_qty: number
}

export type SizeGroupSlot = {
  mealId?: string  // undefined for skipped slots (meal to be replaced)
  mealName: string
  qty: number
  isSkipped: boolean
  packageInstanceId?: string
}

export type SizeBlockedGroup = {
  originalSizeId: string
  originalSizeName: string
  slots: SizeGroupSlot[]
  totalQty: number
}

export type DisplayItem = {
  mealName: string
  sizeName: string
  qty: number
  unitPrice: number
  isSkipped?: boolean  // slot pendiente de reemplazo — pertenece al paquete pero aún no se eligió
}

export type DisplayPackage = {
  items: DisplayItem[]
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

  const [{ data: customer }, pickupSpots, membershipDiscounts] = await Promise.all([
    admin.from('customers')
      .select('id, full_name, phone, address, is_member, membership_weeks_left, membership_qty, membership_size_id, membership_items')
      .eq('user_id', user.id)
      .maybeSingle(),
    getActivePickupSpots(),
    getMembershipDiscounts(),
  ])

  if (!customer) redirect('/cuenta/login?next=/reorder')

  const prefill = {
    customerId: customer.id,
    name: customer.full_name ?? '',
    phone: normalizePhone(customer.phone ?? ''),
    rawPhone: customer.phone ?? '',
    address: customer.address ?? null,
  }

  const membership = {
    is_member: customer.is_member ?? false,
    membership_weeks_left: customer.membership_weeks_left ?? 0,
    membership_qty: customer.membership_qty ?? null,
    membership_size_id: customer.membership_size_id ?? null,
    membership_items: (customer.membership_items as { size_id: string; qty: number }[] | null) ?? null,
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
        packages={[]} individuals={[]} displayPackages={[]} displayIndividuals={[]}
        skippedSlots={[]} sizeBlockedGroups={[]} mainSizes={[]} activeMealOptions={[]}
        orderDate={null} orderNumber={null}
        prefill={prefill} membership={membership} pickupSpots={pickupSpots}
        usedMembershipThisWeek={usedMembershipThisWeek} membershipDiscounts={membershipDiscounts}
      />
    )
  }

  const allMealIds = [...new Set(rawItems.map(i => i.meal_id))]
  const allSizeIds = [...new Set(rawItems.map(i => i.size_id))]

  const [
    { data: activeMealsInOrder },
    { data: allActiveMeals },
    { data: sizes },
    { data: mainSizesRaw },
    criticalConfig,
  ] = await Promise.all([
    admin.from('meals').select('id').in('id', allMealIds).eq('active', true),
    admin.from('meals').select('id, name, img').eq('active', true).order('name'),
    admin.from('sizes').select('id, price, package_price, customer_id').in('id', allSizeIds),
    admin.from('sizes').select('id, name, price, protein_qty, carb_qty, veg_qty').eq('is_main', true).is('customer_id', null).order('price'),
    getCriticalPeriodConfig(),
  ])

  const inCriticalPeriod = isInCutoffWindow(criticalConfig)
  const activeMealIdSet = new Set(activeMealsInOrder?.map(m => m.id) ?? [])
  const customSizeIdSet = new Set(
    inCriticalPeriod
      ? (sizes ?? []).filter((s: any) => s.customer_id !== null).map((s: any) => s.id)
      : []
  )
  const priceMap = new Map(sizes?.map((s: any) => [s.id, s.price as number]) ?? [])
  const pkgPriceMap = new Map(sizes?.map((s: any) => [s.id, (s.package_price ?? s.price) as number]) ?? [])
  const extractQty = (val: any): number => {
    if (typeof val === 'number') return val
    if (val && typeof val === 'object') return Number(Object.values(val)[0] ?? 0)
    return 0
  }
  const mainSizes: MainSize[] = (Array.isArray(mainSizesRaw) ? mainSizesRaw : []).map((s: any) => ({
    sizeId: String(s.id), name: String(s.name), price: Number(s.price || 0),
    protein_qty: extractQty(s.protein_qty), carb_qty: extractQty(s.carb_qty), veg_qty: Number(s.veg_qty || 0),
  }))
  const activeMealOptions: ActiveMealOption[] = allActiveMeals?.map(m => ({ id: m.id, name: m.name, imageUrl: m.img ?? undefined })) ?? []

  // Three categories: active (cart as-is), sizeBlocked (active meal, blocked custom size), skipped (inactive meal)
  const activeItems = rawItems.filter(i => activeMealIdSet.has(i.meal_id) && !customSizeIdSet.has(i.size_id))
  const sizeBlockedItems = rawItems.filter(i => activeMealIdSet.has(i.meal_id) && customSizeIdSet.has(i.size_id))
  const skippedItems = rawItems.filter(i => !activeMealIdSet.has(i.meal_id))

  const toCartItem = (i: RawItem, extra?: Partial<CartItem>): CartItem => {
    const isPackageItem = Boolean(i.package_instance_id || extra?.packageInstanceId)
    return {
      mealId: i.meal_id,
      mealName: i.meals?.name ?? 'Platillo',
      sizeId: i.size_id,
      sizeName: i.sizes?.name ?? '',
      qty: i.qty,
      unitPrice: (isPackageItem ? pkgPriceMap.get(i.size_id) : priceMap.get(i.size_id)) ?? i.unit_price,
      ...extra,
    }
  }

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

  const packages: PackageGroup[] = []
  packageMap.forEach((group, originalId) => {
    const instanceId = crypto.randomUUID()
    packageInstanceIdMap.set(originalId, instanceId)
    packages.push({
      instanceId,
      items: group.map(i => toCartItem(i, { packageInstanceId: instanceId, packageName: 'Arma tu paquete' })),
    })
  })

  const individuals: CartItem[] = individualRaw.map(i => toCartItem(i))

  // Unified helper: reuse active-package IDs, or assign new shared IDs for non-active packages
  const extraPackageMap = new Map<string, string>()
  const getPkgId = (originalId: string | null | undefined): string | undefined => {
    if (!originalId) return undefined
    if (packageInstanceIdMap.has(originalId)) return packageInstanceIdMap.get(originalId)
    if (!extraPackageMap.has(originalId)) extraPackageMap.set(originalId, crypto.randomUUID())
    return extraPackageMap.get(originalId)
  }

  // Display: ALL items from the last order (active + sizeBlocked + skipped) shown as a read-only summary.
  // Skipped items that belong to a package appear as pending slots so the package count is correct.
  const displayPkgMap = new Map<string, DisplayItem[]>()
  const displayIndividuals: DisplayItem[] = []
  for (const item of [...activeItems, ...sizeBlockedItems]) {
    const di: DisplayItem = {
      mealName: item.meals?.name ?? 'Platillo',
      sizeName: item.sizes?.name ?? '',
      qty: item.qty,
      unitPrice: (item.package_instance_id ? pkgPriceMap.get(item.size_id) : priceMap.get(item.size_id)) ?? item.unit_price,
    }
    if (item.package_instance_id) {
      const g = displayPkgMap.get(item.package_instance_id) ?? []
      g.push(di)
      displayPkgMap.set(item.package_instance_id, g)
    } else {
      displayIndividuals.push(di)
    }
  }
  // Skipped items: include in their original package (if any) as pending slots
  for (const item of skippedItems) {
    const di: DisplayItem = {
      mealName: item.meals?.name ?? 'Platillo',
      sizeName: item.sizes?.name ?? '',
      qty: item.qty,
      unitPrice: priceMap.get(item.size_id) ?? item.unit_price,
      isSkipped: true,
    }
    if (item.package_instance_id) {
      const g = displayPkgMap.get(item.package_instance_id) ?? []
      g.push(di)
      displayPkgMap.set(item.package_instance_id, g)
    } else {
      displayIndividuals.push(di)
    }
  }
  const displayPackages: DisplayPackage[] = []
  displayPkgMap.forEach(items => displayPackages.push({ items }))

  // Size groups: group custom-size items by original sizeId (includes skipped meals with custom sizes)
  const sizeGroupMap = new Map<string, { name: string; slots: SizeGroupSlot[] }>()
  const addToGroup = (sizeId: string, sizeName: string, slot: SizeGroupSlot) => {
    if (!sizeGroupMap.has(sizeId)) sizeGroupMap.set(sizeId, { name: sizeName, slots: [] })
    sizeGroupMap.get(sizeId)!.slots.push(slot)
  }
  for (const item of sizeBlockedItems) {
    addToGroup(item.size_id, item.sizes?.name ?? 'Personalizado', {
      mealId: item.meal_id,
      mealName: item.meals?.name ?? 'Platillo',
      qty: item.qty,
      isSkipped: false,
      packageInstanceId: getPkgId(item.package_instance_id),
    })
  }
  for (const item of skippedItems) {
    if (customSizeIdSet.has(item.size_id)) {
      addToGroup(item.size_id, item.sizes?.name ?? 'Personalizado', {
        mealName: item.meals?.name ?? 'Platillo',
        qty: item.qty,
        isSkipped: true,
        packageInstanceId: getPkgId(item.package_instance_id),
      })
    }
  }
  const sizeBlockedGroups: SizeBlockedGroup[] = []
  sizeGroupMap.forEach(({ name, slots }, sizeId) => sizeBlockedGroups.push({
    originalSizeId: sizeId,
    originalSizeName: name,
    slots,
    totalQty: slots.reduce((n, s) => n + s.qty, 0),
  }))

  const skippedSlots: SkippedSlot[] = skippedItems.map((item, idx) => ({
    key: `skipped-${idx}`,
    originalMealName: item.meals?.name ?? 'Platillo',
    sizeId: item.size_id,
    sizeName: item.sizes?.name ?? '',
    qty: item.qty,
    unitPrice: priceMap.get(item.size_id) ?? item.unit_price,
    packageInstanceId: getPkgId(item.package_instance_id),
  }))

  return (
    <RepetirClient
      packages={packages}
      individuals={individuals}
      displayPackages={displayPackages}
      displayIndividuals={displayIndividuals}
      skippedSlots={skippedSlots}
      sizeBlockedGroups={sizeBlockedGroups}
      mainSizes={mainSizes}
      activeMealOptions={activeMealOptions}
      orderDate={lastOrder.created_at}
      orderNumber={lastOrder.order_number}
      prefill={prefill}
      membership={membership}
      pickupSpots={pickupSpots}
      usedMembershipThisWeek={usedMembershipThisWeek}
      membershipDiscounts={membershipDiscounts}
    />
  )
}
