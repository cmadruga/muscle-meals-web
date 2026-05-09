'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getExtraStockForWeek } from '@/lib/db/extra-stock'
import { getCriticalPeriodConfig } from '@/lib/db/settings'
import { isInCutoffWindow, getCurrentWeekMonday } from '@/lib/utils/delivery'

export type CheckoutItem = {
  mealId: string
  mealName?: string
  sizeName?: string
  sizeId: string
  qty: number
  unitPrice: number
  packageInstanceId?: string
}

export type CartValidationError = {
  mealId: string
  sizeId: string
  message: string
}

export async function validateCart(
  items: CheckoutItem[]
): Promise<{ valid: boolean; errors: CartValidationError[] }> {
  const supabase = createAdminClient()
  const errors: CartValidationError[] = []

  const sizeIds = [...new Set(items.map(i => i.sizeId))]
  const mealIds = [...new Set(items.map(i => i.mealId))]

  const [{ data: sizes }, { data: meals }] = await Promise.all([
    supabase.from('sizes').select('id').in('id', sizeIds),
    supabase.from('meals').select('id, active').in('id', mealIds),
  ])

  const validSizeIds = new Set((sizes ?? []).map((s: { id: string }) => s.id))
  const activeMealIds = new Set(
    (meals ?? []).filter((m: { id: string; active: boolean }) => m.active).map(m => m.id)
  )

  for (const item of items) {
    if (!validSizeIds.has(item.sizeId)) {
      errors.push({
        mealId: item.mealId,
        sizeId: item.sizeId,
        message: `El tamaño "${item.sizeName ?? item.sizeId}" ya no existe. Elimina ${item.mealName ?? 'el platillo'} del carrito y agrégalo de nuevo con tu tamaño actualizado.`,
      })
    }
    if (!activeMealIds.has(item.mealId)) {
      errors.push({
        mealId: item.mealId,
        sizeId: item.sizeId,
        message: `"${item.mealName ?? item.mealId}" ya no está disponible. Elimínalo del carrito.`,
      })
    }
  }

  // Stock check in critical period (computed server-side)
  const criticalConfig = await getCriticalPeriodConfig()
  if (isInCutoffWindow(criticalConfig)) {
    const weekMonday = getCurrentWeekMonday()
    const stock = await getExtraStockForWeek(weekMonday)
    const stockMap = new Map(stock.map(s => [s.meal_id, s.qty]))

    // Aggregate qty per meal across all cart items
    const needed = new Map<string, { item: CheckoutItem; qty: number }>()
    for (const item of items) {
      const existing = needed.get(item.mealId)
      if (existing) existing.qty += item.qty
      else needed.set(item.mealId, { item, qty: item.qty })
    }

    for (const [mealId, { item, qty }] of needed) {
      const available = stockMap.get(mealId) ?? 0
      if (available < qty) {
        errors.push({
          mealId: item.mealId,
          sizeId: item.sizeId,
          message: `Sin stock para "${item.mealName ?? item.mealId}". Disponible: ${available}. Actualiza tu carrito.`,
        })
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export type ProcessCheckoutInput = {
  customerId?: string
  customerName: string
  customerPhone: string
  customerAddress: string | null
  totalAmount: number
  shippingType: 'standard' | 'priority' | 'pickup'
  pickupSpotId?: string | null
  shippingCost: number
  items: CheckoutItem[]
}

export async function processCheckout(
  data: ProcessCheckoutInput
): Promise<{ orderId: string; orderNumber: string; error?: string }> {
  // Safety-net: re-validate stock server-side (critical period computed here, not trusted from client)
  const criticalConfig = await getCriticalPeriodConfig()
  if (isInCutoffWindow(criticalConfig)) {
    const weekMonday = getCurrentWeekMonday()
    const stock = await getExtraStockForWeek(weekMonday)
    const stockMap = new Map(stock.map(s => [s.meal_id, s.qty]))
    const needed = new Map<string, number>()
    for (const item of data.items) {
      needed.set(item.mealId, (needed.get(item.mealId) ?? 0) + item.qty)
    }
    for (const [mealId, qty] of needed) {
      const available = stockMap.get(mealId) ?? 0
      if (available < qty) {
        return { orderId: '', orderNumber: '', error: 'Sin stock suficiente. Actualiza tu carrito antes de continuar.' }
      }
    }
  }

  const supabase = createAdminClient()

  let customerId = data.customerId ?? null

  // Guest: crear customer nuevo
  if (!customerId) {
    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert({
        full_name: data.customerName,
        phone: data.customerPhone || null,
        address: data.customerAddress || null,
      })
      .select('id')
      .single()

    if (custError) {
      console.error('Error creating guest customer:', custError)
      return { orderId: '', orderNumber: '', error: 'Error al guardar información del cliente' }
    }
    customerId = newCustomer.id
  } else {
    // Logueado: actualizar su registro
    await supabase
      .from('customers')
      .update({
        full_name: data.customerName,
        phone: data.customerPhone || null,
        address: data.customerAddress || null,
      })
      .eq('id', customerId)
  }

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      total_amount: data.totalAmount,
      status: 'creado',
      shipping_type: data.shippingType,
      pickup_spot_id: data.pickupSpotId || null,
      shipping_cost: data.shippingCost,
    })
    .select('id, order_number')
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return { orderId: '', orderNumber: '', error: 'Error al crear la orden' }
  }

  // Crear items
  const orderItemsPayload = data.items.map(item => ({
    order_id: order.id,
    meal_id: item.mealId,
    size_id: item.sizeId,
    qty: item.qty,
    unit_price: item.unitPrice,
    package_instance_id: item.packageInstanceId ?? null,
  }))
  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Error creating order items:', itemsError)
    return { orderId: '', orderNumber: '', error: 'Error al crear los items de la orden' }
  }

  return { orderId: order.id, orderNumber: order.order_number }
}
