import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateOrderStatus, updatePaymentGatewayId, getOrderById, getOrderWithItems } from '@/lib/db/orders'
import { getCustomerById } from '@/lib/db/customers'
import { updateMembership } from '@/app/actions/membership'
import { buildMembershipItems } from '@/lib/utils/membership'
import { deductExtraStockForOrder } from '@/lib/db/extra-stock'
import { sendPaymentConfirmation, sendInternalOrderAlert } from '@/lib/whatsapp'

// Solo disponible en desarrollo
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  let order_id: string = body.order_id

  // Si no viene order_id, usar la última membership purchase pendiente
  if (!order_id) {
    const { data } = await createAdminClient()
      .from('orders')
      .select('id')
      .eq('is_membership_purchase', true)
      .eq('status', 'creado')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (!data) return NextResponse.json({ error: 'No hay órdenes de membresía pendientes' }, { status: 404 })
    order_id = data.id
  }

  await updateOrderStatus(order_id, 'paid')
  await updatePaymentGatewayId(order_id, `test-${Date.now()}`)
  await deductExtraStockForOrder(order_id)

  const order = await getOrderById(order_id)
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  const customer = order.customer_id ? await getCustomerById(order.customer_id) : null
  if (!customer) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const orderWithItems = await getOrderWithItems(order_id)
  const totalQty = (orderWithItems?.items ?? []).reduce((n, i) => n + i.qty, 0)
  const totalAmount = order.total_amount / 100

  if (customer.phone) {
    await sendPaymentConfirmation(customer.phone, customer.full_name, order.order_number, totalAmount, totalQty)
  }

  await sendInternalOrderAlert({
    orderNumber: order.order_number,
    status: 'paid',
    customerName: customer.full_name,
    customerPhone: customer.phone ?? '',
    items: (orderWithItems?.items ?? []).map(item => ({
      mealName: item.meal_name || 'Platillo',
      sizeName: item.size_name || '',
      qty: item.qty,
      unitPrice: item.unit_price / 100,
    })),
    shippingType: order.shipping_type,
    shippingCost: order.shipping_cost / 100,
    totalAmount,
  })

  // Activar membresía si aplica
  let membershipActivated = false
  if (order.is_membership_purchase && order.membership_weeks && order.customer_id) {
    const orderItems = orderWithItems?.items ?? []
    const membershipItems = buildMembershipItems(orderItems.map(i => ({ size_id: i.size_id, qty: i.qty })))
    const singleSizeId = membershipItems.length === 1 ? membershipItems[0].size_id : null
    await updateMembership(order.customer_id, {
      is_member: true,
      membership_weeks_left: order.membership_weeks - 1,
      membership_qty: totalQty || null,
      membership_size_id: singleSizeId,
      membership_items: membershipItems,
    })
    membershipActivated = true
    console.log(`✅ [TEST] Membresía activada: cliente ${order.customer_id} · ${order.membership_weeks} sem.`)
  }

  return NextResponse.json({
    ok: true,
    order_id,
    order_number: order.order_number,
    membership_activated: membershipActivated,
    membership_weeks_left: order.membership_weeks ? order.membership_weeks - 1 : null,
    qty: totalQty,
    size_id: orderWithItems?.items[0]?.size_id ?? null,
  })
}
