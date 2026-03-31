import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order, OrderItem, OrderWithItems, OrderWithCustomer, CreateOrderPayload, CreateOrderItemData } from '@/lib/types'

// Tipos para los resultados de Supabase con joins (campos extra de relaciones)
type RawItemJoin = OrderItem & { meals: { name: string } | null; sizes: { name: string } | null }
type RawOrderWithItems = Order & { order_items: RawItemJoin[] }
type RawOrderWithCustomer = Order & {
  customers: { full_name: string; phone: string | null; address: string | null } | null
  order_items: RawItemJoin[]
}

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
  const { data: order, error: orderError } = await createAdminClient()
    .from('orders')
    .insert({
      customer_id: payload.customer_id || null,
      total_amount: payload.total_amount,
      status: payload.status || 'pending',
      shipping_type: payload.shipping_type || 'standard',
      pickup_spot_id: payload.pickup_spot_id || null,
      shipping_cost: payload.shipping_cost || 0
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
    unit_price: item.unit_price
  }))

  const { error: itemsError } = await createAdminClient()
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Rollback: eliminar la orden si fallan los items
    await createAdminClient().from('orders').delete().eq('id', order.id)
    console.error('Error creating order items:', itemsError)
    throw new Error('Error al crear los items de la orden')
  }

  return order as Order
}

/**
 * Obtiene una orden por ID con sus items
 */
export async function getOrderWithItems(id: string): Promise<OrderWithItems | null> {
  const { data: order, error: orderError } = await createAdminClient()
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (orderError) {
    if (orderError.code === 'PGRST116') return null
    console.error('Error fetching order:', orderError)
    throw new Error('Error al cargar la orden')
  }

  const { data: items, error: itemsError } = await createAdminClient()
    .from('order_items')
    .select(`
      *,
      meals:meal_id (name),
      sizes:size_id (name)
    `)
    .eq('order_id', id)

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    throw new Error('Error al cargar los items')
  }

  return {
    ...order,
    items: items.map(item => ({
      ...item,
      meal_name: item.meals?.name || 'Platillo',
      size_name: item.sizes?.name || ''
    }))
  } as OrderWithItems
}

/**
 * Obtiene una orden por ID (sin items)
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await createAdminClient()
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
 * Actualiza el status de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'creado' | 'pending' | 'paid' | 'cancelled' | 'extra'
): Promise<void> {
  const { error } = await createAdminClient()
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    throw new Error('Error al actualizar el estado de la orden')
  }
}

/**
 * Actualiza el payment_gateway_id de una orden (MP payment_id o Conekta order_id)
 */
export async function updatePaymentGatewayId(orderId: string, gatewayId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from('orders')
    .update({
      payment_gateway_id: gatewayId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment_gateway_id:', error)
    throw new Error('Error al actualizar el ID del gateway de pago')
  }
}

/**
 * Busca una orden por payment_gateway_id
 */
export async function getOrderByGatewayId(gatewayId: string): Promise<Order | null> {
  const { data, error } = await createAdminClient()
    .from('orders')
    .select('*')
    .eq('payment_gateway_id', gatewayId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching order by gateway ID:', error)
    throw new Error('Error al buscar la orden')
  }

  return data as Order
}

/**
 * Obtiene las últimas 20 órdenes de un cliente (server-side).
 * Pasar el cliente de Supabase como parámetro para compatibilidad con SSR.
 */
export async function getOrdersByCustomerId(
  client: SupabaseClient,
  customerId: string
): Promise<OrderWithItems[]> {
  const { data, error } = await client
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        meals:meal_id (name),
        sizes:size_id (name)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }

  return ((data ?? []) as RawOrderWithItems[]).map(({ order_items, ...order }) => ({
    ...order,
    items: order_items.map(({ meals, sizes, ...item }) => ({
      ...item,
      meal_name: meals?.name || 'Platillo',
      size_name: sizes?.name || '',
    })),
  })) as OrderWithItems[]
}

/**
 * Obtiene todas las órdenes de una semana (server-side, para panel admin).
 * Pasar el cliente de Supabase como parámetro para compatibilidad con SSR.
 */
export async function getOrdersForWeek(
  client: SupabaseClient,
  weekStart: Date
): Promise<OrderWithCustomer[]> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data, error } = await client
    .from('orders')
    .select(`
      *,
      customers:customer_id (full_name, phone, address),
      order_items (
        *,
        meals:meal_id (name),
        sizes:size_id (name)
      )
    `)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders for week:', error)
    return []
  }

  return ((data ?? []) as RawOrderWithCustomer[]).map(
    ({ customers, order_items, ...order }) => ({
      ...order,
      customer_name: customers?.full_name ?? null,
      customer_phone: customers?.phone ?? null,
      customer_address: customers?.address ?? null,
      items: order_items.map(({ meals, sizes, ...item }) => ({
        ...item,
        meal_name: meals?.name || 'Platillo',
        size_name: sizes?.name || '',
      })),
    })
  ) as unknown as OrderWithCustomer[]
}

/**
 * Mensajes de error específicos de Supabase
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string }
    
    if (err.code === 'PGRST204') {
      const column = err.message?.match(/'(.+?)'/)?.[1] || 'desconocida'
      return `Error de base de datos: La columna '${column}' no existe. Verifica tu schema en Supabase.`
    }
    
    if (err.code === '23505') {
      return 'Esta orden ya existe.'
    }
    
    if (err.code === '23503') {
      return 'Producto o paquete no válido.'
    }
    
    return `No se pudo crear la orden: ${err.message || err.code || 'Error desconocido'}`
  }
  
  return 'No se pudo crear la orden: Error desconocido'
}
