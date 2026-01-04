import { createClient } from '@/lib/supabase/server'
import type { Product, Dish, DishBasic } from '@/lib/types'

/**
 * Obtiene todos los productos activos (para página principal)
 */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    throw new Error('No se pudieron cargar los productos')
  }

  return data as Product[]
}

/**
 * Obtiene todos los platillos activos (para selección en paquetes)
 * Retorna solo datos mínimos para optimizar payload
 */
export async function getActiveDishes(): Promise<DishBasic[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching dishes:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as DishBasic[]
}

/**
 * Obtiene platillos completos con descripción
 */
export async function getDishesWithDetails(): Promise<Dish[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, description, active')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching dishes:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as Dish[]
}
