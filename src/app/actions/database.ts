'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { IngredientType, RecipeType, Unit, UnitConversion } from '@/lib/types'
import type { RecipeVesselConfig } from '@/lib/types/recipe'

// ─── Meals ───────────────────────────────────────────────────────────────────

export async function updateMeal(
  id: string,
  data: { name?: string; description?: string | null; img?: string | null }
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('meals').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  revalidatePath('/menu')
  return {}
}

export async function updateMealFull(
  id: string,
  data: { mainRecipeId: string; subRecipeIds: string[]; description: string | null; img?: string | null }
): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes').select('name').eq('id', data.mainRecipeId).single()
  if (recipeError) return { error: recipeError.message }

  const { error: mealError } = await supabase.from('meals').update({
    name: recipe.name,
    main_recipe_id: data.mainRecipeId,
    description: data.description,
    ...(data.img !== undefined ? { img: data.img } : {}),
  }).eq('id', id)
  if (mealError) return { error: mealError.message }

  await supabase.from('meal_sub_recipes').delete().eq('meal_id', id)
  if (data.subRecipeIds.length > 0) {
    const { error: subError } = await supabase
      .from('meal_sub_recipes')
      .insert(data.subRecipeIds.map((sub_recipe_id) => ({ meal_id: id, sub_recipe_id })))
    if (subError) return { error: subError.message }
  }

  revalidatePath('/admin/database')
  revalidatePath('/menu')
  return {}
}

export async function toggleMealActive(
  id: string,
  active: boolean
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('meals').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  revalidatePath('/menu')
  return {}
}

export async function uploadMealImage(
  mealId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'Sin archivo' }

  const ext = file.name.split('.').pop()
  const filename = `${mealId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('meal-images')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data } = admin.storage.from('meal-images').getPublicUrl(filename)
  return { publicUrl: data.publicUrl }
}

// ─── Meals ─ crear / borrar ───────────────────────────────────────────────────

export async function createMeal(
  mainRecipeId: string,
  subRecipeIds: string[]
): Promise<{ id?: string; error?: string }> {
  const supabase = createAdminClient()

  // Nombre = nombre de la receta principal
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('name')
    .eq('id', mainRecipeId)
    .single()

  if (recipeError) return { error: recipeError.message }

  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({ name: recipe.name, main_recipe_id: mainRecipeId, active: false })
    .select('id')
    .single()

  if (mealError) return { error: mealError.message }

  if (subRecipeIds.length > 0) {
    const { error: subError } = await supabase
      .from('meal_sub_recipes')
      .insert(subRecipeIds.map((sub_recipe_id) => ({ meal_id: meal.id, sub_recipe_id })))
    if (subError) return { error: subError.message }
  }

  revalidatePath('/admin/database')
  return { id: meal.id }
}

export async function deleteMeal(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Borrar sub-recetas primero (por si no hay cascade)
  await supabase.from('meal_sub_recipes').delete().eq('meal_id', id)

  const { error } = await supabase.from('meals').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/database')
  revalidatePath('/menu')
  return {}
}

// ─── Recetas ──────────────────────────────────────────────────────────────────

export interface RecipeIngredientInput {
  ingredient_id: string
  qty: number
  unit: Unit
  section?: 'pro' | 'carb' | 'veg'
}

export interface RecipeFormData {
  name: string
  type: RecipeType
  portions: number
  ingredients: RecipeIngredientInput[]
}

export async function createRecipe(
  data: RecipeFormData
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('recipes').insert({
    name: data.name,
    type: data.type,
    portions: data.portions,
    ingredients: data.ingredients,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function updateRecipe(
  id: string,
  data: RecipeFormData
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('recipes').update({
    name: data.name,
    type: data.type,
    portions: data.portions,
    ingredients: data.ingredients,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function deleteRecipe(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function updateRecipeVesselConfig(
  recipeId: string,
  config: RecipeVesselConfig
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('recipes')
    .update({ vessel_config: config })
    .eq('id', recipeId)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  revalidatePath('/admin/recetario')
  return {}
}

// ─── Sizes admin ──────────────────────────────────────────────────────────────

export type SizeAdmin = {
  id: string
  name: string
  protein_qty: Record<string, number>
  carb_qty: Record<string, number>
  veg_qty: number
  is_main: boolean
  customer_id: string | null
  customer_name: string | null
}

export async function getAllSizesAdmin(): Promise<SizeAdmin[]> {
  const supabase = createAdminClient()
  const [sizesRes, customersRes] = await Promise.all([
    supabase.from('sizes').select('id, name, protein_qty, carb_qty, veg_qty, is_main, customer_id'),
    supabase.from('customers').select('id, full_name'),
  ])
  if (sizesRes.error) return []

  const customerMap = new Map<string, string>(
    (customersRes.data ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name])
  )

  const result: SizeAdmin[] = (sizesRes.data ?? []).map((s: Omit<SizeAdmin, 'customer_name'>) => ({
    ...s,
    customer_name: s.customer_id ? (customerMap.get(s.customer_id) ?? null) : null,
  }))

  result.sort((a, b) => {
    const aGlobal = a.is_main && !a.customer_id
    const bGlobal = b.is_main && !b.customer_id
    if (aGlobal && !bGlobal) return -1
    if (!aGlobal && bGlobal) return 1
    const aCust = a.customer_name ?? ''
    const bCust = b.customer_name ?? ''
    return aCust.localeCompare(bCust) || a.name.localeCompare(b.name)
  })

  return result
}

export async function updateSizePortions(
  sizeId: string,
  proteinQty: Record<string, number>,
  carbQty: Record<string, number>,
  vegQty: number,
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('sizes')
    .update({ protein_qty: proteinQty, carb_qty: carbQty, veg_qty: vegQty })
    .eq('id', sizeId)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

// ─── Ingredientes ─────────────────────────────────────────────────────────────

export interface IngredientFormData {
  name: string
  type: IngredientType | null
  calories: number
  protein: number
  carbs: number
  fats: number
  unit: Unit
  cant: number
  precio: number
  public_name: string | null
  proveedor: string | null
  unit_conversions: UnitConversion[]
}

export async function createIngredient(
  data: IngredientFormData
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('ingredients').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function createIngredientInline(
  data: IngredientFormData
): Promise<{ ingredient?: import('@/lib/types').Ingredient; error?: string }> {
  const supabase = createAdminClient()
  const { data: created, error } = await supabase
    .from('ingredients')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return { ingredient: created as import('@/lib/types').Ingredient }
}

export async function updateIngredient(
  id: string,
  data: IngredientFormData
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('ingredients').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function deleteIngredient(
  id: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Guard: check if used in any recipe
  const { data: recipes, error: checkError } = await supabase
    .from('recipes')
    .select('id, name, ingredients')

  if (checkError) return { error: checkError.message }

  const usedIn = (recipes ?? []).filter((r) =>
    // ingredients is a JSONB array of RecipeIngredient
    (r.ingredients as Array<{ ingredient_id: string }>).some(
      (ri) => ri.ingredient_id === id
    )
  )

  if (usedIn.length > 0) {
    const names = usedIn.map((r) => r.name).join(', ')
    return { error: `No se puede borrar: usado en receta(s): ${names}` }
  }

  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}
