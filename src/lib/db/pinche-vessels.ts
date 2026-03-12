import { createClient } from '@/lib/supabase/server'
import type { PincheVessel } from '@/lib/types'

export async function getAllPincheVessels(): Promise<PincheVessel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pinche_vessels')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error('No se pudieron cargar los recipientes')
  return data as PincheVessel[]
}
