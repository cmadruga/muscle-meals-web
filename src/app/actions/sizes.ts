'use server'

import { createClient } from '@/lib/supabase/server'
import { getCustomerByUserId } from '@/lib/db/customers'
import type { Size } from '@/lib/types'
import { calculateCustomSizePrice } from '@/lib/utils/pricing'

interface CreateCustomSizeData {
  name: string
  protein_qty: number
  carb_qty: number
  veg_qty: number
}

export async function createCustomSize(
  data: CreateCustomSizeData
): Promise<{ size?: Size; error?: string }> {
  if (!data.name.trim()) {
    return { error: 'El nombre es requerido' }
  }

  const { price, packagePrice } = calculateCustomSizePrice(data.protein_qty, data.carb_qty, data.veg_qty)

  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // No session → return ephemeral size without DB insert
    const ephemeralSize: Size = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: null,
      is_main: false,
      customer_id: null,
      protein_qty: data.protein_qty,
      carb_qty: data.carb_qty,
      veg_qty: data.veg_qty,
      price,
      package_price: packagePrice,
      created_at: new Date().toISOString(),
    }
    return { size: ephemeralSize }
  }

  // Authenticated → find customer and persist
  const customer = await getCustomerByUserId(user.id)
  const customerId = customer?.id ?? null

  const { data: inserted, error } = await supabase
    .from('sizes')
    .insert({
      name: data.name.trim(),
      description: null,
      is_main: false,
      customer_id: customerId,
      protein_qty: data.protein_qty,
      carb_qty: data.carb_qty,
      veg_qty: data.veg_qty,
      price,
      package_price: packagePrice,
    })
    .select()
    .single()

  if (error) {
    // UNIQUE constraint violation on (name, customer_id)
    if (error.code === '23505') {
      return { error: `Ya existe un tamaño con el nombre "${data.name.trim()}". Usa otro nombre.` }
    }
    console.error('Error creating custom size:', error)
    return { error: 'Error al crear el tamaño personalizado' }
  }

  return { size: inserted as Size }
}
