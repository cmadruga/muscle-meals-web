/**
 * Utilities for weekly delivery cutoff logic.
 * Deliveries happen every Sunday.
 * Default cutoff: every Friday at 12:00pm (noon, Monterrey time).
 * All day/hour checks use America/Monterrey timezone explicitly so the
 * server (which runs in UTC) evaluates times correctly.
 */

const TZ = 'America/Monterrey'

/** Returns { day (0=Sun…6=Sat), hour (0–23) } in Monterrey time. */
function getMtyDayHour(): { day: number; hour: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const weekdayStr = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0'

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = weekdays.indexOf(weekdayStr)
  const hour = parseInt(hourStr, 10) % 24  // Intl may return 24 for midnight

  return { day, hour }
}

/** Returns today's date in Monterrey time (midnight local). */
function getMtyDate(): Date {
  const now = new Date()
  const mtyStr = now.toLocaleDateString('en-CA', { timeZone: TZ }) // 'YYYY-MM-DD'
  const [y, m, d] = mtyStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export interface CriticalPeriodConfig {
  cutoff_day: number   // 0=Sun 1=Mon … 5=Fri 6=Sat
  cutoff_hour: number  // 0–23, Monterrey time
  end_day: number      // inclusive (0=Sun by default)
}

export const DEFAULT_CRITICAL_PERIOD: CriticalPeriodConfig = {
  cutoff_day: 5,
  cutoff_hour: 12,
  end_day: 0,
}

export function isInCutoffWindow(config: CriticalPeriodConfig = DEFAULT_CRITICAL_PERIOD): boolean {
  const { day, hour } = getMtyDayHour()
  const { cutoff_day, cutoff_hour, end_day } = config

  // Fri(5) → Sun(0) wraps around midnight — cutoff_day > end_day
  if (cutoff_day > end_day) {
    return (day > cutoff_day || (day === cutoff_day && hour >= cutoff_hour)) || day <= end_day
  } else {
    return (day > cutoff_day || (day === cutoff_day && hour >= cutoff_hour)) && day <= end_day
  }
}

/** Returns the upcoming Sunday in Monterrey time (today if it's Sunday). */
export function getUpcomingSunday(): Date {
  const today = getMtyDate()
  const day = today.getDay()
  const daysToSunday = day === 0 ? 0 : 7 - day
  today.setDate(today.getDate() + daysToSunday)
  return today
}

/** Returns the Monday (00:00) of the current ISO week in Monterrey time. */
export function getCurrentWeekMonday(): Date {
  const today = getMtyDate()
  const day = today.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  today.setDate(today.getDate() - daysFromMonday)
  return today
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
