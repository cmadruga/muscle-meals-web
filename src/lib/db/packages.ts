import { createClient } from '@/lib/supabase/server'
import type { Package, PackageBasic } from '@/lib/types'

/**
 * Obtiene todos los paquetes activos
 * Uso: página principal para listar paquetes disponibles
 */
export async function getActivePackages(): Promise<Package[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .not('meals_included', 'is', null) // Solo productos tipo paquete
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    throw new Error('No se pudieron cargar los paquetes')
  }

  return data as Package[]
}

/**
 * Obtiene un paquete por ID (datos básicos para UI de selección)
 * Uso: página de selección de platillos
 */
export async function getPackageById(id: string): Promise<PackageBasic | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, meals_included, price')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No encontrado
    console.error('Error fetching package:', error)
    throw new Error('Error al cargar el paquete')
  }

  return data as PackageBasic
}

/**
 * Obtiene un paquete completo por ID
 */
export async function getPackageFull(id: string): Promise<Package | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching package:', error)
    throw new Error('Error al cargar el paquete')
  }

  return data as Package
}
