'use server'

import MercadoPagoConfig, { Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export interface CreatePaymentData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  // totalAmount: number // en centavos (igual que antes)
  items: Array<{
    name: string
    unit_price: number // en centavos
    quantity: number
  }>
}

export interface PaymentResponse {
  success: boolean
  checkoutUrl?: string
  preferenceId?: string
  error?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.musclemeals.com.mx'

export async function createPaymentPreference(
  data: CreatePaymentData
): Promise<PaymentResponse> {
  try {
    const preference = new Preference(client)

    // MP usa pesos (float), nuestra DB guarda centavos
    const toPesos = (centavos: number) => Math.round(centavos) / 100

    const result = await preference.create({
      body: {
        external_reference: data.orderId,
        items: data.items.map((item, i) => ({
          id: String(i),
          title: item.name,
          unit_price: toPesos(item.unit_price),
          quantity: item.quantity,
          currency_id: 'MXN',
        })),
        payer: {
          name: data.customerName,
          ...(data.customerEmail ? { email: data.customerEmail } : {}),
          phone: { number: data.customerPhone },
        },
        back_urls: {
          success: `${BASE_URL}/order-success?our_order_id=${data.orderId}`,
          failure: `${BASE_URL}/order-failed?our_order_id=${data.orderId}`,
          pending: `${BASE_URL}/order-pending?our_order_id=${data.orderId}`,
        },
        auto_return: 'approved',
        notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      },
    })

    return {
      success: true,
      checkoutUrl: result.init_point ?? undefined,
      preferenceId: result.id ?? undefined,
    }
  } catch (error) {
    console.error('Error creating MP preference:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la orden de pago',
    }
  }
}
