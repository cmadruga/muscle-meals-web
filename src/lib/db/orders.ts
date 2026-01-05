import { supabase } from '@/lib/supabase/client'
import type { Order, OrderWithItems, CreateOrderPayload, CreateOrderItemData } from '@/lib/types'

/**
 * Crea una nueva orden con sus items
 * 
 * IMPORTANTE: Esta función usa el cliente browser.
 * Considera mover a Server Action para mejor seguridad.
 */
export async function createOrder(
  payload: CreateOrderPayload,
  items: CreateOrderItemData[]
): Promise<Order> {
  // 1. Crear la orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: payload.customer_id || null,
      total_amount: payload.total_amount,
      status: payload.status || 'pending'
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error(getErrorMessage(orderError))
  }

  // 2. Crear los items de la orden
  const orderItems = items.map(item => ({
    order_id: order.id,
    meal_id: item.meal_id,
    size_id: item.size_id,
    qty: item.qty,
    unit_price: item.unit_price,
    package_id: item.package_id || null
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Rollback: eliminar la orden si fallan los items
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Error creating order items:', itemsError)
    throw new Error('Error al crear los items de la orden')
  }

  return order as Order
}

/**
 * Obtiene una orden por ID con sus items
 */
export async function getOrderWithItems(id: string): Promise<OrderWithItems | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (orderError) {
    if (orderError.code === 'PGRST116') return null
    console.error('Error fetching order:', orderError)
    throw new Error('Error al cargar la orden')
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    throw new Error('Error al cargar los items')
  }

  return {
    ...order,
    items
  } as OrderWithItems
}

/**
 * Obtiene una orden por ID (sin items)
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching order:', error)
    throw new Error('Error al cargar la orden')
  }

  return data as Order
}

/**
 * Mensajes de error específicos de Supabase
 */
function getErrorMessage(error: any): string {
  if (error.code === 'PGRST204') {
    const column = error.message.match(/'(.+?)'/)?.[1] || 'desconocida'
    return `Error de base de datos: La columna '${column}' no existe. Verifica tu schema en Supabase.`
  }
  
  if (error.code === '23505') {
    return 'Esta orden ya existe.'
  }
  
  if (error.code === '23503') {
    return 'Producto o paquete no válido.'
  }
  
  return `No se pudo crear la orden: ${error.message || error.code || 'Error desconocido'}`
}
