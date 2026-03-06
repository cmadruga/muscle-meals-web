import { createClient } from '@/lib/supabase/server'
import type { Recipe } from '@/lib/types'

export async function getAllRecipes(): Promise<Recipe[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('type', { ascending: true })

  if (error) {
    console.error('Error fetching recipes:', error)
    throw new Error('No se pudieron cargar las recetas')
  }

  return data as Recipe[]
}
