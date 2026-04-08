'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCustomerByUserId } from '@/lib/db/customers'
import type { Size } from '@/lib/types'
import { calculateCustomSizePrice, CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'

interface CreateCustomSizeData {
  name: string
  protein_qty: Record<string, number>
  carb_qty: Record<string, number>
  veg_qty: number
}

export async function createCustomSize(
  data: CreateCustomSizeData
): Promise<{ size?: Size; error?: string }> {
  if (!data.name.trim()) {
    return { error: 'El nombre es requerido' }
  }

  const supabase = createAdminClient()

  const proteinQty = data.protein_qty
  const carbQty = data.carb_qty

  // Fetch one main size as reference to derive ingredient ratios.
  // ratio = ref_qty / BASE_GR → normalizedQty = custom_qty / ratio = custom_qty * BASE_GR / ref_qty
  // Esto permite que papa (ratio 5x) tenga el mismo tier de precio que arroz a cantidad equivalente.
  const { data: refSize } = await supabase
    .from('sizes')
    .select('protein_qty, carb_qty')
    .eq('is_main', true)
    .ilike('name', 'fit')
    .single()

  function normalizeQtys(
    qtys: Record<string, number>,
    refQtys: Record<string, number> | undefined,
    baseGr: number,
  ): number {
    let best = 0
    for (const [ingId, qty] of Object.entries(qtys)) {
      const refQty = refQtys?.[ingId]
      const normalized = refQty && refQty > 0 ? qty * baseGr / refQty : qty
      if (normalized > best) best = normalized
    }
    return best
  }

  // Normalizar usando FIT como referencia: normalizedQty = custom_qty * BASE.FIT / qty_FIT[ingrediente]
  // Esto hace que un ingrediente con ratio ×5 (papa) mapee al mismo tier que el arroz equivalente.
  const proteinForPrice = normalizeQtys(proteinQty, refSize?.protein_qty, PROTEIN_BASE.FIT)
  const carbForPrice    = normalizeQtys(carbQty,    refSize?.carb_qty,    CARB_BASE.FIT)
  const { price, packagePrice } = calculateCustomSizePrice(proteinForPrice, carbForPrice, data.veg_qty)

  // Check if user is authenticated (usar client con cookies, no admin)
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()

  if (!user) {
    // No session → return ephemeral size without DB insert
    const ephemeralSize: Size = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: null,
      is_main: false,
      customer_id: null,
      protein_qty: proteinQty,
      carb_qty: carbQty,
      veg_qty: data.veg_qty,
      price,
      package_price: packagePrice,
      created_at: new Date().toISOString(),
    }
    return { size: ephemeralSize }
  }

  // Authenticated → find customer and persist
  const customer = await getCustomerByUserId(user.id)
  const customerId = customer?.id

  if (!customerId) {
    return { error: 'No se pudo encontrar el cliente para el usuario autenticado.' }
  }

  const { data: existingSize } = await supabase
    .from('sizes')
    .select('id')
    .eq('name', data.name.trim())
    .eq('customer_id', customerId)
    .single()

  if (existingSize) {
    // Update existing size
    const { data: updated, error } = await supabase
      .from('sizes')
      .update({
        protein_qty: proteinQty,
        carb_qty: carbQty,
        veg_qty: data.veg_qty,
        price,
        package_price: packagePrice,
      })
      .eq('id', existingSize.id)
      .select()
      .single()
    
    if (error) return { error: `Error al actualizar el tamaño: ${error.message}` }
    return { size: updated as Size }
  }

  // Insert new size
  const { data: inserted, error } = await supabase
    .from('sizes')
    .insert({
      name: data.name.trim(),
      description: null,
      is_main: false,
      customer_id: customerId,
      protein_qty: proteinQty,
      carb_qty: carbQty,
      veg_qty: data.veg_qty,
      price,
      package_price: packagePrice,
    })
    .select()
    .single()

  if (error) return { error: `Error al crear el tamaño: ${error.message}` }
  return { size: inserted as Size }
}
