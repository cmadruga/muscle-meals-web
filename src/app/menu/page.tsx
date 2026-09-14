import { redirect } from 'next/navigation'
import { getActiveMealsWithRecipes } from '@/lib/db/meals'
import { getAllIngredients } from '@/lib/db/ingredients'
import { getMainSizes, getCustomerSizes } from '@/lib/db/sizes'
import { getCustomerByUserId } from '@/lib/db/customers'
import { getSalesEnabled, getCriticalPeriodConfig } from '@/lib/db/settings'
import { getExtraStockForWeek } from '@/lib/db/extra-stock'
import { isInCutoffWindow, getCurrentWeekMonday, getUpcomingSunday, formatDeliveryDate } from '@/lib/utils/delivery'
import { calculateMealMacros } from '@/lib/utils/macros'
import { createClient } from '@/lib/supabase/server'
import type { Size, Ingredient, Macros } from '@/lib/types'
import MenuClient from './MenuClient'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export type MealMenuData = {
  id: string
  name: string
  description: string | null
  img: string | null
  /** macros[sizeId] = Macros calculados para ese size */
  macros: Record<string, Macros>
  /** ingredientes agrupados: main recipe (name=null) + sub-recetas (name=string) */
  ingredientGroups: { name: string | null; ingredients: string[] }[]
  /** categoría inferida del tipo de proteína principal */
  category: 'pollo' | 'res' | 'pescado' | 'otro'
}

export type MenuPageProps = {
  meals: MealMenuData[]
  sizes: Size[]
  soldOut: string[]            // mealIds agotados (array para serialización)
  stockLimits: Record<string, number> // mealId → qty disponible (solo en período crítico)
  salesEnabled: boolean
  isAuthenticated: boolean
  deliveryDate: string
  fitSize: Size | null          // referencia para tamaño personalizado
  proIngredients: Ingredient[]
  carbIngredients: Ingredient[]
  vegIngredients: Ingredient[]
  customerSizes: Size[]         // tamaños personalizados guardados del cliente
  // Todos los ids de cada tipo agrupados por public_name — para guardar variantes
  // no activas al crear/editar un tamaño personalizado (ej. Pasta Linguini inactiva)
  proIdsByName: Record<string, string[]>
  carbIdsByName: Record<string, string[]>
}

export default async function MenuPage() {
  const [mealsWithRecipes, sizes, salesEnabled, criticalConfig, supabase, allIngredients] = await Promise.all([
    getActiveMealsWithRecipes(),
    getMainSizes(),
    getSalesEnabled(),
    getCriticalPeriodConfig(),
    createClient(),
    getAllIngredients(),
  ])

  const inCriticalPeriod = isInCutoffWindow(criticalConfig)
  const weekMonday = getCurrentWeekMonday()
  const extraStock = inCriticalPeriod ? await getExtraStockForWeek(weekMonday) : []

  // Meals agotados y límites de stock durante período crítico
  const soldOutIds: string[] = []
  const stockLimits: Record<string, number> = {}
  if (inCriticalPeriod) {
    for (const meal of mealsWithRecipes) {
      const stockItem = extraStock.find(s => s.meal_id === meal.id)
      const qty = stockItem?.qty ?? 0
      stockLimits[meal.id] = qty
      if (qty <= 0) soldOutIds.push(meal.id)
    }
  }

  // Auth
  const { data: { user } } = await supabase.auth.getUser()

  // Cargar tamaños personalizados guardados del cliente (si está autenticado)
  let customerSizes: Size[] = []
  if (user) {
    try {
      const customer = await getCustomerByUserId(user.id)
      if (customer) {
        customerSizes = await getCustomerSizes(customer.id)
      }
    } catch {
      // No bloquear la página si falla; simplemente sin sizes personalizados
    }
  }

  // Build ingredient map for macro calculation
  const allIngredientIds = new Set<string>()
  for (const meal of mealsWithRecipes) {
    meal.ingredients.forEach(i => allIngredientIds.add(i.id))
  }
  const ingredientMap = new Map<string, Ingredient>(
    mealsWithRecipes.flatMap(m => m.ingredients).map(i => [i.id, i])
  )

  // Pro/carb/veg ingredients para el panel de tamaño personalizado:
  // Se pasan TODOS los ingredientes de cada tipo (sin deduplicar por public_name).
  // Ingredientes para el panel de tamaño personalizado:
  // - proIngredients/carbIngredients: todos los que aparecen en recetas activas (sin deduplicar)
  //   El cliente los agrupa por public_name para mostrar un slider por grupo.
  // - proIdsByName/carbIdsByName: TODOS los ids de la BD agrupados por nombre, incluyendo
  //   variantes inactivas. Al guardar un tamaño, se escribe el valor para todos los ids del
  //   grupo, incluso los de meals no activos (ej. Pasta Linguini si no hay meal activa con ella).
  const proIngredients: Ingredient[] = []
  const carbIngredients: Ingredient[] = []
  const vegIngredients: Ingredient[] = []
  const seenVeg = new Set<string>()
  for (const ing of ingredientMap.values()) {
    const label = ing.public_name ?? ing.name
    if (ing.type === 'pro') {
      proIngredients.push(ing)
    } else if (ing.type === 'carb') {
      carbIngredients.push(ing)
    } else if (ing.type === 'veg' && !seenVeg.has(label)) {
      seenVeg.add(label); vegIngredients.push(ing)
    }
  }

  // Mapa nombre → [todos los ids] desde la lista completa de ingredientes de la BD
  function buildIdsByName(type: string): Record<string, string[]> {
    const map: Record<string, string[]> = {}
    for (const ing of allIngredients) {
      if (ing.type !== type) continue
      const key = ing.public_name ?? ing.name
      ;(map[key] ??= []).push(ing.id)
    }
    return map
  }
  const proIdsByName = buildIdsByName('pro')
  const carbIdsByName = buildIdsByName('carb')

  /** Infers category from protein ingredient names */
  function inferCategory(proteinNames: string[]): MealMenuData['category'] {
    const joined = proteinNames.join(' ').toLowerCase()
    if (/pollo|pechuga|chicken/.test(joined)) return 'pollo'
    if (/res|carne|molida|beef|bistec/.test(joined)) return 'res'
    if (/salm[oó]n|at[uú]n|pescado|fish|tilapia|camar[oó]n|shrimp/.test(joined)) return 'pescado'
    return 'otro'
  }

  // Pre-compute macros for each meal × main sizes + customer sizes guardados
  const meals: MealMenuData[] = mealsWithRecipes.map(meal => {
    const macrosBySizeId: Record<string, Macros> = {}
    for (const size of [...sizes, ...customerSizes]) {
      macrosBySizeId[size.id] = calculateMealMacros(
        meal.mainRecipe,
        meal.subRecipes,
        ingredientMap,
        size
      )
    }

    // Ingredient groups for the dropdown — DB creation order (same as admin/recetario)
    // Fixed ingredients appear where they were placed in the recipe, not at the end
    const seen = new Set<string>()
    const proteinIngNames: string[] = []

    // Main recipe — keep original DB order
    const mainIngredients: string[] = []
    for (const ri of meal.mainRecipe.ingredients) {
      const ing = ingredientMap.get(ri.ingredient_id)
      if (!ing) continue
      const label = ing.public_name ?? ing.name
      if (!seen.has(label)) { seen.add(label); mainIngredients.push(label) }
      if (ing.type === 'pro') proteinIngNames.push(label)
    }

    const ingredientGroups: MealMenuData['ingredientGroups'] = []
    if (mainIngredients.length > 0) ingredientGroups.push({ name: null, ingredients: mainIngredients })

    // Sub-recipes — each as its own group with recipe name
    for (const sub of meal.subRecipes) {
      const subIngredients: string[] = []
      for (const ri of sub.ingredients) {
        const ing = ingredientMap.get(ri.ingredient_id)
        if (!ing) continue
        const label = ing.public_name ?? ing.name
        if (!seen.has(label)) { seen.add(label); subIngredients.push(label) }
        if (ing.type === 'pro') proteinIngNames.push(label)
      }
      if (subIngredients.length > 0) ingredientGroups.push({ name: sub.name, ingredients: subIngredients })
    }

    return {
      id: meal.id,
      name: meal.name,
      description: meal.description,
      img: meal.img,
      macros: macrosBySizeId,
      ingredientGroups,
      category: inferCategory(proteinIngNames),
    }
  })

  const fitSize = sizes.find(s => s.name.toLowerCase().includes('fit')) ?? sizes[0] ?? null
  const deliveryDate = formatDeliveryDate(getUpcomingSunday())

  return (
    <Suspense fallback={null}>
      <MenuClient
        meals={meals}
        sizes={sizes}
        soldOut={soldOutIds}
        stockLimits={stockLimits}
        salesEnabled={salesEnabled}
        isAuthenticated={!!user}
        deliveryDate={deliveryDate}
        fitSize={fitSize}
        proIngredients={proIngredients}
        carbIngredients={carbIngredients}
        vegIngredients={vegIngredients}
        customerSizes={customerSizes}
        proIdsByName={proIdsByName}
        carbIdsByName={carbIdsByName}
      />
    </Suspense>
  )
}
