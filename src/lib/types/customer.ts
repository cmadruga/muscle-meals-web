/**
 * Customer - Cliente registrado
 */
export interface Customer {
  id: string
  full_name: string
  phone: string
  address: string | null
  created_at: string
}

/**
 * Datos para crear un cliente
 */
export interface CreateCustomerData {
  name: string
  phone: string
  address?: string
}
