import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import OrdenesClient from './OrdenesClient'
import { getCriticalPeriodConfig } from '@/lib/db/settings'
import { isInCutoffWindow } from '@/lib/utils/delivery'

export const dynamic = 'force-dynamic'

export default async function MisOrdenesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login')

  const admin = createAdminClient()

  const [{ data: customer }, criticalConfig] = await Promise.all([
    admin.from('customers').select('id').eq('user_id', user.id).maybeSingle(),
    getCriticalPeriodConfig(),
  ])

  const inCriticalPeriod = isInCutoffWindow(criticalConfig)

  const orders = customer
    ? (await admin
        .from('orders')
        .select('id, order_number, created_at, total_amount, status')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(30)).data ?? []
    : []

  const orderIds = orders.map((o) => o.id)
  const rawItems = orderIds.length > 0
    ? (await admin
        .from('order_items')
        .select('id, order_id, meal_id, size_id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name)')
        .in('order_id', orderIds)).data ?? []
    : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = rawItems as any[]

  // During critical period, identify which size IDs are custom (customer_id IS NOT NULL)
  let customSizeIds: string[] = []
  if (inCriticalPeriod && items.length > 0) {
    const allSizeIds = [...new Set(items.map((i: any) => i.size_id as string))]
    const { data: customSizes } = await admin
      .from('sizes').select('id').in('id', allSizeIds).not('customer_id', 'is', null)
    customSizeIds = (customSizes ?? []).map((s: any) => s.id)
  }

  return <OrdenesClient orders={orders} items={items} inCriticalPeriod={inCriticalPeriod} customSizeIds={customSizeIds} />
}
