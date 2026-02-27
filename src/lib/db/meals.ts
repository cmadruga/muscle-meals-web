import { createClient } from '@/lib/supabase/server'
import type { Meal, MealBasic, MealWithRecipes, Recipe, Ingredient } from '@/lib/types'

export type { MealWithRecipes }

/**
 * Obtiene todos los meals activos
 */
export async function getActiveMeals(): Promise<Meal[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching meals:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as Meal[]
}

/**
 * Obtiene meals básicos para UI
 */
export async function getMealsBasic(): Promise<MealBasic[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, description, img')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching meals:', error)
    throw new Error('No se pudieron cargar los platillos')
  }

  return data as MealBasic[]
}

/**
 * Obtiene todos los meals activos con recetas e ingredientes
 * Útil para páginas de paquetes donde se necesitan macros
 */
export async function getActiveMealsWithRecipes(): Promise<MealWithRecipes[]> {
  const supabase = await createClient()
  
  // 1. Obtener todos los meals activos
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (mealsError) {
    console.error('Error fetching meals:', mealsError)
    throw new Error('No se pudieron cargar los platillos')
  }

  if (!meals || meals.length === 0) return []

  // 2. Obtener todos los IDs de recetas principales
  const mainRecipeIds = meals.map(m => m.main_recipe_id)
  
  const { data: mainRecipes, error: mainError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', mainRecipeIds)

  if (mainError) {
    console.error('Error fetching main recipes:', mainError)
    throw new Error('Error al cargar las recetas')
  }

  // 3. Obtener sub-recetas para todos los meals
  const { data: mealSubRecipes } = await supabase
    .from('meal_sub_recipes')
    .select('meal_id, sub_recipe_id')
    .in('meal_id', meals.map(m => m.id))

  const subRecipeIds = [...new Set(mealSubRecipes?.map(m => m.sub_recipe_id) || [])]
  
  let subRecipes: Recipe[] = []
  if (subRecipeIds.length > 0) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', subRecipeIds)
    
    if (!error && data) {
      subRecipes = data as Recipe[]
    }
  }

  // 4. Obtener todos los ingredientes únicos
  const allIngredientIds = new Set<string>()
  for (const recipe of [...(mainRecipes || []), ...subRecipes]) {
    for (const ing of recipe.ingredients) {
      allIngredientIds.add(ing.ingredient_id)
    }
  }

  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('*')
    .in('id', Array.from(allIngredientIds))

  if (ingError) {
    console.error('Error fetching ingredients:', ingError)
    throw new Error('Error al cargar ingredientes')
  }

  // 5. Ensamblar todo
  const recipesMap = new Map((mainRecipes || []).map(r => [r.id, r as Recipe]))
  const subRecipesMap = new Map(subRecipes.map(r => [r.id, r]))
  const mealSubRecipesMap = new Map<string, string[]>()
  
  for (const msr of mealSubRecipes || []) {
    if (!mealSubRecipesMap.has(msr.meal_id)) {
      mealSubRecipesMap.set(msr.meal_id, [])
    }
    mealSubRecipesMap.get(msr.meal_id)!.push(msr.sub_recipe_id)
  }

  return meals.map(meal => {
    const mainRecipe = recipesMap.get(meal.main_recipe_id)
    const mealSubRecipeIds = mealSubRecipesMap.get(meal.id) || []
    const mealSubRecipes = mealSubRecipeIds
      .map(id => subRecipesMap.get(id))
      .filter(r => r !== undefined) as Recipe[]

    // Filtrar solo los ingredientes que usa este meal específico
    const usedIngredientIds = new Set([
      ...(mainRecipe?.ingredients || []).map(i => i.ingredient_id),
      ...mealSubRecipes.flatMap(r => r.ingredients.map(i => i.ingredient_id))
    ])
    const mealIngredients = (ingredients || []).filter(i => usedIngredientIds.has(i.id))

    return {
      ...meal,
      mainRecipe: mainRecipe!,
      subRecipes: mealSubRecipes,
      ingredients: mealIngredients
    }
  }) as MealWithRecipes[]
}

/**
 * Obtiene un meal por ID con sus recetas e ingredientes completos
 */
export async function getMealById(id: string): Promise<MealWithRecipes | null> {
  const supabase = await createClient()
  
  // 1. Obtener meal
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single()

  if (mealError) {
    if (mealError.code === 'PGRST116') return null
    console.error('Error fetching meal:', mealError)
    throw new Error('Error al cargar el platillo')
  }

  // 2. Obtener receta principal
  const { data: mainRecipe, error: mainError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', meal.main_recipe_id)
    .single()

  if (mainError) {
    console.error('Error fetching main recipe:', mainError)
    throw new Error('Error al cargar la receta principal')
  }

  // 3. Obtener sub-recetas
  const { data: mealSubRecipes } = await supabase
    .from('meal_sub_recipes')
    .select('sub_recipe_id')
    .eq('meal_id', id)

  const subRecipeIds = mealSubRecipes?.map(m => m.sub_recipe_id) || []
  
  let subRecipes: Recipe[] = []
  if (subRecipeIds.length > 0) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', subRecipeIds)
    
    if (!error) {
      subRecipes = data as Recipe[]
    }
  }

  // 4. Obtener todos los ingredientes únicos
  const allIngredientIds = new Set<string>()
  for (const ing of mainRecipe.ingredients) {
    allIngredientIds.add(ing.ingredient_id)
  }
  for (const subRecipe of subRecipes) {
    for (const ing of subRecipe.ingredients) {
      allIngredientIds.add(ing.ingredient_id)
    }
  }

  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('*')
    .in('id', Array.from(allIngredientIds))

  if (ingError) {
    console.error('Error fetching ingredients:', ingError)
    throw new Error('Error al cargar ingredientes')
  }

  return {
    ...meal,
    mainRecipe: mainRecipe as Recipe,
    subRecipes,
    ingredients: ingredients as Ingredient[]
  } as MealWithRecipes
}
