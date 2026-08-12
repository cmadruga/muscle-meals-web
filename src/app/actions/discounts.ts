'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Discount, ValidatedDiscount, DiscountType, DiscountCondition } from '@/lib/types/discount'

export type DiscountFormData = {
  name: string
  code: string | null
  type: DiscountType
  value: number             // % for percent, centavos for fixed, 0 for free_shipping
  condition_type: DiscountCondition
  condition_value: number | null
  min_items: number | null
  min_amount: number | null // centavos
  valid_days: number[] | null
  active: boolean
  starts_at: string | null
  expires_at: string | null
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function getDiscounts(): Promise<Discount[]> {
  const supabase = createAdminClient()

  const [{ data: discounts }, { data: uses }] = await Promise.all([
    supabase.from('discounts').select('*').order('created_at', { ascending: false }),
    supabase.from('discount_uses').select('discount_id'),
  ])

  const countMap = new Map<string, number>()
  for (const u of uses ?? []) {
    countMap.set(u.discount_id, (countMap.get(u.discount_id) ?? 0) + 1)
  }

  return (discounts ?? []).map((d: any) => ({
    ...d,
    total_uses: countMap.get(d.id) ?? 0,
  }))
}

export async function createDiscount(form: DiscountFormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').insert({
    ...form,
    code: form.code ? form.code.toUpperCase().trim() : null,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function updateDiscount(id: string, form: DiscountFormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').update({
    ...form,
    code: form.code ? form.code.toUpperCase().trim() : null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function toggleDiscount(id: string, active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

export async function deleteDiscount(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/database')
  return {}
}

// ─── Checkout validation ──────────────────────────────────────────────────────

export type ValidateDiscountParams = {
  customerId: string | null
  code?: string
  subtotal: number      // centavos, before discount
  itemCount: number
  shippingCost: number  // centavos
}

export async function validateDiscount(
  params: ValidateDiscountParams
): Promise<{ discount: ValidatedDiscount | null; error?: string }> {
  const { customerId, code, subtotal, itemCount, shippingCost } = params
  const supabase = createAdminClient()

  let query = supabase.from('discounts').select('*').eq('active', true)

  if (code) {
    query = query.eq('code', code.toUpperCase().trim())
  } else {
    query = query.is('code', null)
  }

  const { data: discounts } = await query

  if (!discounts || discounts.length === 0) {
    if (code) return { discount: null, error: 'Código no encontrado' }
    return { discount: null }
  }

  const now = new Date()
  const todayDow = now.getDay()

  let paidOrders: { created_at: string }[] = []
  let paidOrderCount = 0
  if (customerId) {
    const { data } = await supabase
      .from('orders')
      .select('created_at')
      .eq('customer_id', customerId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
    paidOrders = data ?? []
    paidOrderCount = paidOrders.length
  }

  function getWeekStart(date: Date): number {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  for (const d of discounts) {
    // Not started yet
    if (d.starts_at && new Date(d.starts_at) > now) {
      if (code) return { discount: null, error: 'Este código aún no está activo' }
      continue
    }

    // Expiry
    if (d.expires_at && new Date(d.expires_at) < now) {
      if (code) return { discount: null, error: 'Código expirado' }
      continue
    }

    // Day of week
    if (Array.isArray(d.valid_days) && d.valid_days.length > 0 && !d.valid_days.includes(todayDow)) {
      if (code) return { discount: null, error: 'Este código no es válido hoy' }
      continue
    }

    // Min items
    if (d.min_items !== null && itemCount < d.min_items) {
      if (code) return { discount: null, error: `Requiere mínimo ${d.min_items} platillos` }
      continue
    }

    // Min amount
    if (d.min_amount !== null && subtotal < d.min_amount) {
      if (code) return { discount: null, error: `Requiere mínimo $${(d.min_amount / 100).toFixed(2)} MXN` }
      continue
    }

    // Condition type
    if (d.condition_type === 'first_order') {
      if (!customerId || paidOrderCount > 0) {
        if (code) return { discount: null, error: 'Solo válido en tu primer pedido' }
        continue
      }
    } else if (d.condition_type === 'streak') {
      const n = d.condition_value ?? 5
      if (!customerId || paidOrderCount === 0 || paidOrderCount % n !== 0) {
        continue
      }
    } else if (d.condition_type === 'cumulative_orders') {
      const n = d.condition_value ?? 3
      if (!customerId) continue
      // Consecutive weeks check — resets if any week is skipped
      const currentWeekStart = getWeekStart(now)
      const weekSet = new Set(paidOrders.map(o => getWeekStart(new Date(o.created_at))))
      let consecutive = 0
      for (let w = 1; w <= 52; w++) {
        if (weekSet.has(currentWeekStart - w * 7 * 24 * 60 * 60 * 1000)) consecutive++
        else break
      }
      if (consecutive < n) {
        if (code) return { discount: null, error: `Requiere ${n} semanas seguidas de pedidos` }
        continue
      }
    }

    // Compute amount
    let discountAmount = 0
    if (d.type === 'percent') {
      discountAmount = Math.round(subtotal * (d.value / 100))
    } else if (d.type === 'fixed') {
      discountAmount = Math.min(d.value, subtotal)
    } else if (d.type === 'free_shipping') {
      discountAmount = shippingCost
    }

    let valueLabel = ''
    if (d.type === 'percent') valueLabel = `-${d.value}%`
    else if (d.type === 'fixed') valueLabel = `-$${(d.value / 100).toFixed(2)}`
    else valueLabel = 'Envío gratis'

    const label = d.code ? `${d.code} (${valueLabel})` : `${d.name} (${valueLabel})`

    return {
      discount: {
        id: d.id,
        type: d.type as DiscountType,
        value: d.value,
        discountAmount,
        label,
        name: d.name,
      },
    }
  }

  return { discount: null, error: code ? 'Código no válido' : undefined }
}
