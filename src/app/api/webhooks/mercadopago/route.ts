import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { updateOrderStatus, updatePaymentGatewayId, getOrderById, getOrderWithItems } from '@/lib/db/orders'
import { getCustomerById } from '@/lib/db/customers'
import { sendPaymentConfirmation, sendPaymentPending, sendInternalOrderAlert } from '@/lib/whatsapp'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET

function verifySignature(
  payload: string,
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  if (!MP_WEBHOOK_SECRET || !xSignature) return true // en dev sin secret, dejar pasar

  const ts = xSignature.match(/ts=([^,]+)/)?.[1]
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1]
  if (!ts || !v1) return false

  const manifest = `id:${dataId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`
  const hash = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex')
  return hash === v1
}

async function getPayment(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) throw new Error(`MP API error: ${res.status}`)
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const xSignature = headersList.get('x-signature')
    const xRequestId = headersList.get('x-request-id')

    const event = JSON.parse(body)
    const dataId = event?.data?.id ? String(event.data.id) : null

    if (!verifySignature(body, xSignature, xRequestId, dataId)) {
      console.error('❌ Firma de webhook MP inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('📥 Webhook MP recibido:', event.action, '| data.id:', dataId)

    // Solo procesamos notificaciones de pagos
    if (event.action !== 'payment.created' && event.action !== 'payment.updated') {
      return NextResponse.json({ received: true })
    }

    if (!dataId) return NextResponse.json({ received: true })

    const payment = await getPayment(dataId)
    const ourOrderId: string | undefined = payment.external_reference

    if (!ourOrderId) {
      console.error('❌ Sin external_reference en el pago MP')
      return NextResponse.json({ received: true })
    }

    console.log(`💳 Pago ${dataId} | status: ${payment.status} | orden: ${ourOrderId}`)

    if (payment.status === 'approved') {
      await updateOrderStatus(ourOrderId, 'paid')
      await updatePaymentGatewayId(ourOrderId, dataId)

      const order = await getOrderById(ourOrderId)
      if (!order) return NextResponse.json({ received: true })

      const customer = order.customer_id ? await getCustomerById(order.customer_id) : null
      if (!customer) return NextResponse.json({ received: true })

      const totalAmount = payment.transaction_amount // ya en pesos

      const orderWithItems = await getOrderWithItems(ourOrderId)
      const itemCount = (orderWithItems?.items ?? []).reduce((sum, i) => sum + i.qty, 0)

      if (customer.phone) {
        await sendPaymentConfirmation(customer.phone, customer.full_name, order.order_number, totalAmount, itemCount)
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

      console.log(`✅ Orden ${order.order_number} marcada como pagada`)

    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      await updateOrderStatus(ourOrderId, 'pending')

      const order = await getOrderById(ourOrderId)
      if (!order) return NextResponse.json({ received: true })

      const customer = order.customer_id ? await getCustomerById(order.customer_id) : null

      const orderWithItemsPendingMp = await getOrderWithItems(ourOrderId)
      const itemCountPendingMp = (orderWithItemsPendingMp?.items ?? []).reduce((sum, i) => sum + i.qty, 0)

      if (customer?.phone) {
        await sendPaymentPending(customer.phone, customer.full_name, order.order_number, payment.transaction_amount, itemCountPendingMp)
      }

      if (customer) {
        await sendInternalOrderAlert({
          orderNumber: order.order_number,
          status: 'pending_payment',
          customerName: customer.full_name,
          customerPhone: customer.phone ?? '',
          items: (orderWithItemsPendingMp?.items ?? []).map(item => ({
            mealName: item.meal_name || 'Platillo',
            sizeName: item.size_name || '',
            qty: item.qty,
            unitPrice: item.unit_price / 100,
          })),
          shippingType: order.shipping_type,
          shippingCost: order.shipping_cost / 100,
          totalAmount: payment.transaction_amount,
        })
      }

      console.log(`⏳ Orden ${ourOrderId} pendiente de pago`)

    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await updateOrderStatus(ourOrderId, 'cancelled')
      console.log(`❌ Pago rechazado/cancelado para orden ${ourOrderId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error procesando webhook MP:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
