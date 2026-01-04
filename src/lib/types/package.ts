/**
 * Representa un paquete de comidas (ej. FIT x5, FIT x10)
 * Corresponde a la tabla `products` en Supabase donde type = 'package'
 */
export interface Package {
  id: string
  name: string
  description: string | null
  price: number // en centavos
  meals_included: number
  active: boolean
  created_at: string
}

/**
 * Datos mínimos del paquete para la UI de selección
 */
export interface PackageBasic {
  id: string
  name: string
  meals_included: number
  price: number // en centavos
}
