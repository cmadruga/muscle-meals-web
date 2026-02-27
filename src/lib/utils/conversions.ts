/**
 * Factores de conversión crudo → cocido (aproximados)
 * TODO: reemplazar con valores reales cuando el usuario los confirme
 *
 * Lógica aproximada:
 *  - Proteína (pollo/res/pescado): pierde ~25% de agua al cocinar
 *  - Carbos (arroz/pasta/avena): absorbe agua, aumenta ~2.5x
 *  - Verduras: pierde ~15% de agua al cocinar
 */
export const COOKED_FACTORS = {
  protein: 0.81,
  carbs: 2.2,
  veg: 1,
} as const

export type IngredientType = keyof typeof COOKED_FACTORS

export function toCocido(rawGrams: number, type: IngredientType): number {
  return Math.round(rawGrams * COOKED_FACTORS[type])
}

export function toCrudo(cookedGrams: number, type: IngredientType): number {
  return Math.round(cookedGrams / COOKED_FACTORS[type])
}
