/**
 * Pricing for custom sizes (cents MXN)
 *
 * Base price comes from protein tier.
 * Carbs and veggies add/subtract a delta from the base.
 * package_price = price - 500
 */

// Precio base según proteína
const PROTEIN_TIERS = [
  { max: 160, price: 14500 },
  { max: 180, price: 15500 },
  { max: 220, price: 17000 },
  { max: 250, price: 18500 },
] as const

// Delta de carbos sobre el precio base
const CARB_DELTAS = [
  { max: 49,  delta:     0 }, // 0-49:   -$5  → -500
  { max: 60,  delta:   500 }, // 50-60:    $0
  { max: 79,  delta:  1000 }, // 61-79:   +$5
  { max: 100, delta:  1500 }, // 80-100: +$10
] as const

// Delta de verduras sobre el precio base
const VEG_DELTAS = [
  { max: 59,  delta:     0 }, // 0-59:   -$5  → -500
  { max: 80,  delta:   500 }, // 60-80:    $0
  { max: 119, delta:  1000 }, // 81-119: +$5
  { max: 150, delta:  1500 }, // 120-150: +$10
] as const

// Precio base mínimo al que se aplican los deltas (el -$5 de carb/veg)
const BASE_OFFSET = 500 // los deltas están shifted +500 para no usar negativos

function proteinBasePrice(proteinQty: number): number {
  for (const tier of PROTEIN_TIERS) {
    if (proteinQty <= tier.max) return tier.price
  }
  return PROTEIN_TIERS[PROTEIN_TIERS.length - 1].price
}

function carbDelta(carbQty: number): number {
  for (const tier of CARB_DELTAS) {
    if (carbQty <= tier.max) return tier.delta - BASE_OFFSET
  }
  return CARB_DELTAS[CARB_DELTAS.length - 1].delta - BASE_OFFSET
}

function vegDelta(vegQty: number): number {
  for (const tier of VEG_DELTAS) {
    if (vegQty <= tier.max) return tier.delta - BASE_OFFSET
  }
  return VEG_DELTAS[VEG_DELTAS.length - 1].delta - BASE_OFFSET
}

export function calculateCustomSizePrice(
  proteinQty: number,
  carbQty: number,
  vegQty: number,
): { price: number; packagePrice: number } {
  const price = proteinBasePrice(proteinQty) + carbDelta(carbQty) + vegDelta(vegQty)
  return { price, packagePrice: price - 500 }
}
