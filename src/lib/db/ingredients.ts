import { createClient } from '@/lib/supabase/server'
import type { Ingredient } from '@/lib/types'

export async function getAllIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('type', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching ingredients:', error)
    throw new Error('No se pudieron cargar los ingredientes')
  }

  return data as Ingredient[]
}
