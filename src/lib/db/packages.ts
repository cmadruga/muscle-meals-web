import { createClient } from '@/lib/supabase/server'
import type { Package, PackageBasic } from '@/lib/types'

/**
 * Obtiene todos los paquetes activos
 */
export async function getActivePackages(): Promise<Package[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)
    .order('meals_included', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    throw new Error('No se pudieron cargar los paquetes')
  }

  return data as Package[]
}

/**
 * Obtiene paquetes básicos para UI
 */
export async function getPackagesBasic(): Promise<PackageBasic[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, meals_included')
    .eq('active', true)
    .order('meals_included', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    throw new Error('No se pudieron cargar los paquetes')
  }

  return data as PackageBasic[]
}

/**
 * Obtiene un paquete por ID
 */
export async function getPackageById(id: string): Promise<Package | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('packages')
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
