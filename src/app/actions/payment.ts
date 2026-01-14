'use server'

const CONEKTA_API_URL = 'https://api.conekta.io'
const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY!

export interface CreateConektaOrderData {
  orderId: string
  customerName: string
  customerPhone: string
  totalAmount: number // en centavos
  items: Array<{
    name: string
    unit_price: number
    quantity: number
  }>
}

export interface ConektaOrderResponse {
  success: boolean
  checkoutUrl?: string
  orderId?: string
  error?: string
}

/**
 * Crea una orden en Conekta y retorna el checkout URL
 */
export async function createConektaOrder(
  data: CreateConektaOrderData
): Promise<ConektaOrderResponse> {
  try {
    const response = await fetch(`${CONEKTA_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.conekta-v2.1.0+json',
        'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        currency: 'MXN',
        customer_info: {
          name: data.customerName,
          phone: data.customerPhone,
          email: 'noreply@musclemealsmx.com' // Requerido por Conekta API pero no lo usamos
        },
        line_items: data.items.map(item => ({
          name: item.name,
          unit_price: item.unit_price,
          quantity: item.quantity
        })),
        checkout: {
          allowed_payment_methods: ['card', 'cash'],
          expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          type: 'HostedPayment',
          success_url: `https://unverdurous-neida-nonmutationally.ngrok-free.dev/order-success?our_order_id=${data.orderId}`,
          failure_url: 'https://unverdurous-neida-nonmutationally.ngrok-free.dev/order-failed'
        },
        metadata: {
          order_id: data.orderId
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Conekta API error:', errorData)
      throw new Error(errorData.details?.[0]?.message || 'Error al crear la orden en Conekta')
    }

    const order = await response.json()

    return {
      success: true,
      checkoutUrl: order.checkout?.url,
      orderId: order.id
    }
  } catch (error) {
    console.error('Error creating Conekta order:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la orden de pago'
    }
  }
}

/**
 * Crea una orden con pago por tarjeta (tokenizada desde el frontend)
 */
export async function createConektaCardOrder(
  data: CreateConektaOrderData,
  tokenId: string
): Promise<ConektaOrderResponse> {
  try {
    const response = await fetch(`${CONEKTA_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.conekta-v2.1.0+json',
        'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        currency: 'MXN',
        customer_info: {
          name: data.customerName,
          phone: data.customerPhone,
          email: 'noreply@musclemealsmx.com' // Requerido por Conekta API pero no lo usamos
        },
        line_items: data.items.map(item => ({
          name: item.name,
          unit_price: item.unit_price,
          quantity: item.quantity
        })),
        charges: [{
          payment_method: {
            type: 'card',
            token_id: tokenId
          }
        }],
        metadata: {
          order_id: data.orderId
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Conekta API error:', errorData)
      throw new Error(errorData.details?.[0]?.message || 'Error al procesar el pago')
    }

    const order = await response.json()

    return {
      success: true,
      orderId: order.id
    }
  } catch (error) {
    console.error('Error creating Conekta card order:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar el pago'
    }
  }
}
