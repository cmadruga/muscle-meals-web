/**
 * Tipos para eventos de webhooks de Conekta
 * Documentación: https://developers.conekta.com/docs/webhooks
 */

export interface ConektaCustomerInfo {
  email?: string // Opcional - Conekta lo requiere pero nosotros usamos email genérico
  name: string
  phone: string
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
}

export interface ConektaCharge {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
}

export interface ConektaWebhookEvent {
  type: 'order.paid' | 'charge.paid' | 'order.pending_payment' | 'order.expired' | 'charge.refunded' | 'charge.chargeback'
  data: {
    object: ConektaOrder | ConektaCharge
  }
}
