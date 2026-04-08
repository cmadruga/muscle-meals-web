/**
 * Pricing for custom sizes (cents MXN)
 *
 * Base price comes from protein tier.
 * Carbs and veggies add/subtract a delta from the base.
 * package_price = price - 500
 */

/* 
❯ no entendi bien el problema que me mencionas de el precio, algo que si vi yo, es que dentro de
un paquete puede haber varios precios dependiendo la receta por los ingredientes que tenga, te doy
 un ejemplo en la foto, una cliente real tiene esos porciones, dentro de un paquete ella va a
agregar esas porciones se le muestra un precio, pero en realidad el precio varia dependiendo el
plato, si uno tiene carne su porcion es menor que pollo y eso hace que el precio cambie, como
manejamos eso, que ahora el precio dentro del paquete depende de lo que tiene seleccionado con las
 porciones seleccionadas. esto solo estaria pasando con uno personalizado que varie mucho como
este, si se crean paquetes con tamaños main, los precios si son iguales, pero tambien puede pasar
si alguien dentro de un paquete quiere pedir combinacion de tamaños, algo que no estamos
permitiendo y si deberiamos de poder hacer es que el cliente pueda crear un paquete de minimo 5
platos, es la unico condicion para entrar a precio de paquete, pero puede combinar tamaños, 2 plus
 y 3 fit, respeta el precio de cada tamaño pero al ser 5 ya toma el descuento. creo que son varias
 cosas dentro de todo esto, pero si quieres nos vamos por partes, analisa todo lo que te dijo,
resolvemos dudas y vemos como vamos avanzando con todo esto
*/

// Cantidades base (×1) por size main para ingredientes estándar.
// Arroz/pasta son ×1 en carbo. Pollo/res son ×1 en proteína.
// Ingredientes con cantidades distintas tienen un ratio: ratio = qty_size / BASE[size].
// El ratio debe ser igual en los 3 sizes (LOW/FIT/PLUS) para mantener consistencia.
// Para pricing de custom sizes: normalizedQty = custom_qty / ratio = custom_qty * BASE.FIT / qty_FIT
export const CARB_BASE    = { LOW: 45, FIT: 55,  PLUS: 70  } as const
export const PROTEIN_BASE = { LOW: 160, FIT: 180, PLUS: 220 } as const

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
