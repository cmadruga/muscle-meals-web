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

  if (user) {
    const { data: customer } = await createAdminClient()
      .from('customers')
      .select('id, full_name, email, phone, address')
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
    }
  }

  const deliveryDate = getUpcomingSunday()

  return (
    <CheckoutClient
      pickupSpots={pickupSpots}
      prefill={prefill}
      deliveryDateStr={formatDeliveryDate(deliveryDate)}
    />
  )
}
