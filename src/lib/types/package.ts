/**
 * Package - Paquete de comidas
 * No tiene size fijo, el size se selecciona al ordenar
 */
export interface Package {
  id: string
  name: string
  img: string | null
  description: string | null
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
}
