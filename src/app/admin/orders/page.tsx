import { createClient } from '@/lib/supabase/server'
import { getOrdersForWeek } from '@/lib/db/orders'
import OrdersTable from './OrdersTable'
import { colors } from '@/lib/theme'

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // lunes = 1
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function PanelOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const params = await searchParams
  const weekStart = params.semana
    ? getMondayOfWeek(new Date(params.semana))
    : getMondayOfWeek(new Date())

  const supabase = await createClient()
  const orders = await getOrdersForWeek(supabase, weekStart)

  return (
    <div>
      <h1 style={{ color: colors.white, fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        Órdenes
      </h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
        {orders.length} orden{orders.length !== 1 ? 'es' : ''} en esta semana
      </p>

      <OrdersTable orders={orders} weekStart={weekStart} />
    </div>
  )
}
