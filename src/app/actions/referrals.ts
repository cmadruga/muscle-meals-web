'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ValidatedDiscount } from '@/lib/types/discount'

const REFERRAL_DISCOUNT_PCT = 10

// ─── Validar código de referido ingresado en checkout (flujo del referee) ─────

export async function validateReferralCode(params: {
  code: string
  customerId: string | null
  subtotal: number  // centavos
}): Promise<{
  discount: ValidatedDiscount | null
  referrerCustomerId: string | null
  error?: string
}> {
  const { code, customerId, subtotal } = params
  const supabase = createAdminClient()

  // Buscar al referidor por su código
  const { data: referrer } = await supabase
    .from('customers')
    .select('id')
    .eq('referral_code', code.toLowerCase().trim())
    .maybeSingle()

  if (!referrer) return { discount: null, referrerCustomerId: null }

  // No puede usar su propio código
  if (customerId && referrer.id === customerId) {
    return { discount: null, referrerCustomerId: null, error: 'No puedes usar tu propio código de referido' }
  }

  // Requiere cuenta
  if (!customerId) {
    return { discount: null, referrerCustomerId: null, error: 'referral_needs_account' }
  }

  // Solo para primer pedido
  const { count: paidCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('status', 'paid')

  if ((paidCount ?? 0) > 0) {
    return { discount: null, referrerCustomerId: null, error: 'El código de referido aplica solo en tu primer pedido' }
  }

  // No puede haber usado un referido antes
  const { count: prevReferral } = await supabase
    .from('referral_uses')
    .select('id', { count: 'exact', head: true })
    .eq('referee_customer_id', customerId)

  if ((prevReferral ?? 0) > 0) {
    return { discount: null, referrerCustomerId: null, error: 'Ya usaste un código de referido anteriormente' }
  }

  const discountAmount = Math.round(subtotal * (REFERRAL_DISCOUNT_PCT / 100))

  return {
    discount: {
      id: `referral:${referrer.id}`,
      type: 'percent',
      value: REFERRAL_DISCOUNT_PCT,
      discountAmount,
      label: `Código de referido (-${REFERRAL_DISCOUNT_PCT}%)`,
      name: 'Código de referido',
    },
    referrerCustomerId: referrer.id,
  }
}

// ─── Verificar recompensas pendientes del referidor (auto-apply en checkout) ──

export async function checkReferrerRewards(params: {
  customerId: string
  subtotal: number  // centavos
}): Promise<{ count: number; discount: ValidatedDiscount | null }> {
  const { customerId, subtotal } = params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('referral_uses')
    .select('id')
    .eq('referrer_customer_id', customerId)
    .eq('reward_redeemed', false)

  const count = data?.length ?? 0
  if (count === 0) return { count: 0, discount: null }

  const discountAmount = Math.round(subtotal * (REFERRAL_DISCOUNT_PCT / 100))

  return {
    count,
    discount: {
      id: `referrer_reward:${customerId}`,
      type: 'percent',
      value: REFERRAL_DISCOUNT_PCT,
      discountAmount,
      label: `Recompensa por referido (-${REFERRAL_DISCOUNT_PCT}%)`,
      name: 'Recompensa por referido',
    },
  }
}

// ─── Info de referidos para panel admin ───────────────────────────────────────

export type ReferralUseRow = {
  id: string
  referee_name: string | null
  order_number: string
  reward_redeemed: boolean
  reward_order_number: string | null
  created_at: string
}

export async function getCustomerReferralInfo(customerId: string): Promise<{
  referralCode: string | null
  asReferrer: ReferralUseRow[]   // personas que usaron su código
  asReferee: { referrer_name: string | null; order_number: string; created_at: string } | null  // si él usó un código
}> {
  const supabase = createAdminClient()

  const [{ data: customer }, { data: asReferrer }, { data: asRefereeRaw }] = await Promise.all([
    supabase.from('customers').select('referral_code').eq('id', customerId).maybeSingle(),
    supabase
      .from('referral_uses')
      .select('id, referee_customer_id, reward_redeemed, created_at, orders!referral_uses_order_id_fkey(order_number), reward_order:orders!referral_uses_reward_order_id_fkey(order_number)')
      .eq('referrer_customer_id', customerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('referral_uses')
      .select('referrer_customer_id, created_at, orders!referral_uses_order_id_fkey(order_number)')
      .eq('referee_customer_id', customerId)
      .maybeSingle(),
  ])

  // Nombres de los referees
  const refereeIds = [...new Set((asReferrer ?? []).map((r: any) => r.referee_customer_id).filter(Boolean))]
  const { data: refereeCustomers } = refereeIds.length
    ? await supabase.from('customers').select('id, full_name').in('id', refereeIds)
    : { data: [] }
  const refereeNames = new Map((refereeCustomers ?? []).map((c: any) => [c.id, c.full_name]))

  // Nombre del referidor (si este cliente usó un código)
  let referrerName: string | null = null
  if (asRefereeRaw?.referrer_customer_id) {
    const { data: ref } = await supabase.from('customers').select('full_name').eq('id', asRefereeRaw.referrer_customer_id).maybeSingle()
    referrerName = ref?.full_name ?? null
  }

  const referrerRows: ReferralUseRow[] = (asReferrer ?? []).map((r: any) => ({
    id: r.id,
    referee_name: refereeNames.get(r.referee_customer_id) ?? 'Cliente',
    order_number: (r.orders as any)?.order_number ?? '—',
    reward_redeemed: r.reward_redeemed,
    reward_order_number: (r.reward_order as any)?.order_number ?? null,
    created_at: r.created_at,
  }))

  return {
    referralCode: customer?.referral_code ?? null,
    asReferrer: referrerRows,
    asReferee: asRefereeRaw
      ? {
          referrer_name: referrerName,
          order_number: (asRefereeRaw.orders as any)?.order_number ?? '—',
          created_at: asRefereeRaw.created_at,
        }
      : null,
  }
}

// ─── Stats para /cuenta (server component — recibe customerId) ────────────────

export async function getReferralStats(customerId: string): Promise<{
  referralCode: string | null
  totalReferrals: number
  pendingRewards: number
}> {
  const supabase = createAdminClient()

  const [{ data: customer }, { data: uses }] = await Promise.all([
    supabase.from('customers').select('referral_code').eq('id', customerId).maybeSingle(),
    supabase.from('referral_uses').select('reward_redeemed').eq('referrer_customer_id', customerId),
  ])

  const total = uses?.length ?? 0
  const pending = uses?.filter(u => !u.reward_redeemed).length ?? 0

  return {
    referralCode: customer?.referral_code ?? null,
    totalReferrals: total,
    pendingRewards: pending,
  }
}

// ─── Stats para client components — recibe userId (auth.users.id) ─────────────

export async function getReferralStatsByUserId(userId: string): Promise<{
  referralCode: string | null
  totalReferrals: number
  pendingRewards: number
} | null> {
  const supabase = createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, referral_code')
    .eq('user_id', userId)
    .maybeSingle()

  if (!customer) return null

  const { data: uses } = await supabase
    .from('referral_uses')
    .select('reward_redeemed')
    .eq('referrer_customer_id', customer.id)

  const total = uses?.length ?? 0
  const pending = uses?.filter(u => !u.reward_redeemed).length ?? 0

  return {
    referralCode: customer.referral_code ?? null,
    totalReferrals: total,
    pendingRewards: pending,
  }
}
