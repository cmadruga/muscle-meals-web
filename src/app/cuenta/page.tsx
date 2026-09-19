import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReferralCode } from '@/lib/utils/referrals'
import { redirect } from 'next/navigation'
import { getReferralStats } from '@/app/actions/referrals'
import CuentaClient from './CuentaClient'
import type { OrderRow, ItemRow } from './CuentaClient'

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login')

  const admin = createAdminClient()

  /* ── Ensure customer row exists ── */
  let { data: customer } = await admin
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer && user.email) {
    const { data: byEmail } = await admin
      .from('customers').select('*').eq('email', user.email).maybeSingle()

    if (byEmail) {
      await admin.from('customers').update({ user_id: user.id }).eq('id', byEmail.id)
      customer = { ...byEmail, user_id: user.id }
    } else {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
      const baseCode = buildReferralCode(user.email)
      let code = baseCode, n = 2
      while (true) {
        const { data: conflict } = await admin.from('customers').select('id').eq('referral_code', code).maybeSingle()
        if (!conflict) break
        code = baseCode + n++
      }
      const { data: created } = await admin
        .from('customers')
        .insert({ full_name: name, email: user.email, user_id: user.id, referral_code: code })
        .select('*').single()
      customer = created ?? null
    }
  }

  /* ── Fetch orders and referral stats in parallel ── */
  const [ordersRes, referralStats] = await Promise.all([
    customer
      ? admin.from('orders')
          .select('id, created_at, total_amount, status, shipping_cost, order_number')
          .eq('customer_id', customer.id)
          .not('status', 'in', '("extra","admin")')
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
    customer ? getReferralStats(customer.id) : Promise.resolve(null),
  ])

  const allOrders = (ordersRes.data ?? []) as OrderRow[]
  const lastOrder     = allOrders[0] ?? null
  const historyOrders = allOrders.slice(1, 3)

  /* ── Fetch last order items ── */
  const { data: rawItems } = lastOrder
    ? await admin.from('order_items')
        .select('id, order_id, meal_id, size_id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name)')
        .eq('order_id', lastOrder.id)
    : { data: [] }

  const lastOrderItems = (rawItems ?? []) as unknown as ItemRow[]

  /* ── Order count (all non-extra/admin) ── */
  const { count: orderCount } = customer
    ? await admin.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .not('status', 'in', '("extra","admin")')
    : { count: 0 }

  return (
    <CuentaClient
      customer={customer}
      lastOrder={lastOrder}
      lastOrderItems={lastOrderItems}
      historyOrders={historyOrders}
      orderCount={orderCount ?? 0}
      referralCode={referralStats?.referralCode ?? null}
      totalReferrals={referralStats?.totalReferrals ?? 0}
      pendingRewards={referralStats?.pendingRewards ?? 0}
    />
  )
}
