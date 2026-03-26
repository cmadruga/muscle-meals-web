import { createClient } from '../supabase/client'
import type { Customer, CreateCustomerData } from '../types/customer'

export type CustomerBasic = { id: string; full_name: string; phone: string | null; address: string | null }

/**
 * Crea un customer para pedidos guest — siempre inserta uno nuevo.
 */
export async function createGuestCustomer(data: CreateCustomerData): Promise<Customer | null> {
  const supabase = createClient()

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      full_name: data.name,
      phone: data.phone || null,
      address: data.address || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating guest customer:', error)
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

/**
 * Obtener cliente por user_id (Google OAuth)
 */
export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return data as Customer
}
