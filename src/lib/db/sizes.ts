import { createClient } from '@/lib/supabase/server'
import type { Size, SizeBasic } from '@/lib/types'

export type SizeWithCustomer = Size & { customer_name: string | null }

/**
 * Obtiene todos los sizes con nombre del customer si aplica.
 * Main sizes primero, luego custom ordenados por nombre de customer.
 */
export async function getAllSizesWithCustomer(): Promise<SizeWithCustomer[]> {
  const supabase = await createClient()

  const [sizesRes, customersRes] = await Promise.all([
    supabase.from('sizes').select('*').order('is_main', { ascending: false }).order('name', { ascending: true }),
    supabase.from('customers').select('id, full_name'),
  ])

  if (sizesRes.error) throw new Error('No se pudieron cargar los tamaños')

  const customerMap = new Map<string, string>(
    (customersRes.data ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name])
  )

  return (sizesRes.data ?? []).map((s: Size) => ({
    ...s,
    customer_name: s.customer_id ? (customerMap.get(s.customer_id) ?? null) : null,
  }))
}

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
 * Obtiene todos los sizes globales (customer_id IS NULL): LOW/FIT/PLUS + custom globales
 */
export async function getGlobalSizes(): Promise<Size[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .is('customer_id', null)
    .order('is_main', { ascending: false }) // main primero
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching global sizes:', error)
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
