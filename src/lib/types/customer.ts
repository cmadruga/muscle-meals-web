/**
 * Customer - Cliente registrado
 */
export interface Customer {
  id: string
  full_name: string
  phone: string | null  // null para clientes creados vía Google OAuth (sin checkout aún)
  email: string
  address: string | null
  user_id: string | null  // UUID de auth.users (vinculado vía Google OAuth)
  created_at: string
}

/**
 * Datos para crear un cliente
 */
export interface CreateCustomerData {
  name: string
  phone: string // Nuestro lookup key
  email?: string
  address?: string
}
