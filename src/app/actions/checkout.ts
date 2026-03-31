'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type CheckoutItem = {
  mealId: string
  sizeId: string
  qty: number
  unitPrice: number
}

export type ProcessCheckoutInput = {
  // Si hay sesión activa, customerId viene del prefill
  customerId?: string
  customerName: string
  customerPhone: string
  customerAddress: string | null
  // Orden
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
  const { error: itemsError } = await supabase.from('order_items').insert(
    data.items.map(item => ({
      order_id: order.id,
      meal_id: item.mealId,
      size_id: item.sizeId,
      qty: item.qty,
      unit_price: item.unitPrice,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Error creating order items:', itemsError)
    return { orderId: '', orderNumber: '', error: 'Error al crear los items de la orden' }
  }

  return { orderId: order.id, orderNumber: order.order_number }
}
