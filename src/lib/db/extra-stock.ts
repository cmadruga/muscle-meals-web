import { createAdminClient } from '@/lib/supabase/admin'

export type ExtraStockItem = {
  meal_id: string
  meal_name: string
  size_id: string
  size_name: string
  qty: number          // cantidad restante en order_items del extra
  item_ids: string[]   // IDs de order_item para deducir
}

/**
 * Devuelve el stock extra disponible para la semana cuyo lunes es weekMonday.
 * Agrupa por meal_id + size_id sumando los qty restantes.
 */
export async function getExtraStockForWeek(weekMonday: Date): Promise<ExtraStockItem[]> {
  const start = new Date(weekMonday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  const { data, error } = await createAdminClient()
    .from('order_items')
    .select(`
      id,
      meal_id,
      size_id,
      qty,
      meals ( name ),
      sizes ( name ),
      orders!inner ( status, created_at )
    `)
    .eq('orders.status', 'extra')
    .gte('orders.created_at', start.toISOString())
    .lt('orders.created_at', end.toISOString())

  if (error || !data) return []

  // Agrupar por meal_id + size_id
  const map = new Map<string, ExtraStockItem>()
  for (const row of (data as unknown) as Array<{
    id: string
    meal_id: string
    size_id: string
    qty: number
    meals: { name: string } | null
    sizes: { name: string } | null
  }>) {
    const key = `${row.meal_id}|${row.size_id}`
    const existing = map.get(key)
    if (existing) {
      existing.qty += row.qty
      existing.item_ids.push(row.id)
    } else {
      map.set(key, {
        meal_id: row.meal_id,
        meal_name: row.meals?.name ?? row.meal_id,
        size_id: row.size_id,
        size_name: row.sizes?.name ?? row.size_id,
        qty: row.qty,
        item_ids: [row.id],
      })
    }
  }

  return [...map.values()]
}

/**
 * Deduce del stock extra. Toma de los order_items en orden FIFO.
 * Devuelve error si no hay suficiente stock.
 */
export async function deductExtraStock(
  items: { meal_id: string; size_id: string; qty: number }[],
  weekMonday: Date
): Promise<{ error?: string }> {
  const stock = await getExtraStockForWeek(weekMonday)
  const supabase = createAdminClient()

  for (const needed of items) {
    const available = stock.find(s => s.meal_id === needed.meal_id && s.size_id === needed.size_id)
    if (!available || available.qty < needed.qty) {
      return { error: `Stock insuficiente para ${available?.meal_name ?? needed.meal_id} (disponible: ${available?.qty ?? 0})` }
    }
  }

  // Deducir — re-fetch item_ids frescos para garantizar consistencia
  const start = new Date(weekMonday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  for (const needed of items) {
    let remaining = needed.qty

    const { data: rows } = await supabase
      .from('order_items')
      .select('id, qty, orders!inner(status, created_at)')
      .eq('meal_id', needed.meal_id)
      .eq('size_id', needed.size_id)
      .eq('orders.status', 'extra')
      .gte('orders.created_at', start.toISOString())
      .lt('orders.created_at', end.toISOString())
      .order('id', { ascending: true })

    if (!rows) return { error: 'Error leyendo stock' }

    for (const row of rows as Array<{ id: string; qty: number }>) {
      if (remaining <= 0) break
      const take = Math.min(row.qty, remaining)
      remaining -= take
      const newQty = row.qty - take
      if (newQty <= 0) {
        await supabase.from('order_items').delete().eq('id', row.id)
      } else {
        await supabase.from('order_items').update({ qty: newQty }).eq('id', row.id)
      }
    }

    if (remaining > 0) return { error: 'Stock insuficiente al momento de procesar' }
  }

  // Marcar como cancelled las órdenes extra que quedaron sin items
  const { data: extraOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'extra')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  if (extraOrders) {
    for (const order of extraOrders) {
      const { data: remaining } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', order.id)
        .limit(1)
      if (!remaining || remaining.length === 0) {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      }
    }
  }

  return {}
}

/**
 * Deduce stock extra al pagar una orden.
 * Calcula la semana desde created_at de la orden; no-op si no hay extras para esa semana.
 */
export async function deductExtraStockForOrder(orderId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('created_at, order_items(meal_id, size_id, qty)')
    .eq('id', orderId)
    .single()

  if (!order || !order.order_items?.length) return

  const createdAt = new Date(order.created_at)
  const day = createdAt.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const weekMonday = new Date(createdAt)
  weekMonday.setDate(createdAt.getDate() - daysFromMonday)
  weekMonday.setHours(0, 0, 0, 0)

  const items = (order.order_items as Array<{ meal_id: string; size_id: string; qty: number }>)
    .map(i => ({ meal_id: i.meal_id, size_id: i.size_id, qty: i.qty }))

  const result = await deductExtraStock(items, weekMonday)
  if (result.error) {
    console.error('Error deduciendo stock extra al pagar:', result.error)
  }
}
