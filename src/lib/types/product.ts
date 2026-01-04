/**
 * Representa un producto genérico en la tienda
 * Puede ser un paquete o un producto individual
 */
export interface Product {
  id: string
  name: string
  description: string | null
  price: number // en centavos
  active: boolean
  meals_included?: number // solo para paquetes
  created_at: string
}

/**
 * Representa un platillo individual que puede seleccionarse
 * Corresponde a la tabla `dishes` en Supabase
 */
export interface Dish {
  id: string
  name: string
  description?: string | null
  active: boolean
}

/**
 * Datos mínimos del platillo para la UI
 */
export interface DishBasic {
  id: string
  name: string
}
