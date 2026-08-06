'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentConfirmation, sendInternalOrderAlert } from '@/lib/whatsapp'
import { getExtraStockForWeek } from '@/lib/db/extra-stock'
import { getCriticalPeriodConfig, getMembershipDiscounts } from '@/lib/db/settings'
import { isInCutoffWindow, getCurrentWeekMonday } from '@/lib/utils/delivery'
import { createPaymentPreference } from '@/app/actions/payment'

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
    supabase.from('sizes').select('id, customer_id').in('id', sizeIds),
    supabase.from('meals').select('id, active').in('id', mealIds),
  ])

  const validSizeIds = new Set((sizes ?? []).map((s: any) => s.id))
  const customSizeIds = new Set((sizes ?? []).filter((s: any) => s.customer_id !== null).map((s: any) => s.id))
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

  // Critical period checks (computed server-side)
  const criticalConfig = await getCriticalPeriodConfig()
  if (isInCutoffWindow(criticalConfig)) {
    // Block custom sizes — only main sizes (LOW/FIT/PLUS) allowed
    for (const item of items) {
      if (customSizeIds.has(item.sizeId)) {
        errors.push({
          mealId: item.mealId,
          sizeId: item.sizeId,
          message: `"${item.sizeName ?? 'Tamaño personalizado'}" no está disponible durante el período de entrega. Cámbialo a LOW, FIT o PLUS en tu carrito.`,
        })
      }
    }

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
  const supabase = createAdminClient()

  // Safety-net: re-validate critical period rules server-side
  const criticalConfig = await getCriticalPeriodConfig()
  if (isInCutoffWindow(criticalConfig)) {
    // Block custom sizes
    const orderSizeIds = [...new Set(data.items.map(i => i.sizeId))]
    const { data: customSizes } = await supabase
      .from('sizes').select('id').in('id', orderSizeIds).not('customer_id', 'is', null)
    if ((customSizes ?? []).length > 0) {
      return { orderId: '', orderNumber: '', error: 'Tamaños personalizados no disponibles durante el período de entrega. Actualiza tu carrito.' }
    }

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
    // Logueado: actualizar su registro (nunca borrar dirección guardada)
    // Si la membresía está vencida (is_member=true pero weeks_left=0), resetearla
    const { data: memberCheck } = await supabase
      .from('customers')
      .select('is_member, membership_weeks_left')
      .eq('id', customerId)
      .single()
    const shouldResetMembership = memberCheck?.is_member && (memberCheck.membership_weeks_left ?? 0) === 0
    await supabase
      .from('customers')
      .update({
        full_name: data.customerName,
        phone: data.customerPhone || null,
        ...(data.customerAddress ? { address: data.customerAddress } : {}),
        ...(shouldResetMembership ? { is_member: false } : {}),
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

export type PurchaseMembershipInput = {
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress: string | null
  shippingType: 'standard' | 'priority' | 'pickup'
  pickupSpotId?: string | null
  membershipWeeks: 4 | 8 | 12
  items: CheckoutItem[]
}

export async function purchaseMembership(
  data: PurchaseMembershipInput
): Promise<{ checkoutUrl?: string; error?: string }> {
  const supabase = createAdminClient()

  const discounts = await getMembershipDiscounts()
  const discountMap: Record<number, number> = { 4: discounts.w4, 8: discounts.w8, 12: discounts.w12 }
  const discountPct = discountMap[data.membershipWeeks] ?? 10

  const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const totalAmount = Math.round(subtotal * data.membershipWeeks * (1 - discountPct / 100))

  // Actualizar datos del cliente
  await supabase
    .from('customers')
    .update({
      full_name: data.customerName,
      phone: data.customerPhone || null,
      ...(data.customerAddress ? { address: data.customerAddress } : {}),
    })
    .eq('id', data.customerId)

  // Crear orden de compra de membresía
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: data.customerId,
      total_amount: totalAmount,
      status: 'creado',
      shipping_type: data.shippingType,
      pickup_spot_id: data.pickupSpotId || null,
      shipping_cost: 0,
      is_membership_purchase: true,
      membership_weeks: data.membershipWeeks,
    })
    .select('id, order_number')
    .single()

  if (orderError) {
    console.error('Error creating membership purchase order:', orderError)
    return { error: 'Error al crear la orden de membresía' }
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    data.items.map(item => ({
      order_id: order.id,
      meal_id: item.mealId,
      size_id: item.sizeId,
      qty: item.qty,
      unit_price: item.unitPrice,
      package_instance_id: item.packageInstanceId ?? null,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Error creating membership purchase order items:', itemsError)
    return { error: 'Error al crear los items de la orden' }
  }

  const totalQty = data.items.reduce((n, i) => n + i.qty, 0)

  const mpResult = await createPaymentPreference({
    orderId: order.id,
    customerName: data.customerName,
    customerEmail: '',
    customerPhone: data.customerPhone,
    items: [{
      name: `Membresia Muscle Meals - ${data.membershipWeeks} sem - ${totalQty} platillos sem - ${discountPct}% dto`,
      unit_price: totalAmount,
      quantity: 1,
    }],
  })

  if (!mpResult.success || !mpResult.checkoutUrl) {
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: mpResult.error ?? 'Error al crear preferencia de pago' }
  }

  return { checkoutUrl: mpResult.checkoutUrl }
}

export async function processMembershipOrder(
  data: ProcessCheckoutInput
): Promise<{ orderId: string; orderNumber: string; error?: string }> {
  if (!data.customerId) {
    return { orderId: '', orderNumber: '', error: 'Se requiere cuenta para usar membresía' }
  }

  const supabase = createAdminClient()

  // Re-verificar membresía server-side
  const { data: customer } = await supabase
    .from('customers')
    .select('id, phone, full_name, is_member, membership_weeks_left, membership_qty, membership_size_id')
    .eq('id', data.customerId)
    .single()

  if (!customer || !customer.is_member || (customer.membership_weeks_left ?? 0) <= 0) {
    return { orderId: '', orderNumber: '', error: 'Membresía no válida o sin semanas disponibles' }
  }

  // Verificar que no haya ya un pedido esta semana
  const weekStart = getCurrentWeekMonday().toISOString()
  const { data: thisWeekOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', data.customerId)
    .eq('status', 'paid')
    .gte('created_at', weekStart)
    .limit(1)

  if ((thisWeekOrders?.length ?? 0) > 0) {
    return { orderId: '', orderNumber: '', error: 'Ya tienes un pedido esta semana — solo se permite uno por membresía' }
  }

  // Re-verificar que el carrito coincide exactamente
  const totalQty = data.items.reduce((n, i) => n + i.qty, 0)
  const allMatchSize = data.items.every(i => i.sizeId === customer.membership_size_id)
  if (totalQty !== customer.membership_qty || !allMatchSize) {
    return { orderId: '', orderNumber: '', error: 'El carrito no coincide con la membresía — verifica cantidad y tamaño' }
  }

  // Actualizar datos del cliente
  await supabase
    .from('customers')
    .update({
      full_name: data.customerName,
      phone: data.customerPhone || null,
      ...(data.customerAddress ? { address: data.customerAddress } : {}),
    })
    .eq('id', data.customerId)

  // Crear orden con status='paid' directamente
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: data.customerId,
      total_amount: data.totalAmount,
      status: 'paid',
      shipping_type: data.shippingType,
      pickup_spot_id: data.pickupSpotId || null,
      shipping_cost: data.shippingCost,
    })
    .select('id, order_number')
    .single()

  if (orderError) {
    console.error('Error creating membership order:', orderError)
    return { orderId: '', orderNumber: '', error: 'Error al crear la orden' }
  }

  // Crear items
  const { error: itemsError } = await supabase.from('order_items').insert(
    data.items.map(item => ({
      order_id: order.id,
      meal_id: item.mealId,
      size_id: item.sizeId,
      qty: item.qty,
      unit_price: item.unitPrice,
      package_instance_id: item.packageInstanceId ?? null,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Error creating membership order items:', itemsError)
    return { orderId: '', orderNumber: '', error: 'Error al crear los items de la orden' }
  }

  // Decrementar semanas restantes
  await supabase
    .from('customers')
    .update({ membership_weeks_left: customer.membership_weeks_left - 1 })
    .eq('id', data.customerId)

  // WhatsApp al cliente
  if (customer.phone) {
    await sendPaymentConfirmation(
      customer.phone,
      customer.full_name,
      order.id,
      data.totalAmount / 100,
      totalQty
    )
  }

  // Alerta interna
  await sendInternalOrderAlert({
    orderNumber: order.order_number,
    status: 'paid',
    customerName: customer.full_name,
    customerPhone: customer.phone ?? '',
    items: data.items.map(i => ({
      mealName: i.mealName ?? '',
      sizeName: i.sizeName ?? '',
      qty: i.qty,
      unitPrice: i.unitPrice / 100,
    })),
    shippingType: data.shippingType,
    shippingCost: data.shippingCost / 100,
    totalAmount: data.totalAmount / 100,
  })

  // Deducir stock extra (periodo crítico) — membresía no pasa por webhook de Conekta
  const { deductExtraStockForOrder } = await import('@/lib/db/extra-stock')
  await deductExtraStockForOrder(order.id)

  return { orderId: order.id, orderNumber: order.order_number }
}
