import type { Recipe, RecipeBasic } from './recipe'

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
 * Meal con recetas completas
 */
export interface MealWithRecipes extends Meal {
  main_recipe: Recipe
  sub_recipes: Recipe[]
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
 * Meal con sub_recipes IDs (para relación)
 */
export interface MealSubRecipe {
  id: string
  meal_id: string
  recipe_id: string
  created_at: string
}
