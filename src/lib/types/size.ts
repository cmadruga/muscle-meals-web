/**
 * Size/Variante de meal o package
 */
export interface Size {
  id: string
  name: string // LOW, FIT, PLUS, o nombre custom
  description: string | null
  is_main: boolean // true para principales, false para custom
  customer_id: string | null // null para main, customer_id para custom
  // Cantidades base por tipo de ingrediente
  protein_qty: Record<string, number> // { "default": 120, "uuid-pollo": 120, ... }
  carb_qty: Record<string, number>    // { "default": 55, "uuid-papa": 300, ... }
  veg_qty: number // gramos de ingredientes tipo 'veg'
  // Precios (centavos MXN)
  price: number // precio unitario de meal
  package_price: number // precio de meal en paquete
  created_at: string
}

/**
 * Size básico para UI
 */
export interface SizeBasic {
  id: string
  name: string
  price: number
  package_price: number
}
