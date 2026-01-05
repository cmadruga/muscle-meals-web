import type { RecipeIngredient } from './ingredient'

/**
 * Tipo de receta
 */
export type RecipeType = 'main' | 'sub'

/**
 * Receta base
 */
export interface Recipe {
  id: string
  name: string
  description: string | null
  type: RecipeType
  ingredients: RecipeIngredient[]
  created_at: string
}

/**
 * Receta básica para UI
 */
export interface RecipeBasic {
  id: string
  name: string
  type: RecipeType
}
