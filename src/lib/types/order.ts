/**
 * Item individual dentro de una orden
 */
export interface OrderItem {
  product_id: string
  name: string
  qty: number
}

/**
 * Payload para crear una nueva orden
 */
export interface CreateOrderPayload {
  package_id: string
  items: OrderItem[]
  status: OrderStatus
  total_amount: number // en centavos
}

/**
 * Estados posibles de una orden
 */
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled'

/**
 * Orden completa como viene de Supabase
 */
export interface Order {
  id: string
  package_id: string
  items: OrderItem[]
  status: OrderStatus
  total_amount: number // en centavos
  created_at: string
  updated_at?: string
}
