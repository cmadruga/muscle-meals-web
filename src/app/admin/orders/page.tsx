import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrdersForWeek } from '@/lib/db/orders'
import { getWeeklyProductionData } from '@/lib/db/production'
import { buildMatrix } from '@/lib/utils/production'
import { getActiveMeals } from '@/lib/db/meals'
import { getAllSizesWithCustomer } from '@/lib/db/sizes'
import type { CustomerBasic } from '@/lib/db/customers'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'
import OrdersTable from './OrdersTable'
import WeekNav from '../components/WeekNav'
import NewOrderButton from './NewOrderButton'
import { colors } from '@/lib/theme'

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default async function PanelOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const semana = params.semana ?? cookieStore.get('admin_week')?.value
  const weekStart = semana
    ? getMondayOfWeek(parseLocalDate(semana))
    : getMondayOfWeek(new Date())

  // Pass as string to avoid RSC Date serialization issues in the client component
  const weekStr = toLocalDateStr(weekStart)

  const supabase = await createClient()
  const admin = createAdminClient()

  const [orders, productionData, meals, sizes, customersRes, pickupSpots] = await Promise.all([
    getOrdersForWeek(admin, weekStart),
    getWeeklyProductionData(admin, weekStart),
    getActiveMeals(),
    getAllSizesWithCustomer(),
    admin.from('customers').select('id, full_name, phone, address').order('full_name', { ascending: true }),
    getActivePickupSpots(),
  ])

  const customers: CustomerBasic[] = (customersRes.data ?? []) as CustomerBasic[]

  const matrixData = buildMatrix(productionData)

  const STATUS_ES: Record<string, string> = {
    creado: 'Creado', paid: 'Pagado', pending: 'Pendiente',
    cancelled: 'Cancelado', extra: 'Extra', admin: 'Admin',
  }
  const byStatus: Record<string, { orders: number; meals: number }> = {}
  for (const order of orders) {
    const portions = order.items.reduce((s, i) => s + i.qty, 0)
    const key = order.status || 'unknown'
    if (!byStatus[key]) byStatus[key] = { orders: 0, meals: 0 }
    byStatus[key].orders += 1
    byStatus[key].meals += portions
  }
  const totalConfirmed = orders.reduce((s, o) => s + (o.status === 'paid' || o.status === 'admin' || o.status === 'extra' ? 1 : 0), 0)
  const totalConfirmedMeals = orders.reduce((s, o) => s + (o.status === 'paid' || o.status === 'admin' || o.status === 'extra' ? o.items.reduce((ss, i) => ss + i.qty, 0) : 0), 0)
  const statusBreakdown = Object.entries(byStatus)
    .map(([status, { orders: o, meals: m }]) => `${STATUS_ES[status] ?? status}: ${o} (${m})`)
    .join(' · ')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <h1 style={{ color: colors.white, fontSize: 26, fontWeight: 700, margin: 0 }}>
          Pedidos
        </h1>
        <NewOrderButton
          weekStr={weekStr}
          meals={meals.map(m => ({ id: m.id, name: m.name }))}
          sizes={sizes.map(s => ({ id: s.id, name: s.customer_name ? `${s.name} (${s.customer_name})` : s.name }))}
          customers={customers}
          pickupSpots={pickupSpots}
        />
      </div>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 2 }}>
        {totalConfirmed} órdenes esta semana ({totalConfirmedMeals} comidas confirmadas)
      </p>
      {statusBreakdown && (
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>
          {statusBreakdown}
        </p>
      )}

      <WeekNav weekStr={weekStr} />
      <OrdersTable
        orders={orders}
        weekStr={weekStr}
        matrixData={matrixData}
        customers={customers}
        meals={meals.map(m => ({ id: m.id, name: m.name }))}
        sizes={sizes.map(s => ({ id: s.id, name: s.customer_name ? `${s.name} (${s.customer_name})` : s.name }))}
      />
    </div>
  )
}
