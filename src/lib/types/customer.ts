/**
 * Customer - Cliente registrado
 */
export interface Customer {
  id: string
  full_name: string
  phone: string // Nuestro lookup key principal
  email: string // Key de Conekta (almacenamiento)
  address: string | null
  created_at: string
}

/**
 * Datos para crear un cliente
 */
export interface CreateCustomerData {
  name: string
  phone: string // Nuestro lookup key
  email: string // Key de Conekta
  address?: string
}
