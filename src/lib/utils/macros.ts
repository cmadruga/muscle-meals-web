import type { Recipe, Size, Ingredient, Macros } from '@/lib/types'

/**
 * Calcula los macros totales de un meal basado en sus recetas y el size seleccionado
 */
export function calculateMealMacros(
  mainRecipe: Recipe,
  subRecipes: Recipe[],
  ingredients: Map<string, Ingredient>,
  size: Size
): Macros {
  const totals: Macros = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }

  // 1. Calcular macros de receta principal (se ajusta por size)
  for (const recipeIng of mainRecipe.ingredients) {
    const ingredient = ingredients.get(recipeIng.ingredient_id)
    if (!ingredient) continue

    // Determinar cantidad según tipo de ingrediente
    let qty = recipeIng.qty
    if (ingredient.type === 'pro') qty = size.protein_qty
    else if (ingredient.type === 'carb') qty = size.carb_qty
    else if (ingredient.type === 'veg') qty = size.veg_qty
    // Si type es null, usa la cantidad original de la receta

    // Calcular macros proporcionales (ingredient tiene macros por 100g)
    const ratio = qty / 100
    totals.calories += ingredient.calories * ratio
    totals.protein += ingredient.protein * ratio
    totals.carbs += ingredient.carbs * ratio
    totals.fats += ingredient.fats * ratio
  }

  // 2. Calcular macros de sub-recetas (cantidades fijas, no se ajustan)
  for (const subRecipe of subRecipes) {
    for (const recipeIng of subRecipe.ingredients) {
      const ingredient = ingredients.get(recipeIng.ingredient_id)
      if (!ingredient) continue

      // Sub-recetas usan cantidad fija de la receta
      const ratio = recipeIng.qty / 100
      totals.calories += ingredient.calories * ratio
      totals.protein += ingredient.protein * ratio
      totals.carbs += ingredient.carbs * ratio
      totals.fats += ingredient.fats * ratio
    }
  }

  // Redondear a 1 decimal
  return {
    calories: Math.round(totals.calories * 10) / 10,
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fats: Math.round(totals.fats * 10) / 10
  }
}

/**
 * Formatea macros para mostrar en UI
 */
export function formatMacros(macros: Macros): string {
  return `${Math.round(macros.calories)} kcal · ${Math.round(macros.protein)}g pro · ${Math.round(macros.carbs)}g carb · ${Math.round(macros.fats)}g fat`
}
