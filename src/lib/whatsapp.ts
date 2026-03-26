/**
 * Cliente de WhatsApp Business API usando Meta Graph API
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID!
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const WHATSAPP_API_URL = `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_ID}/messages`

/**
 * Envía un mensaje de texto simple por WhatsApp
 */
async function sendWhatsAppText(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        type: 'text',
        to: phoneNumber,
        text: { body: message }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error WhatsApp API:', error)
      return false
    }

    const result = await response.json()
    console.log('✅ WhatsApp enviado:', result.messages?.[0]?.id)
    return true
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error)
    return false
  }
}

/**
 * Envía un template aprobado de WhatsApp
 */
async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  languageCode: string,
	orderHeader: string,
  bodyParams: string[]
): Promise<boolean> {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        type: 'template',
        to: phoneNumber,
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
							"type": "header",
							"parameters": [
								{
									"type": "text",
									"text": orderHeader
								}
							]
						},
						{
              type: 'body',
              parameters: bodyParams.map(text => ({ type: 'text', text }))
            }
          ]
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error WhatsApp Template API:', error)
      return false
    }

    const result = await response.json()
    console.log('✅ WhatsApp Template enviado:', result.messages?.[0]?.id)
    return true
  } catch (error) {
    console.error('❌ Error enviando WhatsApp Template:', error)
    return false
  }
}

/**
 * Confirmación de pago - Usa template aprobado
 * NOTA: Asegúrate que el template esté aprobado en Meta Business con estos parámetros:
 * - Parámetro 1: {{1}} = nombre del cliente
 * - Parámetro 2: {{2}} = monto
 * - Parámetro 3: {{3}} = ID de pedido
 */
export async function sendPaymentConfirmation(
  phoneNumber: string,
  customerName: string,
  orderId: string,
  amount: number
): Promise<boolean> {
  return sendWhatsAppTemplate(
    phoneNumber,
    'pago_confirmado', // Nombre del template aprobado en Meta
    'es_MX',
		orderId.slice(0, 8).toUpperCase(),
    [
      customerName,
      amount.toFixed(2),
    ]
  )
}

/**
 * Orden pendiente de pago (OXXO/efectivo)
 */
export async function sendPaymentPending(
  phoneNumber: string,
  customerName: string,
  orderId: string,
  amount: number
): Promise<boolean> {
  return sendWhatsAppTemplate(
    phoneNumber,
    'pago_pendiente',
    'es',
    orderId.slice(0, 8).toUpperCase(),
    [customerName, amount.toFixed(2)]
  )
}



/**
 * Alerta interna al número del negocio cuando se confirma/crea un pedido.
 *
 * Requiere env var: WHATSAPP_OWNER_PHONE
 * Formato: 5218112345678 (sin +, con código de país)
 */
export async function sendInternalOrderAlert(data: {
  orderNumber: string
  status: 'paid' | 'pending_payment'
  customerName: string
  customerPhone: string
  items: Array<{ mealName: string; sizeName: string; qty: number; unitPrice: number }> // unitPrice en pesos
  shippingType: 'standard' | 'priority' | 'pickup'
  shippingCost: number   // en pesos
  totalAmount: number    // en pesos
}): Promise<boolean> {
  const ownerPhone = process.env.WHATSAPP_OWNER_PHONE
  if (!ownerPhone) {
    console.warn('⚠️ WHATSAPP_OWNER_PHONE no configurado — saltando alerta interna')
    return false
  }

  const statusLabel = data.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'

  const itemLines = data.items.map(item =>
    `  • ${item.mealName} (${item.sizeName}) ×${item.qty} — $${(item.unitPrice * item.qty).toFixed(0)}`
  ).join(', ')

  const shippingLabels: Record<string, string> = {
    standard: 'Estándar',
    priority: 'Prioritario',
    pickup: 'Pickup',
  }
  const shippingLine = data.shippingCost > 0
    ? `${shippingLabels[data.shippingType]} — $${data.shippingCost.toFixed(0)} MXN`
    : `${shippingLabels[data.shippingType]} — Gratis`

  return sendWhatsAppTemplate(
    ownerPhone,
    'alerta_pedido',
    'es',
    statusLabel,
    [data.customerName, data.customerPhone, itemLines, shippingLine, data.totalAmount.toFixed(0)]
  )
}

/**
 * Orden expirada sin pago
 */
export async function sendOrderExpired(
  phoneNumber: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  const message = `Hola ${customerName}! Tu pedido (#${orderId.slice(0, 8).toUpperCase()}) ha expirado por falta de pago. Si aún te interesa, puedes hacer un nuevo pedido en nuestra página.`
  return sendWhatsAppText(phoneNumber, message)
}
