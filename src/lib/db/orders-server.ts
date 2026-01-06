import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem, Meal, Size } from '@/lib/types'

export interface OrderItemDetailed extends OrderItem {
  meal: Meal
  size: Size
  subtotal: number
}

/**
 * Obtiene una orden por ID con items detallados (incluye meal y size)
 * Para mostrar en checkout
 * 
 * SOLO para Server Components
 */
export async function getOrderDetailed(id: string): Promise<{
  order: Order
  items: OrderItemDetailed[]
} | null> {
  const supabase = await createClient()
  
  // 1. Obtener orden
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

  // 2. Obtener items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    throw new Error('Error al cargar los items')
  }

  if (!orderItems || orderItems.length === 0) {
    return {
      order: order as Order,
      items: []
    }
  }

  // 3. Obtener meals y sizes
  const mealIds = [...new Set(orderItems.map(item => item.meal_id))]
  const sizeIds = [...new Set(orderItems.map(item => item.size_id))]

  const [mealsResult, sizesResult] = await Promise.all([
    supabase.from('meals').select('*').in('id', mealIds),
    supabase.from('sizes').select('*').in('id', sizeIds)
  ])

  if (mealsResult.error) {
    console.error('Error fetching meals:', mealsResult.error)
    throw new Error('Error al cargar las comidas')
  }

  if (sizesResult.error) {
    console.error('Error fetching sizes:', sizesResult.error)
    throw new Error('Error al cargar los tamaños')
  }

  const mealsMap = new Map((mealsResult.data || []).map(m => [m.id, m as Meal]))
  const sizesMap = new Map((sizesResult.data || []).map(s => [s.id, s as Size]))

  // 4. Ensamblar items detallados
  const itemsDetailed: OrderItemDetailed[] = orderItems.map(item => ({
    ...item,
    meal: mealsMap.get(item.meal_id)!,
    size: sizesMap.get(item.size_id)!,
    subtotal: item.unit_price * item.qty
  }))

  return {
    order: order as Order,
    items: itemsDetailed
  }
}
