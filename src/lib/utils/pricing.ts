/**
 * Pricing for custom sizes (centavos MXN)
 *
 * Anchored to the LOW size price from the DB.
 * Each protein/carb tier adds PROTEIN_STEP / CARB_STEP ($5).
 * The crossing of each default size equals that size's price exactly.
 *
 * LOW  → protein 160g, carbs 45g, veg 70g  → lowPrice + 0 + 0 + 0
 * FIT  → protein 180g, carbs 55g, veg 70g  → lowPrice + 500 + 500 + 0 = lowPrice + $10
 * PLUS → protein 220g, carbs 70g, veg 70g  → lowPrice + 1000 + 1000 + 0 = lowPrice + $20
 *
 * Maximums: protein 300g, carbs 100g, veg 150g.
 */

export const CARB_BASE    = { LOW: 45,  FIT: 55,  PLUS: 70  } as const
export const PROTEIN_BASE = { LOW: 160, FIT: 180, PLUS: 220 } as const

export const PROTEIN_STEP = 500 // centavos ($5)
export const CARB_STEP    = 500 // centavos ($5)

// Fixed gram breakpoints — only prices change, never these
const PROTEIN_TIERS = [160, 180, 220, 250, 300] as const
const CARB_TIERS    = [45,  55,  70,  100     ] as const

// Protein/carb: index = number of $5 steps to add
function tierIndex(tiers: readonly number[], qty: number): number {
  const clamped = Math.min(qty, tiers[tiers.length - 1])
  const idx = tiers.findIndex(max => clamped <= max)
  return idx === -1 ? tiers.length - 1 : idx
}

// Veg delta in centavos (all default sizes use 70g → $0)
// 0–29g: −$5 | 30–80g: $0 | 81–119g: +$5 | 120–150g: +$10 | max 150g
export function vegDelta(vegQty: number): number {
  const qty = Math.min(vegQty, 150)
  if (qty <= 29)  return -500
  if (qty <= 80)  return 0
  if (qty <= 119) return 500
  return 1000
}

/**
 * @param proteinQty  grams of protein (normalized to FIT scale)
 * @param carbQty     grams of carbs (normalized to FIT scale)
 * @param vegQty      grams of vegetables (raw, max 150)
 * @param lowPrice    price of LOW size in centavos (from DB); default $145
 */
export function calculateCustomSizePrice(
  proteinQty: number,
  carbQty: number,
  vegQty: number,
  lowPrice = 14500,
): { price: number; packagePrice: number } {
  const price =
    lowPrice +
    tierIndex(PROTEIN_TIERS, proteinQty) * PROTEIN_STEP +
    tierIndex(CARB_TIERS, carbQty) * CARB_STEP +
    vegDelta(vegQty)
  return { price, packagePrice: price - 500 }
}
