/**
 * Utilities for weekly delivery cutoff logic.
 * Deliveries happen every Sunday.
 * Default cutoff: every Friday at 12:00pm (noon, Monterrey time).
 * After cutoff (Fri 12pm → Sun), orders are for NEXT Sunday.
 */

export interface CriticalPeriodConfig {
  cutoff_day: number   // 0=Sun 1=Mon … 5=Fri 6=Sat
  cutoff_hour: number  // 0–23
  end_day: number      // inclusive (0=Sun by default)
}

export const DEFAULT_CRITICAL_PERIOD: CriticalPeriodConfig = {
  cutoff_day: 5,
  cutoff_hour: 12,
  end_day: 0,
}

export function isInCutoffWindow(config: CriticalPeriodConfig = DEFAULT_CRITICAL_PERIOD): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  const { cutoff_day, cutoff_hour, end_day } = config

  // Handle wrap-around (e.g. Fri → Sun crosses midnight)
  if (cutoff_day <= end_day) {
    // Same or later in the week (e.g. Fri=5 → Sun=0 wraps, so this handles Mon→Fri type ranges)
    return (day > cutoff_day || (day === cutoff_day && hour >= cutoff_hour)) && day <= end_day
  } else {
    // Wraps around Sunday (e.g. Fri=5 → Sun=0: days 5,6,0)
    return (day > cutoff_day || (day === cutoff_day && hour >= cutoff_hour)) || day <= end_day
  }
}

/** Returns the upcoming Sunday (today if it's Sunday, otherwise next Sunday). */
export function getUpcomingSunday(): Date {
  const now = new Date()
  const day = now.getDay()
  const daysToSunday = day === 0 ? 0 : 7 - day
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + daysToSunday)
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

/** Returns the Monday (00:00) of the current ISO week. */
export function getCurrentWeekMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
