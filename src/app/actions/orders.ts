'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/lib/types'

export type AdminOrderItem = {
  meal_id: string
  size_id: string
  qty: number
  meal_name: string
  size_name: string
}

export type AdminOrderPayload = {
  type: 'extras' | 'cliente'
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  note?: string
  weekStr: string
  items: AdminOrderItem[]
  shippingType?: 'pickup' | 'standard' | 'priority'
  pickupSpotId?: string
  shippingAddress?: string
}

export async function createAdminOrder(
  data: AdminOrderPayload
): Promise<{ error?: string }> {
  if (data.items.length === 0) return { error: 'Agrega al menos un ítem' }

  const supabase = await createClient()

  // Determinar customer_id
  let customerId: string | null = data.customerId ?? null
  let createdCustomerId: string | null = null

  if (data.type === 'cliente' && !customerId && data.customerName?.trim()) {
    const email = `admin_${Date.now()}@mm.internal`
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .insert({
        full_name: data.customerName.trim(),
        phone: data.customerPhone?.trim() || null,
        email,
        address: data.shippingAddress?.trim() || data.customerAddress?.trim() || null,
        user_id: null,
      })
      .select('id')
      .single()

    if (custError) return { error: custError.message }
    customerId = customer.id
    createdCustomerId = customer.id
  }

  // Setear created_at al lunes de la semana seleccionada (mediodía)
  const [y, m, d] = data.weekStr.split('-').map(Number)
  const weekDate = new Date(y, m - 1, d, 12, 0, 0)

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      total_amount: 0,
      status: data.type === 'extras' ? 'extra' : 'admin',
      shipping_type: data.shippingType ?? 'pickup',
      pickup_spot_id: data.pickupSpotId ?? null,
      shipping_cost: 0,
      note: data.note?.trim() || null,
      created_at: weekDate.toISOString(),
    })
    .select('id')
    .single()

  if (orderError) {
    if (createdCustomerId) await supabase.from('customers').delete().eq('id', createdCustomerId)
    return { error: orderError.message }
  }

  // Crear items
  const { error: itemsError } = await supabase.from('order_items').insert(
    data.items.map((item) => ({
      order_id: order.id,
      meal_id: item.meal_id,
      size_id: item.size_id,
      qty: item.qty,
      unit_price: 0,
    }))
  )

  if (itemsError) {
    if (createdCustomerId) await supabase.from('customers').delete().eq('id', createdCustomerId)
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: itemsError.message }
  }

  revalidatePath('/admin/orders')
  return {}
}

export async function saveOrderNote(orderId: string, note: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ note })
    .eq('id', orderId)
  if (error) console.error('Error saving note:', error)
  // Sin revalidatePath — el estado local ya refleja el cambio al instante
}

export type AssignExtraItem = {
  itemId: string      // order_item.id del extra original
  meal_id: string
  size_id: string
  qty: number         // cantidad a asignar (≤ qty restante)
  meal_name: string
  size_name: string
}

export async function assignExtraToClient(data: {
  extraOrderId: string
  customerId?: string      // si se selecciona un cliente existente
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  note?: string
  weekStr: string
  items: AssignExtraItem[]
  status: 'paid' | 'pending'
}): Promise<{ error?: string }> {
  if (data.items.length === 0) return { error: 'Selecciona al menos un ítem' }
  if (!data.customerId && !data.customerName?.trim()) return { error: 'Selecciona o ingresa un cliente' }

  const supabase = await createClient()

  // Verificar que las cantidades no excedan el stock disponible
  const { data: extraItems, error: fetchError } = await supabase
    .from('order_items')
    .select('id, qty')
    .in('id', data.items.map(i => i.itemId))

  if (fetchError) return { error: fetchError.message }

  for (const item of data.items) {
    const original = extraItems?.find(e => e.id === item.itemId)
    if (!original) return { error: `Ítem no encontrado: ${item.meal_name}` }
    if (item.qty > original.qty) return { error: `Stock insuficiente para ${item.meal_name} (disponible: ${original.qty})` }
  }

  // Resolver customer_id
  let resolvedCustomerId: string | null = data.customerId ?? null

  if (!resolvedCustomerId && data.customerName?.trim()) {
    const email = `admin_${Date.now()}@mm.internal`
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .insert({
        full_name: data.customerName.trim(),
        phone: data.customerPhone?.trim() || null,
        email,
        address: data.customerAddress?.trim() || null,
        user_id: null,
      })
      .select('id')
      .single()

    if (custError) return { error: custError.message }
    resolvedCustomerId = customer.id
  }

  // Crear nueva orden para el cliente
  const [y, m, d] = data.weekStr.split('-').map(Number)
  const weekDate = new Date(y, m - 1, d, 12, 0, 0)

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: resolvedCustomerId,
      total_amount: 0,
      status: data.status,
      shipping_type: 'pickup',
      shipping_cost: 0,
      note: data.note?.trim() || null,
      created_at: weekDate.toISOString(),
    })
    .select('id')
    .single()

  if (orderError) {
    if (!data.customerId && resolvedCustomerId) await supabase.from('customers').delete().eq('id', resolvedCustomerId)
    return { error: orderError.message }
  }

  // Insertar items en la nueva orden
  const { error: itemsError } = await supabase.from('order_items').insert(
    data.items.map(item => ({
      order_id: newOrder.id,
      meal_id: item.meal_id,
      size_id: item.size_id,
      qty: item.qty,
      unit_price: 0,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', newOrder.id)
    if (!data.customerId && resolvedCustomerId) await supabase.from('customers').delete().eq('id', resolvedCustomerId)
    return { error: itemsError.message }
  }

  // Reducir/eliminar items del extra original
  for (const item of data.items) {
    const original = extraItems!.find(e => e.id === item.itemId)!
    const remaining = original.qty - item.qty
    if (remaining <= 0) {
      await supabase.from('order_items').delete().eq('id', item.itemId)
    } else {
      await supabase.from('order_items').update({ qty: remaining }).eq('id', item.itemId)
    }
  }

  // Si el extra quedó sin ítems, marcarlo como delivered
  const { data: remainingItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', data.extraOrderId)
    .limit(1)

  if (!remainingItems || remainingItems.length === 0) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', data.extraOrderId)
  }

  revalidatePath('/admin/orders')
  return {}
}

export type OrderSummary = {
  id: string
  order_number: string
  total_amount: number
  shipping_cost: number
  shipping_type: 'standard' | 'priority' | 'pickup'
  items: Array<{ meal_name: string; size_name: string; qty: number; unit_price: number }>
}

export async function getOrderSummary(orderId: string): Promise<OrderSummary | null> {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, total_amount, shipping_cost, shipping_type,
      order_items (
        qty, unit_price,
        meals:meal_id (name),
        sizes:size_id (name)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) return null

  return {
    id: order.id,
    order_number: order.order_number,
    total_amount: order.total_amount,
    shipping_cost: order.shipping_cost,
    shipping_type: order.shipping_type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (order.order_items ?? []).map((item: any) => ({
      meal_name: item.meals?.name ?? 'Platillo',
      size_name: item.sizes?.name ?? '',
      qty: item.qty,
      unit_price: item.unit_price,
    })),
  }
}

export async function changeOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    throw new Error('Error al actualizar el estado')
  }

  revalidatePath('/admin/orders')
}
