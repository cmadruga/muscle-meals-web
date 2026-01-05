/**
 * Tipo de ingrediente
 */
export type IngredientType = 'pro' | 'carb' | 'veg'

/**
 * Unidad de medida
 */
export type Unit = 'g' | 'ml' | 'pz' | 'tsp' | 'tbsp'

/**
 * Macros de un ingrediente (por 100g)
 */
export interface Macros {
  calories: number // kcal
  protein: number // gramos
  carbs: number // gramos
  fats: number // gramos
}

/**
 * Ingrediente base
 */
export interface Ingredient {
  id: string
  name: string
  description: string | null
  type: IngredientType | null // null = no se ajusta por size
  calories: number
  protein: number
  carbs: number
  fats: number
  unit: Unit
  created_at: string
}

/**
 * Ingrediente en una receta (con cantidad)
 */
export interface RecipeIngredient {
  ingredient_id: string
  qty: number
  unit: Unit
}
