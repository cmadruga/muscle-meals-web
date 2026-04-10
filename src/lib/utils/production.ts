import type { WeeklyProductionData } from '@/lib/db/production'
import type { RecipeVesselConfig } from '@/lib/types/recipe'
import { calculateMealMacros, resolveQty } from './macros'

export type MealIngredientRow = {
  key: string
  ingredientId: string
  name: string
  unit: string
  totalQty: number
  isSubRecipe: boolean
  section?: 'pro' | 'carb' | 'veg'
  ingredientType: string | null
  proveedor: string | null
}

export type MealTotal = {
  mealId: string
  mealName: string
  totalPortions: number
  portionsBySize: Record<string, number>  // sizeName → qty
  ingredients: MealIngredientRow[]
  vesselConfig?: RecipeVesselConfig | null
}

export type ShoppingItem = {
  ingredientId: string
  name: string
  unit: string
  totalQty: number
  proveedor: string | null
}

export type PincheSizeRow = {
  sizeId: string
  sizeName: string
  qty: number
  isMain: boolean
  proteinQty: number
  carbQty: number
  vegQty: number
}

export type PincheMeal = {
  mealId: string
  mealName: string
  totalPortions: number
  sizes: PincheSizeRow[]
}

export type EmpaqueSizeRow = {
  sizeId: string
  sizeName: string
  qty: number
  isMain: boolean
  macros: { calories: number; protein: number; carbs: number; fats: number }
}

export type EmpaquesMeal = {
  mealId: string
  mealName: string
  totalPortions: number
  sizes: EmpaqueSizeRow[]
}

export type MatrixCell = { qty: number; sizeName: string }

export type MatrixRow = {
  orderId: string
  orderNumber: string
  customerName: string
  orderStatus: string
  cells: Record<string, MatrixCell[]>
  totalPortions: number
}

export function computeMealTotals(data: WeeklyProductionData): MealTotal[] {
  const { items, mealsMap, ingredientsMap, sizesMap } = data

  // mealId → key → { qty, name, unit, isSubRecipe, ingredientId, section, ingredientType, proveedor }
  const mealAggregates = new Map<
    string,
    Map<string, { qty: number; name: string; unit: string; isSubRecipe: boolean; ingredientId: string; section?: 'pro' | 'carb' | 'veg'; ingredientType: string | null; proveedor: string | null }>
  >()

  const mealPortions = new Map<string, number>()
  const mealPortionsBySize = new Map<string, Record<string, number>>()
  const mealNames = new Map<string, string>()

  for (const item of items) {
    const meal = mealsMap.get(item.mealId)
    if (!meal) continue
    const size = sizesMap.get(item.sizeId)
    if (!size) continue

    // Track portions
    mealPortions.set(item.mealId, (mealPortions.get(item.mealId) ?? 0) + item.qty)
    mealNames.set(item.mealId, item.mealName)
    if (!mealPortionsBySize.has(item.mealId)) mealPortionsBySize.set(item.mealId, {})
    const bySize = mealPortionsBySize.get(item.mealId)!
    bySize[item.sizeName] = (bySize[item.sizeName] ?? 0) + item.qty

    if (!mealAggregates.has(item.mealId)) {
      mealAggregates.set(item.mealId, new Map())
    }
    const ingMap = mealAggregates.get(item.mealId)!

    // Main recipe ingredients
    for (const recipeIng of meal.mainRecipe.ingredients) {
      const ingredient = ingredientsMap.get(recipeIng.ingredient_id)
      if (!ingredient) continue

      let qtyPerPortion: number
      if (ingredient.type === 'pro') {
        qtyPerPortion = resolveQty(size.protein_qty, recipeIng.ingredient_id)
      } else if (ingredient.type === 'carb') {
        qtyPerPortion = resolveQty(size.carb_qty, recipeIng.ingredient_id)
      } else if (ingredient.type === 'veg') {
        qtyPerPortion = size.veg_qty
      } else {
        qtyPerPortion = recipeIng.qty
      }

      const key = `main_${recipeIng.section ?? ''}_${recipeIng.ingredient_id}_${recipeIng.unit}`
      const existing = ingMap.get(key)
      if (existing) {
        existing.qty += qtyPerPortion * item.qty
      } else {
        ingMap.set(key, {
          qty: qtyPerPortion * item.qty,
          name: ingredient.name,
          unit: recipeIng.unit,
          isSubRecipe: false,
          ingredientId: recipeIng.ingredient_id,
          section: recipeIng.section,
          ingredientType: ingredient.type ?? null,
          proveedor: ingredient.proveedor ?? null,
        })
      }
    }

    // Sub-recipe ingredients (dividir entre porciones de la sub-receta)
    for (const subRecipe of meal.subRecipes) {
      const subPortions = subRecipe.portions > 0 ? subRecipe.portions : 1
      for (const recipeIng of subRecipe.ingredients) {
        const ingredient = ingredientsMap.get(recipeIng.ingredient_id)
        if (!ingredient) continue

        const qtyPerPortion = recipeIng.qty / subPortions
        const key = `sub_${recipeIng.ingredient_id}_${recipeIng.unit}`
        const existing = ingMap.get(key)
        if (existing) {
          existing.qty += qtyPerPortion * item.qty
        } else {
          ingMap.set(key, {
            qty: qtyPerPortion * item.qty,
            name: ingredient.name,
            unit: recipeIng.unit,
            isSubRecipe: true,
            ingredientId: recipeIng.ingredient_id,
            ingredientType: ingredient.type ?? null,
            proveedor: ingredient.proveedor ?? null,
          })
        }
      }
    }
  }

  // Build MealTotal[]
  const result: MealTotal[] = []

  for (const [mealId, ingMap] of mealAggregates) {
    const mainRows: MealIngredientRow[] = []
    const subRows: MealIngredientRow[] = []

    for (const [key, val] of ingMap) {
      const row: MealIngredientRow = {
        key,
        ingredientId: val.ingredientId,
        name: val.name,
        unit: val.unit,
        totalQty: Math.round(val.qty * 10) / 10,
        isSubRecipe: val.isSubRecipe,
        section: val.section,
        ingredientType: val.ingredientType,
        proveedor: val.proveedor,
      }
      if (val.isSubRecipe) {
        subRows.push(row)
      } else {
        mainRows.push(row)
      }
    }

    // Ordenar main por sección (pro→carb→veg→sin sección), respetando orden de inserción dentro de cada sección
    const sectionOrder: Record<string, number> = { pro: 0, carb: 1, veg: 2 }
    mainRows.sort((a, b) => {
      const sa = sectionOrder[a.section ?? ''] ?? 3
      const sb = sectionOrder[b.section ?? ''] ?? 3
      return sa - sb
    })
    // Sub-recetas: sin sort, preservar orden del JSONB

    result.push({
      mealId,
      mealName: mealNames.get(mealId) ?? mealId,
      totalPortions: mealPortions.get(mealId) ?? 0,
      portionsBySize: mealPortionsBySize.get(mealId) ?? {},
      ingredients: [...mainRows, ...subRows],
      vesselConfig: mealsMap.get(mealId)?.mainRecipe.vessel_config,
    })
  }

  result.sort((a, b) => a.mealName.localeCompare(b.mealName))
  return result
}

export function computeShoppingList(mealTotals: MealTotal[]): ShoppingItem[] {
  const aggregate = new Map<string, { ingredientId: string; name: string; unit: string; totalQty: number; proveedor: string | null }>()

  for (const meal of mealTotals) {
    for (const ing of meal.ingredients) {
      const key = `${ing.ingredientId}_${ing.unit}`
      const existing = aggregate.get(key)
      if (existing) {
        existing.totalQty += ing.totalQty
      } else {
        aggregate.set(key, {
          ingredientId: ing.ingredientId,
          name: ing.name,
          unit: ing.unit,
          totalQty: ing.totalQty,
          proveedor: ing.proveedor,
        })
      }
    }
  }

  const result: ShoppingItem[] = []
  for (const val of aggregate.values()) {
    result.push({
      ingredientId: val.ingredientId,
      name: val.name,
      unit: val.unit,
      totalQty: Math.round(val.totalQty * 10) / 10,
      proveedor: val.proveedor,
    })
  }

  result.sort((a, b) => a.name.localeCompare(b.name))
  return result
}

export function buildMatrix(
  data: WeeklyProductionData
): { rows: MatrixRow[]; mealColumns: { id: string; name: string }[] } {
  const { items } = data

  // Unique meals sorted alphabetically
  const mealMap = new Map<string, string>()
  for (const item of items) {
    mealMap.set(item.mealId, item.mealName)
  }
  const mealColumns = [...mealMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Group by orderId — each order is its own row
  const orderMap = new Map<
    string,
    { orderNumber: string; customerName: string; orderStatus: string; cells: Map<string, Map<string, number>>; totalPortions: number }
  >()

  for (const item of items) {
    if (!orderMap.has(item.orderId)) {
      orderMap.set(item.orderId, {
        orderNumber: item.orderNumber,
        customerName: item.customerName ?? (item.orderStatus === 'extra' ? 'Extra' : 'Desconocido'),
        orderStatus: item.orderStatus,
        cells: new Map(),
        totalPortions: 0,
      })
    }
    const order = orderMap.get(item.orderId)!
    order.totalPortions += item.qty

    if (!order.cells.has(item.mealId)) {
      order.cells.set(item.mealId, new Map())
    }
    const mealCell = order.cells.get(item.mealId)!
    mealCell.set(item.sizeName, (mealCell.get(item.sizeName) ?? 0) + item.qty)
  }

  const rows: MatrixRow[] = []
  for (const [orderId, data] of orderMap) {
    const cells: Record<string, MatrixCell[]> = {}
    for (const [mealId, sizeMap] of data.cells) {
      cells[mealId] = [...sizeMap.entries()].map(([sizeName, qty]) => ({ qty, sizeName }))
    }
    rows.push({ orderId, orderNumber: data.orderNumber, customerName: data.customerName, orderStatus: data.orderStatus, cells, totalPortions: data.totalPortions })
  }

  rows.sort((a, b) => a.customerName.localeCompare(b.customerName) || a.orderNumber.localeCompare(b.orderNumber))

  return { rows, mealColumns }
}

const MAIN_SIZE_ORDER = ['LOW', 'FIT', 'PLUS']

export function computeEmpaquesData(data: WeeklyProductionData): EmpaquesMeal[] {
  const { items, mealsMap, ingredientsMap, sizesMap } = data

  // Accumulate qty per meal × size
  const mealSizeQty = new Map<string, Map<string, number>>()
  const mealNames = new Map<string, string>()

  for (const item of items) {
    mealNames.set(item.mealId, item.mealName)
    if (!mealSizeQty.has(item.mealId)) mealSizeQty.set(item.mealId, new Map())
    const sizeMap = mealSizeQty.get(item.mealId)!
    sizeMap.set(item.sizeId, (sizeMap.get(item.sizeId) ?? 0) + item.qty)
  }

  const result: EmpaquesMeal[] = []

  for (const [mealId, sizeMap] of mealSizeQty) {
    const meal = mealsMap.get(mealId)
    if (!meal) continue

    const sizeRows: EmpaqueSizeRow[] = []
    let totalPortions = 0

    for (const [sizeId, qty] of sizeMap) {
      const size = sizesMap.get(sizeId)
      if (!size) continue

      totalPortions += qty
      const macros = calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, size)

      sizeRows.push({ sizeId, sizeName: size.name, qty, isMain: size.is_main, macros })
    }

    // Main sizes ordered LOW→FIT→PLUS, then custom alphabetically
    sizeRows.sort((a, b) => {
      if (a.isMain && b.isMain) {
        const ai = MAIN_SIZE_ORDER.indexOf(a.sizeName.toUpperCase())
        const bi = MAIN_SIZE_ORDER.indexOf(b.sizeName.toUpperCase())
        return (ai >= 0 ? ai : 999) - (bi >= 0 ? bi : 999)
      }
      if (a.isMain) return -1
      if (b.isMain) return 1
      return a.sizeName.localeCompare(b.sizeName)
    })

    result.push({ mealId, mealName: mealNames.get(mealId) ?? mealId, totalPortions, sizes: sizeRows })
  }

  result.sort((a, b) => a.mealName.localeCompare(b.mealName))
  return result
}

export function computePincheData(data: WeeklyProductionData): PincheMeal[] {
  const { items, sizesMap, mealsMap, ingredientsMap } = data

  const mealSizeQty = new Map<string, Map<string, number>>()
  const mealNames = new Map<string, string>()

  for (const item of items) {
    mealNames.set(item.mealId, item.mealName)
    if (!mealSizeQty.has(item.mealId)) mealSizeQty.set(item.mealId, new Map())
    const sizeMap = mealSizeQty.get(item.mealId)!
    sizeMap.set(item.sizeId, (sizeMap.get(item.sizeId) ?? 0) + item.qty)
  }

  const result: PincheMeal[] = []

  for (const [mealId, sizeMap] of mealSizeQty) {
    const meal = mealsMap.get(mealId)
    const sizeRows: PincheSizeRow[] = []
    let totalPortions = 0

    // Find the pro and carb ingredient IDs for this meal (first match)
    let proIngId: string | null = null
    let carbIngId: string | null = null
    if (meal) {
      for (const ri of meal.mainRecipe.ingredients) {
        const ing = ingredientsMap.get(ri.ingredient_id)
        if (!ing) continue
        if (ing.type === 'pro' && !proIngId) proIngId = ri.ingredient_id
        if (ing.type === 'carb' && !carbIngId) carbIngId = ri.ingredient_id
      }
    }

    for (const [sizeId, qty] of sizeMap) {
      const size = sizesMap.get(sizeId)
      if (!size) continue
      totalPortions += qty
      sizeRows.push({
        sizeId,
        sizeName: size.name,
        qty,
        isMain: size.is_main,
        proteinQty: proIngId ? resolveQty(size.protein_qty, proIngId) : (size.protein_qty['default'] ?? 0),
        carbQty: carbIngId ? resolveQty(size.carb_qty, carbIngId) : (size.carb_qty['default'] ?? 0),
        vegQty: size.veg_qty,
      })
    }

    sizeRows.sort((a, b) => {
      if (a.isMain && b.isMain) {
        const ai = MAIN_SIZE_ORDER.indexOf(a.sizeName.toUpperCase())
        const bi = MAIN_SIZE_ORDER.indexOf(b.sizeName.toUpperCase())
        return (ai >= 0 ? ai : 999) - (bi >= 0 ? bi : 999)
      }
      if (a.isMain) return -1
      if (b.isMain) return 1
      return a.sizeName.localeCompare(b.sizeName)
    })

    result.push({ mealId, mealName: mealNames.get(mealId) ?? mealId, totalPortions, sizes: sizeRows })
  }

  result.sort((a, b) => a.mealName.localeCompare(b.mealName))
  return result
}
