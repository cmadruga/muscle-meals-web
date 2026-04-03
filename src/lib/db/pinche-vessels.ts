import { createAdminClient } from '@/lib/supabase/admin'
import type { PincheVessel } from '@/lib/types'

export async function getAllPincheVessels(): Promise<PincheVessel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pinche_vessels')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error('No se pudieron cargar los recipientes')
  return data as PincheVessel[]
}
