'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type MaterialFormData = {
  name: string
  cant: number         // cantidad del empaque (para precio/und)
  cant_actual: number  // stock actual
  precio: number       // precio total del empaque
  stock_minimo: number
  resta_tipo: 'orden' | 'fija'
  resta_cant: number
  proveedor: string | null
}

function revalidateAll() {
  revalidatePath('/admin/stock')
  revalidatePath('/admin/database')
}

export async function createMaterial(
  data: MaterialFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('materials').insert(data)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function updateMaterial(
  id: string,
  data: MaterialFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('materials').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function deleteMaterial(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

export async function updateMaterialStock(
  id: string,
  cant_actual: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('materials')
    .update({ cant_actual: Math.max(0, cant_actual) })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/stock')
  return {}
}
