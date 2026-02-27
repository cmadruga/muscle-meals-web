import type { Recipe } from './recipe'
import type { Ingredient } from './ingredient'

/**
 * Meal (platillo) = 1 main recipe + N sub recipes
 */
export interface Meal {
  id: string
  name: string
  description: string | null
  img: string | null
  main_recipe_id: string
  active: boolean
  created_at: string
}

/**
 * Meal con recetas e ingredientes completos
 */
export interface MealWithRecipes extends Meal {
  mainRecipe: Recipe
  subRecipes: Recipe[]
  ingredients: Ingredient[]
}

/**
 * Meal básico para UI
 */
export interface MealBasic {
  id: string
  name: string
  description: string | null
  img: string | null
}

/**
 * Relación meal ↔ sub-receta (junction table meal_sub_recipes)
 */
export interface MealSubRecipe {
  id: string
  meal_id: string
  sub_recipe_id: string
  created_at: string
}
