import { createClient } from '@/lib/supabase/server'
import type { Meal, MealBasic } from '@/lib/types'

/**
 * Obtiene todos los meals activos
 */
export async function getActiveMeals(): Promise<Meal[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching meals:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as Meal[]
}

/**
 * Obtiene meals básicos para UI
 */
export async function getMealsBasic(): Promise<MealBasic[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, description, img')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching meals:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as MealBasic[]
}

/**
 * Obtiene un meal por ID
 */
export async function getMealById(id: string): Promise<Meal | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching meal:', error)
    throw new Error('Error al cargar el platillo')
  }

  return data as Meal
}
