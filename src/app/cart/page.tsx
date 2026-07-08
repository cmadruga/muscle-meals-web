import { getCriticalPeriodConfig } from '@/lib/db/settings'
import { isInCutoffWindow, getCurrentWeekMonday } from '@/lib/utils/delivery'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'
import { getActiveMeals } from '@/lib/db/meals'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/address-validation'
import CartClient from './CartClient'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const [criticalConfig, pickupSpots, supabase, activeMeals] = await Promise.all([
    getCriticalPeriodConfig(),
    getActivePickupSpots(),
    createClient(),
    getActiveMeals(),
  ])
  const inCutoff = isInCutoffWindow(criticalConfig)

  const { data: { user } } = await supabase.auth.getUser()

  let prefill: { customerId: string; name: string; phone: string; rawPhone: string; address: string | null } | null = null
  let membership: {
    is_member: boolean
    membership_weeks_left: number
    membership_qty: number | null
    membership_size_id: string | null
  } | null = null
  let usedMembershipThisWeek = false

  if (user) {
    const admin = createAdminClient()
    const { data: customer } = await admin
      .from('customers')
      .select('id, full_name, phone, address, is_member, membership_weeks_left, membership_qty, membership_size_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (customer) {
      prefill = {
        customerId: customer.id,
        name: customer.full_name ?? '',
        phone: normalizePhone(customer.phone ?? ''),
        rawPhone: customer.phone ?? '',
        address: customer.address ?? null,
      }
      membership = {
        is_member: customer.is_member ?? false,
        membership_weeks_left: customer.membership_weeks_left ?? 0,
        membership_qty: customer.membership_qty ?? null,
        membership_size_id: customer.membership_size_id ?? null,
      }

      if (customer.is_member) {
        const weekStart = getCurrentWeekMonday().toISOString()
        const { data: thisWeekOrders } = await admin
          .from('orders')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('status', 'paid')
          .gte('created_at', weekStart)
          .limit(1)
        usedMembershipThisWeek = (thisWeekOrders?.length ?? 0) > 0
      }
    }
  }

  return (
    <CartClient
      inCutoff={inCutoff}
      prefill={prefill}
      membership={membership}
      pickupSpots={pickupSpots}
      usedMembershipThisWeek={usedMembershipThisWeek}
      activeMeals={activeMeals}
    />
  )
}
