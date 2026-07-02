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
