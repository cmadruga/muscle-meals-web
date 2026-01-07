/**
 * Customer - Cliente registrado
 */
export interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

/**
 * Datos para crear un cliente
 */
export interface CreateCustomerData {
  name: string
  email: string
  phone: string
}
