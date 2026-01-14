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
  const message = `Hola ${customerName}! Tu pedido (#${orderId.slice(0, 8).toUpperCase()}) por $${amount.toFixed(2)} está pendiente de pago. Te enviaremos las instrucciones de pago pronto.`
  return sendWhatsAppText(phoneNumber, message)
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
