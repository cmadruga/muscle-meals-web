import { createAdminClient } from '@/lib/supabase/admin'

export type ExtraStockItem = {
  meal_id: string
  meal_name: string
  qty: number
  item_ids: string[]
}

/**
 * Devuelve el stock extra disponible para la semana.
 * Agrupa por meal_id únicamente — los extras no tienen tamaño.
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
      qty,
      meals ( name ),
      orders!inner ( status, created_at )
    `)
    .eq('orders.status', 'extra')
    .gte('orders.created_at', start.toISOString())
    .lt('orders.created_at', end.toISOString())

  if (error || !data) return []

  const map = new Map<string, ExtraStockItem>()
  for (const row of (data as unknown) as Array<{
    id: string
    meal_id: string
    qty: number
    meals: { name: string } | null
  }>) {
    const existing = map.get(row.meal_id)
    if (existing) {
      existing.qty += row.qty
      existing.item_ids.push(row.id)
    } else {
      map.set(row.meal_id, {
        meal_id: row.meal_id,
        meal_name: row.meals?.name ?? row.meal_id,
        qty: row.qty,
        item_ids: [row.id],
      })
    }
  }

  return [...map.values()]
}

/**
 * Deduce del stock extra por meal_id (sin importar tamaño). FIFO.
 */
export async function deductExtraStock(
  items: { meal_id: string; qty: number }[],
  weekMonday: Date
): Promise<{ error?: string }> {
  const stock = await getExtraStockForWeek(weekMonday)
  const supabase = createAdminClient()

  for (const needed of items) {
    const available = stock.find(s => s.meal_id === needed.meal_id)
    if (!available || available.qty < needed.qty) {
      return { error: `Stock insuficiente para ${available?.meal_name ?? needed.meal_id} (disponible: ${available?.qty ?? 0})` }
    }
  }

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
 * Deduce stock extra al pagar una orden. No-op si no hay periodo crítico activo.
 */
export async function deductExtraStockForOrder(orderId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('created_at, order_items(meal_id, qty)')
    .eq('id', orderId)
    .single()

  if (!order || !order.order_items?.length) return

  const createdAt = new Date(order.created_at)
  const day = createdAt.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const weekMonday = new Date(createdAt)
  weekMonday.setDate(createdAt.getDate() - daysFromMonday)
  weekMonday.setHours(0, 0, 0, 0)

  const items = (order.order_items as Array<{ meal_id: string; qty: number }>)
    .map(i => ({ meal_id: i.meal_id, qty: i.qty }))

  const result = await deductExtraStock(items, weekMonday)
  if (result.error) {
    console.error('Error deduciendo stock extra al pagar:', result.error)
  }
}
