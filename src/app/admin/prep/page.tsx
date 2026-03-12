import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getWeeklyProductionData } from '@/lib/db/production'
import { computeMealTotals, computeShoppingList, computeEmpaquesData } from '@/lib/utils/production'
import PrepTabs from './PrepTabs'
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

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${weekStart.toLocaleDateString('es-MX', opts)} – ${weekEnd.toLocaleDateString('es-MX', opts)}`
}

export default async function PrepPage() {
  const cookieStore = await cookies()
  const semana = cookieStore.get('admin_week')?.value
  const weekStart = semana
    ? getMondayOfWeek(parseLocalDate(semana))
    : getMondayOfWeek(new Date())

  const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`

  const supabase = await createClient()
  const productionData = await getWeeklyProductionData(supabase, weekStart)
  const mealTotals = computeMealTotals(productionData)
  const shoppingItems = computeShoppingList(mealTotals)
  const empaquesMeals = computeEmpaquesData(productionData)

  return (
    <div>
      <h1 style={{ color: colors.white, fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        Prep de la Semana
      </h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
        {formatWeekRange(weekStart)}
      </p>

      <PrepTabs
        shoppingItems={shoppingItems}
        weekKey={weekKey}
        empaquesMeals={empaquesMeals}
      />
    </div>
  )
}
