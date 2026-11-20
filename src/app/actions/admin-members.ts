'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getCurrentWeekMonday } from '@/lib/utils/delivery'

export type MemberLastOrderItem = {
  meal_id: string
  meal_name: string
  size_id: string
  size_name: string
  qty: number
}

export type MemberLastOrder = {
  id: string
  shipping_type: 'standard' | 'priority' | 'pickup'
  pickup_spot_id: string | null
  items: MemberLastOrderItem[]
}

export type MembershipSlot = {
  size_id: string
  size_name: string
  total_qty: number
}

export type MemberForAdmin = {
  id: string
  full_name: string
  phone: string | null
  membership_weeks_left: number
  membership_slots: MembershipSlot[]   // totales por talla definidos en la membresía
  last_order: MemberLastOrder | null
  has_order_this_week: boolean
}

export async function getMembersWithLastOrder(): Promise<MemberForAdmin[]> {
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('customers')
    .select('id, full_name, phone, membership_weeks_left, membership_items, membership_size_id, membership_qty')
    .eq('is_member', true)
    .order('full_name', { ascending: true })

  if (!members || members.length === 0) return []

  // Collect all unique size IDs from membership definitions
  const allSizeIds = new Set<string>()
  for (const m of members) {
    const items = m.membership_items as { size_id: string; qty: number }[] | null
    if (items) items.forEach(i => allSizeIds.add(i.size_id))
    else if (m.membership_size_id) allSizeIds.add(m.membership_size_id)
  }
  const { data: sizesData } = allSizeIds.size > 0
    ? await supabase.from('sizes').select('id, name').in('id', [...allSizeIds])
    : { data: [] }
  const sizeNameMap = new Map((sizesData ?? []).map((s: { id: string; name: string }) => [s.id, s.name]))

  const memberIds = members.map((m) => m.id)
  const weekStart = getCurrentWeekMonday().toISOString()

  const [{ data: paidOrders }, { data: thisWeekOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, customer_id, shipping_type, pickup_spot_id, created_at')
      .in('customer_id', memberIds)
      .eq('status', 'paid')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('customer_id')
      .in('customer_id', memberIds)
      .eq('status', 'paid')
      .gte('created_at', weekStart),
  ])

  // Last order per member
  const lastOrderMap = new Map<string, { id: string; shipping_type: string; pickup_spot_id: string | null }>()
  for (const o of paidOrders ?? []) {
    if (!lastOrderMap.has(o.customer_id)) {
      lastOrderMap.set(o.customer_id, {
        id: o.id,
        shipping_type: o.shipping_type,
        pickup_spot_id: o.pickup_spot_id,
      })
    }
  }

  const thisWeekSet = new Set((thisWeekOrders ?? []).map((o) => o.customer_id))

  // Fetch items for last orders with meal/size names
  const lastOrderIds = [...lastOrderMap.values()].map((o) => o.id)
  const { data: orderItems } = lastOrderIds.length > 0
    ? await supabase
        .from('order_items')
        .select('order_id, meal_id, size_id, qty, meals(name), sizes(name)')
        .in('order_id', lastOrderIds)
    : { data: [] }

  const itemsByOrder = new Map<string, MemberLastOrderItem[]>()
  for (const item of (orderItems ?? []) as unknown as Array<{
    order_id: string; meal_id: string; size_id: string; qty: number
    meals: { name: string } | null; sizes: { name: string } | null
  }>) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push({
      meal_id: item.meal_id,
      meal_name: item.meals?.name ?? '',
      size_id: item.size_id,
      size_name: item.sizes?.name ?? '',
      qty: item.qty,
    })
    itemsByOrder.set(item.order_id, list)
  }

  const result = members.map((m) => {
    const lastOrder = lastOrderMap.get(m.id)

    const memberItems = m.membership_items as { size_id: string; qty: number }[] | null
    const membership_slots: MembershipSlot[] = memberItems
      ? memberItems.map(i => ({ size_id: i.size_id, size_name: sizeNameMap.get(i.size_id) ?? '', total_qty: i.qty }))
      : (m.membership_size_id && m.membership_qty)
        ? [{ size_id: m.membership_size_id, size_name: sizeNameMap.get(m.membership_size_id) ?? '', total_qty: m.membership_qty }]
        : []

    return {
      id: m.id,
      full_name: m.full_name,
      phone: m.phone ?? null,
      membership_weeks_left: m.membership_weeks_left ?? 0,
      membership_slots,
      has_order_this_week: thisWeekSet.has(m.id),
      last_order: lastOrder
        ? {
            id: lastOrder.id,
            shipping_type: lastOrder.shipping_type as 'standard' | 'priority' | 'pickup',
            pickup_spot_id: lastOrder.pickup_spot_id,
            items: itemsByOrder.get(lastOrder.id) ?? [],
          }
        : null,
    }
  })

  function groupPriority(m: MemberForAdmin): number {
    if ((m.membership_weeks_left ?? 0) === 0) return 2
    if (m.has_order_this_week) return 1
    return 0
  }

  result.sort((a, b) => {
    const gDiff = groupPriority(a) - groupPriority(b)
    if (gDiff !== 0) return gDiff
    return a.full_name.localeCompare(b.full_name, 'es')
  })

  return result
}

export type MemberOrderInput = {
  customerId: string
  customerName: string
  shippingType: 'standard' | 'priority' | 'pickup'
  pickupSpotId?: string | null
  items: MemberLastOrderItem[]
}

export async function createMemberOrders(
  orders: MemberOrderInput[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let created = 0

  const weekStart = getCurrentWeekMonday().toISOString()

  for (const o of orders) {
    const { data: customer } = await supabase
      .from('customers')
      .select('membership_weeks_left, full_name')
      .eq('id', o.customerId)
      .single()

    if (!customer || (customer.membership_weeks_left ?? 0) <= 0) {
      errors.push(`${o.customerName}: sin semanas disponibles`)
      continue
    }

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', o.customerId)
      .eq('status', 'paid')
      .gte('created_at', weekStart)
      .limit(1)

    if ((existing?.length ?? 0) > 0) {
      errors.push(`${o.customerName}: ya tiene pedido esta semana`)
      continue
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: o.customerId,
        total_amount: 0,
        status: 'paid',
        shipping_type: o.shippingType,
        pickup_spot_id: o.pickupSpotId || null,
        shipping_cost: 0,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      errors.push(`${o.customerName}: error al crear orden`)
      continue
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      o.items.map((item) => ({
        order_id: order.id,
        meal_id: item.meal_id,
        size_id: item.size_id,
        qty: item.qty,
        unit_price: 0,
      }))
    )

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      errors.push(`${o.customerName}: error al guardar items`)
      continue
    }

    await supabase
      .from('customers')
      .update({ membership_weeks_left: customer.membership_weeks_left - 1 })
      .eq('id', o.customerId)

    created++
  }

  revalidatePath('/admin/orders')
  return { created, errors }
}
