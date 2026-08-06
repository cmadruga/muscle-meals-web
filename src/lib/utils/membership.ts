export type MembershipItem = { size_id: string; qty: number }

type MembershipShape = {
  membership_qty: number | null
  membership_items: MembershipItem[] | null
}

/**
 * Verifica si el carrito coincide exactamente con la composición de la membresía.
 * membership_items es la única fuente de verdad (legacy migrado por migration SQL).
 */
export function checkMembershipMatch(
  cartItems: { sizeId: string; qty: number }[],
  membership: MembershipShape
): boolean {
  if (!membership.membership_qty) return false
  if (!membership.membership_items || membership.membership_items.length === 0) return false

  const totalQty = cartItems.reduce((n, i) => n + i.qty, 0)
  if (totalQty !== membership.membership_qty) return false

  const cartMap = new Map<string, number>()
  for (const item of cartItems) {
    cartMap.set(item.sizeId, (cartMap.get(item.sizeId) ?? 0) + item.qty)
  }
  if (cartMap.size !== membership.membership_items.length) return false
  return membership.membership_items.every(mi => cartMap.get(mi.size_id) === mi.qty)
}

/**
 * Construye membership_items a partir de los items de un pedido.
 * Agrupa por size_id sumando qty.
 */
export function buildMembershipItems(
  orderItems: { size_id: string; qty: number }[]
): MembershipItem[] {
  const map = new Map<string, number>()
  for (const item of orderItems) {
    map.set(item.size_id, (map.get(item.size_id) ?? 0) + item.qty)
  }
  return Array.from(map.entries()).map(([size_id, qty]) => ({ size_id, qty }))
}
