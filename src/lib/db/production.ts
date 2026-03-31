import type { SupabaseClient } from '@supabase/supabase-js'
import type { Recipe, Ingredient, Size } from '@/lib/types'

export type ProductionItem = {
  orderId: string
  orderNumber: string
  customerName: string | null
  orderStatus: string
  mealId: string
  mealName: string
  sizeId: string
  sizeName: string
  qty: number
}

export type MealData = {
  id: string
  name: string
  mainRecipe: Recipe
  subRecipes: Recipe[]
}

export type WeeklyProductionData = {
  items: ProductionItem[]
  mealsMap: Map<string, MealData>
  ingredientsMap: Map<string, Ingredient>
  sizesMap: Map<string, Size>
}

export async function getWeeklyProductionData(
  client: SupabaseClient,
  weekStart: Date
): Promise<WeeklyProductionData> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Fetch orders with customers and order_items
  const { data: ordersData, error: ordersError } = await client
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      customers:customer_id (full_name),
      order_items (
        meal_id,
        size_id,
        qty,
        meals:meal_id (id, name),
        sizes:size_id (id, name)
      )
    `)
    .in('status', ['paid', 'admin', 'extra'])
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())

  if (ordersError) throw ordersError

  // Flatten to ProductionItem[]
  const items: ProductionItem[] = []
  for (const order of (ordersData ?? [])) {
    const customer = order.customers as unknown as { full_name: string | null } | null
    const orderItems = order.order_items as unknown as Array<{
      meal_id: string
      size_id: string
      qty: number
      meals: { id: string; name: string } | null
      sizes: { id: string; name: string } | null
    }>

    for (const item of (orderItems ?? [])) {
      if (!item.meals || !item.sizes) continue
      items.push({
        orderId: order.id,
        orderNumber: (order as unknown as { order_number: string; status: string }).order_number,
        customerName: customer?.full_name ?? null,
        orderStatus: (order as unknown as { order_number: string; status: string }).status,
        mealId: item.meals.id,
        mealName: item.meals.name,
        sizeId: item.sizes.id,
        sizeName: item.sizes.name,
        qty: item.qty,
      })
    }
  }

  if (items.length === 0) {
    return {
      items: [],
      mealsMap: new Map(),
      ingredientsMap: new Map(),
      sizesMap: new Map(),
    }
  }

  const uniqueMealIds = [...new Set(items.map(i => i.mealId))]
  const uniqueSizeIds = [...new Set(items.map(i => i.sizeId))]

  // Fetch meals
  const { data: mealsData, error: mealsError } = await client
    .from('meals')
    .select('id, name, main_recipe_id')
    .in('id', uniqueMealIds)

  if (mealsError) throw mealsError

  // Fetch meal_sub_recipes
  const { data: subRecipesData, error: subRecipesError } = await client
    .from('meal_sub_recipes')
    .select('meal_id, sub_recipe_id')
    .in('meal_id', uniqueMealIds)

  if (subRecipesError) throw subRecipesError

  // Collect all recipe IDs
  const mainRecipeIds = (mealsData ?? []).map((m: { id: string; name: string; main_recipe_id: string }) => m.main_recipe_id).filter(Boolean)
  const subRecipeIds = (subRecipesData ?? []).map((r: { meal_id: string; sub_recipe_id: string }) => r.sub_recipe_id).filter(Boolean)
  const allRecipeIds = [...new Set([...mainRecipeIds, ...subRecipeIds])]

  // Fetch recipes
  const { data: recipesData, error: recipesError } = await client
    .from('recipes')
    .select('*')
    .in('id', allRecipeIds)

  if (recipesError) throw recipesError

  // Collect ingredient IDs from all recipes
  const allIngredientIds = new Set<string>()
  for (const recipe of (recipesData ?? [])) {
    const ingredients = (recipe.ingredients ?? []) as Array<{ ingredient_id: string }>
    for (const ing of ingredients) {
      allIngredientIds.add(ing.ingredient_id)
    }
  }

  // Fetch ingredients
  const { data: ingredientsData, error: ingredientsError } = await client
    .from('ingredients')
    .select('*')
    .in('id', [...allIngredientIds])

  if (ingredientsError) throw ingredientsError

  // Fetch sizes
  const { data: sizesData, error: sizesError } = await client
    .from('sizes')
    .select('*')
    .in('id', uniqueSizeIds)

  if (sizesError) throw sizesError

  // Build recipesMap
  const recipesMap = new Map<string, Recipe>()
  for (const recipe of (recipesData ?? [])) {
    recipesMap.set(recipe.id, recipe as Recipe)
  }

  // Build sub-recipes lookup: mealId → subRecipeIds[]
  const mealSubRecipeIds = new Map<string, string[]>()
  for (const sr of (subRecipesData ?? [])) {
    const existing = mealSubRecipeIds.get(sr.meal_id) ?? []
    existing.push(sr.sub_recipe_id)
    mealSubRecipeIds.set(sr.meal_id, existing)
  }

  // Build mealsMap
  const mealsMap = new Map<string, MealData>()
  for (const meal of (mealsData ?? [])) {
    const m = meal as { id: string; name: string; main_recipe_id: string }
    const mainRecipe = recipesMap.get(m.main_recipe_id)
    if (!mainRecipe) continue
    const subIds = mealSubRecipeIds.get(m.id) ?? []
    const subRecipes = subIds.map(id => recipesMap.get(id)).filter((r): r is Recipe => r !== undefined)
    mealsMap.set(m.id, {
      id: m.id,
      name: m.name,
      mainRecipe,
      subRecipes,
    })
  }

  // Build ingredientsMap
  const ingredientsMap = new Map<string, Ingredient>()
  for (const ing of (ingredientsData ?? [])) {
    ingredientsMap.set(ing.id, ing as Ingredient)
  }

  // Build sizesMap
  const sizesMap = new Map<string, Size>()
  for (const size of (sizesData ?? [])) {
    sizesMap.set(size.id, size as Size)
  }

  return { items, mealsMap, ingredientsMap, sizesMap }
}
