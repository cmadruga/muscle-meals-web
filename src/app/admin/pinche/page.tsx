import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getWeeklyProductionData } from '@/lib/db/production'
import { computePincheData } from '@/lib/utils/production'
import { getAllPincheVessels } from '@/lib/db/pinche-vessels'
import PincheCarousel from './PincheCarousel'
import WeekNav from '../components/WeekNav'
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

export default async function PinchePage() {
  const cookieStore = await cookies()
  const semana = cookieStore.get('admin_week')?.value
  const weekStart = semana
    ? getMondayOfWeek(parseLocalDate(semana))
    : getMondayOfWeek(new Date())

  const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`

  const supabase = await createClient()
  const [productionData, vessels] = await Promise.all([
    getWeeklyProductionData(supabase, weekStart),
    getAllPincheVessels(),
  ])
  const pincheMeals = computePincheData(productionData)
  const totalPlatos = productionData.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div>
      <h1 style={{ color: colors.white, fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        Pinche de la Semana
      </h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>
        {totalPlatos} porciones
      </p>
      <WeekNav weekStr={weekKey} />

      <PincheCarousel meals={pincheMeals} weekKey={weekKey} vessels={vessels} />
    </div>
  )
}
