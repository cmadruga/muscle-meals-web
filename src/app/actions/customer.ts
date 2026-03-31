'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { buildFullAddress, validateCP, isValidPostalCode, normalizePhone } from '@/lib/address-validation'
import type { Customer } from '@/lib/types'

type ProfileState = { error?: string; success?: boolean }

export async function updateCustomerProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const full_name = (formData.get('full_name') as string)?.trim()
  const phone = normalizePhone((formData.get('phone') as string)?.trim() ?? '') || null

  // Campos de dirección
  const calle = (formData.get('calle') as string)?.trim()
  const numeroExterior = (formData.get('numeroExterior') as string)?.trim()
  const numeroInterior = (formData.get('numeroInterior') as string)?.trim() || undefined
  const colonia = (formData.get('colonia') as string)?.trim()
  const codigoPostal = (formData.get('codigoPostal') as string)?.trim()
  const ciudad = (formData.get('ciudad') as string)?.trim()
  const estado = (formData.get('estado') as string)?.trim()

  if (!full_name) return { error: 'El nombre es requerido' }

  // Validar dirección si se proporcionó algún campo
  const hasAddress = calle || numeroExterior || colonia || codigoPostal
  if (hasAddress) {
    if (!calle || !numeroExterior || !colonia || !codigoPostal || !ciudad) {
      return { error: 'Completa todos los campos obligatorios de la dirección' }
    }
    if (!validateCP(codigoPostal) || !isValidPostalCode(codigoPostal)) {
      return { error: 'Código postal fuera del área de entrega' }
    }
  }

  const address = hasAddress
    ? buildFullAddress({ calle, numeroExterior, numeroInterior, colonia, codigoPostal, ciudad, estado })
    : null

  const { error } = await createAdminClient()
    .from('customers')
    .update({ full_name, phone, address })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating customer:', error)
    return { error: 'No se pudo guardar. Intenta de nuevo.' }
  }

  revalidatePath('/cuenta')
  return { success: true }
}

/**
 * Actualiza el customer del usuario logueado al hacer checkout.
 */
export async function updateLoggedInCustomer(data: {
  customerId: string
  name: string
  phone: string
  address: string | null
}): Promise<{ customer: Customer | null; error?: string }> {
  const { data: updated, error } = await createAdminClient()
    .from('customers')
    .update({
      full_name: data.name,
      phone: data.phone,
      address: data.address,
    })
    .eq('id', data.customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating logged-in customer at checkout:', error)
    return { customer: null, error: error.message }
  }

  return { customer: updated as Customer }
}
