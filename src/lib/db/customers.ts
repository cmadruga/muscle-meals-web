import { createClient } from '../supabase/client'
import type { Customer, CreateCustomerData } from '../types/customer'

/**
 * Crea o actualiza un cliente
 * Si ya existe (por email), retorna el existente
 */
export async function upsertCustomer(data: CreateCustomerData): Promise<Customer | null> {
  const supabase = createClient()

  // Primero buscar si ya existe por email
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', data.email)
    .single()

  if (existing) {
    // Actualizar nombre y teléfono si cambiaron
    const { data: updated, error } = await supabase
      .from('customers')
      .update({
        full_name: data.name,
        phone: data.phone
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return existing as Customer
    }

    return updated as Customer
  }

  // Si no existe, crear nuevo
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      full_name: data.name,
      email: data.email,
      phone: data.phone
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return null
  }

  return newCustomer as Customer
}

/**
 * Obtener cliente por ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return null
  }

  return data as Customer
}

/**
 * Obtener cliente por email
 */
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data as Customer
}
