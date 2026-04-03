import { createAdminClient } from '@/lib/supabase/admin'
import type { Material } from '@/lib/types'

export async function getAllMaterials(): Promise<Material[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching materials:', error)
    throw new Error('No se pudieron cargar los materiales')
  }

  return data as Material[]
}
