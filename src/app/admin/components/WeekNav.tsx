'use client'

import { useRouter } from 'next/navigation'
import { colors } from '@/lib/theme'

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatShort(date: Date): string {
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function WeekNav({ weekStr }: { weekStr: string }) {
  const router = useRouter()

  const weekStart = parseLocalDate(weekStr)
  const friday = new Date(weekStart); friday.setDate(weekStart.getDate() + 4)
  const sunday = new Date(weekStart); sunday.setDate(weekStart.getDate() + 6)

  function goTo(date: Date) {
    const monday = getMondayOfWeek(date)
    const newStr = toLocalDateStr(monday)
    document.cookie = `admin_week=${newStr}; path=/; max-age=604800`
    router.refresh()
  }

  function navigate(delta: -1 | 1) {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + delta * 7)
    goTo(next)
  }

  const btnStyle: React.CSSProperties = {
    background: colors.grayDark,
    border: `1px solid ${colors.grayLight}`,
    color: colors.white,
    padding: '7px 13px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  }

  return (
    <>
      <style>{`.wn-input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button style={btnStyle} onClick={() => navigate(-1)}>←</button>

        <input
          type="date"
          className="wn-input"
          value={weekStr}
          onChange={(e) => {
            if (!e.target.value) return
            const [y, m, d] = e.target.value.split('-').map(Number)
            goTo(new Date(y, m - 1, d))
          }}
          style={{
            background: colors.grayDark,
            border: `1px solid ${colors.grayLight}`,
            borderRadius: 8,
            color: colors.white,
            padding: '7px 12px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        />

        <button style={btnStyle} onClick={() => navigate(1)}>→</button>

        <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 4 }}>
          Corte{' '}<strong style={{ color: colors.orange }}>{formatShort(friday)}</strong>
          {'  ·  '}
          Entrega{' '}<strong style={{ color: colors.white }}>{formatShort(sunday)}</strong>
        </span>
      </div>
    </>
  )
}
