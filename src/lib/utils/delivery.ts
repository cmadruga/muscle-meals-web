/**
 * Utilities for weekly delivery cutoff logic.
 * Deliveries happen every Sunday.
 * Orders close (cutoff) every Friday at 12:00pm (noon, Monterrey time).
 * After cutoff (Fri 12pm → Sun), orders are for NEXT Sunday.
 */

export function getDeliveryDate(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hours = now.getHours()

  // Past cutoff: Friday 12pm or later, Saturday, or Sunday
  const isPastCutoff =
    (dayOfWeek === 5 && hours >= 12) ||
    dayOfWeek === 6 ||
    dayOfWeek === 0

  // Days to this coming Sunday (7 if today is Sunday)
  const daysToThisSunday = ((7 - dayOfWeek) % 7) || 7
  const daysUntilDelivery = isPastCutoff ? daysToThisSunday + 7 : daysToThisSunday

  const delivery = new Date(now)
  delivery.setDate(now.getDate() + daysUntilDelivery)
  delivery.setHours(0, 0, 0, 0)
  return delivery
}

export function isInCutoffWindow(): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hours = now.getHours()

  return (
    (dayOfWeek === 5 && hours >= 12) ||
    dayOfWeek === 6 ||
    dayOfWeek === 0
  )
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
