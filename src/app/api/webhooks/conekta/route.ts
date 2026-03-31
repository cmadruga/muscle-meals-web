import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { updateOrderStatus, updatePaymentGatewayId, getOrderById, getOrderWithItems } from '@/lib/db/orders'
import { getCustomerById } from '@/lib/db/customers'
import type { ConektaOrder, ConektaCharge } from '@/lib/types/conekta'
import { sendPaymentConfirmation, sendPaymentPending, sendOrderExpired, sendInternalOrderAlert } from '@/lib/whatsapp'

const WEBHOOK_SECRET = process.env.CONEKTA_WEBHOOK_SECRET!

/**
 * Verifica la firma del webhook de Conekta para seguridad
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️ CONEKTA_WEBHOOK_SECRET no está configurado')
    return false
  }

  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return hash === signature
}

/**
 * Webhook endpoint para recibir eventos de Conekta
 * Documentación: https://developers.conekta.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-conekta-signature')

    // Verificar firma del webhook (seguridad)
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Firma de webhook inválida')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    console.log('📥 Webhook recibido:', event.type)

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(event.data.object)
        break

      case 'charge.paid':
        await handleChargePaid(event.data.object)
        break

      case 'order.pending_payment':
        await handleOrderPending(event.data.object)
        break

      case 'order.expired':
        await handleOrderExpired(event.data.object)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break

      case 'charge.chargeback':
        await handleChargeback(event.data.object)
        break

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error procesando webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Maneja el evento order.paid - Orden pagada exitosamente
 */
async function handleOrderPaid(conektaOrder: ConektaOrder) {
  try {
    const ourOrderId = conektaOrder.metadata?.order_id

    if (!ourOrderId) {
      console.error('❌ No se encontró order_id en metadata')
      return
    }

    console.log(`✅ Orden pagada: ${ourOrderId}`)

    // Actualizar estado en nuestra DB
    await updateOrderStatus(ourOrderId, 'paid')
    
    // Guardar el ID de Conekta para referencia
    await updatePaymentGatewayId(ourOrderId, conektaOrder.id)

    // Obtener la orden completa con customer_id
    const order = await getOrderById(ourOrderId)
    
    if (!order) {
      console.error('❌ No se encontró la orden en la base de datos')
      return
    }

    // Obtener el customer de nuestra DB (fuente de verdad)
    const customer = order.customer_id ? await getCustomerById(order.customer_id) : null
    
    if (!customer) {
      console.error('❌ No se encontró el customer asociado a la orden')
      return
    }

    const totalAmount = conektaOrder.amount / 100 // convertir de centavos

    console.log(`✅ Orden pagada: ${order.order_number}`)
    console.log(`   Cliente: ${customer.full_name}`)
    console.log(`   Teléfono: ${customer.phone}`)
    console.log(`   Total: $${totalAmount}`)

    // Enviar confirmación por WhatsApp (solo si el cliente tiene teléfono)
    if (customer.phone) {
      await sendPaymentConfirmation(
        customer.phone,
        customer.full_name,
        order.order_number,
        totalAmount,
        0
      )
      console.log(`📱 WhatsApp enviado a ${customer.phone}`)
    }

    const orderWithItemsPaid = await getOrderWithItems(ourOrderId)
    await sendInternalOrderAlert({
      orderNumber: order.order_number,
      status: 'paid',
      customerName: customer.full_name,
      customerPhone: customer.phone ?? '',
      items: (orderWithItemsPaid?.items ?? []).map(item => ({
        mealName: item.meal_name || 'Platillo',
        sizeName: item.size_name || '',
        qty: item.qty,
        unitPrice: item.unit_price / 100,
      })),
      shippingType: order.shipping_type,
      shippingCost: order.shipping_cost / 100,
      totalAmount,
    })
    console.log(`🔔 Alerta interna enviada — pedido #${order.order_number}`)

  } catch (error) {
    console.error('Error en handleOrderPaid:', error)
    throw error
  }
}

/**
 * Maneja el evento charge.paid - Cargo pagado (para pagos en efectivo/OXXO)
 */
async function handleChargePaid(charge: ConektaCharge) {
  try {
    const conektaOrderId = charge.order_id
    
    if (conektaOrderId) {
      console.log(`✅ Cargo pagado para orden Conekta: ${conektaOrderId}`)
      // La orden ya debería estar marcada como paid por order.paid
      // Este evento es adicional para confirmación
    }
  } catch (error) {
    console.error('Error en handleChargePaid:', error)
  }
}

/**
 * Maneja el evento order.pending_payment - Orden pendiente de pago
 */
async function handleOrderPending(conektaOrder: ConektaOrder) {
  try {
    const ourOrderId = conektaOrder.metadata?.order_id

    if (!ourOrderId) return

    console.log(`⏳ Orden pendiente: ${ourOrderId}`)
    await updateOrderStatus(ourOrderId, 'pending')
    await updatePaymentGatewayId(ourOrderId, conektaOrder.id)
    
    const order = await getOrderById(ourOrderId)
    
    if (!order || !order.customer_id) return
    
    const customer = await getCustomerById(order.customer_id)
    
    if (!customer) return

    const totalAmount = conektaOrder.amount / 100

    const orderWithItemsPending = await getOrderWithItems(ourOrderId)
    const itemCountPending = (orderWithItemsPending?.items ?? []).reduce((sum, i) => sum + i.qty, 0)

    if (customer.phone) {
      await sendPaymentPending(
        customer.phone,
        customer.full_name,
        order.order_number,
        totalAmount,
        itemCountPending
      )
      console.log(`📱 Instrucciones de pago enviadas a ${customer.phone}`)
    }

    await sendInternalOrderAlert({
      orderNumber: order.order_number,
      status: 'pending_payment',
      customerName: customer.full_name,
      customerPhone: customer.phone ?? '',
      items: (orderWithItemsPending?.items ?? []).map(item => ({
        mealName: item.meal_name || 'Platillo',
        sizeName: item.size_name || '',
        qty: item.qty,
        unitPrice: item.unit_price / 100,
      })),
      shippingType: order.shipping_type,
      shippingCost: order.shipping_cost / 100,
      totalAmount,
    })
    console.log(`🔔 Alerta interna enviada — pedido pendiente #${order.order_number}`)

  } catch (error) {
    console.error('Error en handleOrderPending:', error)
  }
}

/**
 * Maneja el evento order.expired - Orden expirada sin pago
 */
async function handleOrderExpired(conektaOrder: ConektaOrder) {
  try {
    const ourOrderId = conektaOrder.metadata?.order_id

    if (!ourOrderId) return

    console.log(`❌ Orden expirada: ${ourOrderId}`)
    await updateOrderStatus(ourOrderId, 'cancelled')
    
    const order = await getOrderById(ourOrderId)
    
    if (!order || !order.customer_id) return
    
    const customer = await getCustomerById(order.customer_id)
    
    if (!customer) return

    // Notificar orden expirada por WhatsApp (solo si el cliente tiene teléfono)
    if (customer.phone) {
      await sendOrderExpired(
        customer.phone,
        customer.full_name,
        order.order_number
      )
      console.log(`📱 Notificación de expiración enviada a ${customer.phone}`)
    }

  } catch (error) {
    console.error('Error en handleOrderExpired:', error)
  }
}

/**
 * Maneja el evento charge.refunded - Reembolso procesado
 */
async function handleChargeRefunded(charge: ConektaCharge) {
  try {
    const conektaOrderId = charge.order_id

    if (conektaOrderId) {
      console.log(`💰 Reembolso procesado para orden: ${conektaOrderId}`)
      // TODO: Actualizar estado a 'refunded' y notificar al cliente
    }
  } catch (error) {
    console.error('Error en handleChargeRefunded:', error)
  }
}

/**
 * Maneja el evento charge.chargeback - Contracargo
 */
async function handleChargeback(charge: ConektaCharge) {
  try {
    const conektaOrderId = charge.order_id

    if (conektaOrderId) {
      console.log(`⚠️ Contracargo recibido para orden: ${conektaOrderId}`)
      // TODO: Alertar al equipo para revisar
    }
  } catch (error) {
    console.error('Error en handleChargeback:', error)
  }
}

