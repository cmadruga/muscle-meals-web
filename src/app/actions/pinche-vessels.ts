'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type VesselFormData = {
  name: string
  peso_gr: number
}

function revalidateAll() {
  revalidatePath('/admin/pinche')
  revalidatePath('/admin/database')
}

export async function createVessel(data: VesselFormData): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('pinche_vessels').insert(data)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function updateVessel(id: string, data: VesselFormData): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('pinche_vessels').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function deleteVessel(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('pinche_vessels').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}
