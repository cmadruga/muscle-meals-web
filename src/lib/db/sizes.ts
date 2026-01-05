import { createClient } from '@/lib/supabase/server'
import type { Size, SizeBasic } from '@/lib/types'

/**
 * Obtiene los sizes principales (LOW, FIT, PLUS)
 */
export async function getMainSizes(): Promise<Size[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .eq('is_main', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching sizes:', error)
    throw new Error('No se pudieron cargar los tamaños')
  }

  return data as Size[]
}

/**
 * Obtiene sizes básicos para UI
 */
export async function getSizesBasic(): Promise<SizeBasic[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sizes')
    .select('id, name, price, package_price')
    .eq('is_main', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching sizes:', error)
    throw new Error('No se pudieron cargar los tamaños')
  }

  return data as SizeBasic[]
}

/**
 * Obtiene un size por ID
 */
export async function getSizeById(id: string): Promise<Size | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching size:', error)
    throw new Error('Error al cargar el tamaño')
  }

  return data as Size
}

/**
 * Obtiene sizes personalizados de un cliente
 */
export async function getCustomerSizes(customerId: string): Promise<Size[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .eq('customer_id', customerId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching customer sizes:', error)
    throw new Error('No se pudieron cargar los tamaños personalizados')
  }

  return data as Size[]
}
