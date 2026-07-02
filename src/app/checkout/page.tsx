import CheckoutClient from './CheckoutClient'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/address-validation'
import { getUpcomingSunday, formatDeliveryDate } from '@/lib/utils/delivery'

export default async function CheckoutPage() {
  const [pickupSpots, supabase] = await Promise.all([
    getActivePickupSpots(),
    createClient(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  let prefill: { customerId: string; name: string; email: string; phone: string; address: string | null } | null = null

  let membership: {
    is_member: boolean
    membership_weeks_left: number
    membership_qty: number | null
    membership_size_id: string | null
  } | null = null

  if (user) {
    const { data: customer } = await createAdminClient()
      .from('customers')
      .select('id, full_name, email, phone, address, is_member, membership_weeks_left, membership_qty, membership_size_id')
      .eq('user_id', user.id)
      .single()

    if (customer) {
      const phone = normalizePhone(customer.phone ?? '')

      prefill = {
        customerId: customer.id,
        name: customer.full_name ?? '',
        email: customer.email ?? '',
        phone,
        address: customer.address ?? null,
      }

      membership = {
        is_member: customer.is_member ?? false,
        membership_weeks_left: customer.membership_weeks_left ?? 0,
        membership_qty: customer.membership_qty ?? null,
        membership_size_id: customer.membership_size_id ?? null,
      }
    }
  }

  const deliveryDate = getUpcomingSunday()

  return (
    <CheckoutClient
      pickupSpots={pickupSpots}
      prefill={prefill}
      deliveryDateStr={formatDeliveryDate(deliveryDate)}
      membership={membership}
    />
  )
}
