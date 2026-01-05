/**
 * Estados posibles de una orden
 */
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled'

/**
 * OrderItem - Item individual de una orden (cada meal)
 */
export interface OrderItem {
  id: string
  order_id: string
  meal_id: string
  size_id: string
  qty: number
  unit_price: number // precio unitario al momento de la orden (centavos)
  package_id: string | null // si pertenece a un paquete
  created_at: string
}

/**
 * Datos para crear un item de orden
 */
export interface CreateOrderItemData {
  meal_id: string
  size_id: string
  qty: number
  unit_price: number
  package_id?: string | null
}

/**
 * Payload para crear una nueva orden
 */
export interface CreateOrderPayload {
  customer_id?: string | null
  total_amount: number
  status?: OrderStatus
}

/**
 * Orden completa
 */
export interface Order {
  id: string
  customer_id: string | null
  total_amount: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

/**
 * Orden con sus items
 */
export interface OrderWithItems extends Order {
  items: OrderItem[]
}
