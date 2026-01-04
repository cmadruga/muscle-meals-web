import { supabase } from '@/lib/supabase/client'
import type { Order, CreateOrderPayload, OrderItem } from '@/lib/types'

/**
 * Crea una nueva orden desde el cliente (browser)
 * 
 * NOTA: Esta función usa el cliente browser porque se llama desde
 * un Client Component después de la selección del usuario.
 * 
 * En el futuro, considera mover esto a un Server Action para
 * mejor seguridad y validación server-side.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    
    // Errores comunes de Supabase con mensajes útiles
    if (error.code === 'PGRST204') {
      throw new Error(`Error de base de datos: La columna '${error.message.match(/'(.+?)'/)?.[1] || 'desconocida'}' no existe. Verifica tu schema en Supabase.`)
    }
    
    if (error.code === '23505') {
      throw new Error('Esta orden ya existe.')
    }
    
    // Error genérico pero con detalles
    throw new Error(`No se pudo crear la orden: ${error.message || error.code || 'Error desconocido'}`)
  }

  return data as Order
}

/**
 * Construye el payload de orden a partir de la selección del usuario
 */
export function buildOrderPayload(
  packageId: string,
  packagePrice: number,
  selection: Record<string, number>,
  dishNames: Record<string, string>
): CreateOrderPayload {
  const items: OrderItem[] = Object.entries(selection)
    .filter(([, qty]) => qty > 0)
    .map(([dishId, qty]) => ({
      product_id: dishId,
      name: dishNames[dishId] || 'Platillo desconocido',
      qty
    }))

  return {
    package_id: packageId,
    items,
    status: 'pending',
    total_amount: packagePrice
  }
}

/**
 * Obtiene una orden por ID (para página de checkout)
 * Usa cliente browser - considera mover a server si necesitas auth
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
