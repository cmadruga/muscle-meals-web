'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function updateMembership(
  customerId: string,
  data: {
    is_member: boolean
    membership_weeks_left: number
    membership_qty: number | null
    membership_size_id: string | null
  }
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('customers')
    .update(data)
    .eq('id', customerId)

  if (error) throw new Error(error.message)
}

export async function updateCustomerContact(
  customerId: string,
  data: { full_name?: string | null; phone: string | null; address: string | null }
): Promise<void> {
  const admin = createAdminClient()
  const update: Record<string, string | null> = {
    phone: data.phone || null,
    address: data.address || null,
  }
  if (data.full_name !== undefined) update.full_name = data.full_name || null

  const { error } = await admin
    .from('customers')
    .update(update)
    .eq('id', customerId)

  if (error) throw new Error(error.message)
}
