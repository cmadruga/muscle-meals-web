/**
 * Tipos para eventos de webhooks de Conekta
 * Documentación: https://developers.conekta.com/docs/webhooks
 */

export interface ConektaCustomerInfo {
  email?: string // Opcional - Conekta lo requiere pero nosotros usamos email genérico
  name: string
  phone: string
}

export interface ConektaPaymentMethod {
  type: string          // 'card', 'oxxo_cash', 'spei'
  object: string        // 'card_payment', 'cash_payment', 'bank_transfer_payment'
  brand?: string        // 'visa', 'mastercard' (solo tarjeta)
  last4?: string        // últimos 4 dígitos (solo tarjeta)
}

export interface ConektaOrder {
  id: string
  amount: number
  currency: string
  customer_info: ConektaCustomerInfo
  metadata?: {
    order_id?: string
    [key: string]: unknown
  }
  status: string
  charges?: {
    data: Array<{
      payment_method?: ConektaPaymentMethod
    }>
  }
}

export interface ConektaCharge {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  payment_method?: ConektaPaymentMethod
}

export interface ConektaWebhookEvent {
  type: 'order.paid' | 'charge.paid' | 'order.pending_payment' | 'order.expired' | 'charge.refunded' | 'charge.chargeback'
  data: {
    object: ConektaOrder | ConektaCharge
  }
}
