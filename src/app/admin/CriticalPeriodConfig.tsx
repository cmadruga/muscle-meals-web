'use client'

import { useState, useTransition } from 'react'
import { updateCriticalPeriodConfig } from '@/app/actions/admin-settings'
import type { CriticalPeriodConfig } from '@/lib/utils/delivery'
import { colors } from '@/lib/theme'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function CriticalPeriodConfigPanel({ initial }: { initial: CriticalPeriodConfig }) {
  const [cfg, setCfg] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const update = (patch: Partial<CriticalPeriodConfig>) => setCfg(prev => ({ ...prev, ...patch }))

  const handleSave = () => {
    startTransition(async () => {
      await updateCriticalPeriodConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const sel: React.CSSProperties = {
    background: '#111', border: '1px solid #333', borderRadius: 6,
    color: colors.white, padding: '4px 8px', fontSize: 13, outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Periodo crítico
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>Desde</span>
        <select style={sel} value={cfg.cutoff_day} onChange={e => update({ cutoff_day: Number(e.target.value) })}>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <input
          type="number" min={0} max={23} value={cfg.cutoff_hour}
          onChange={e => update({ cutoff_hour: Number(e.target.value) })}
          style={{ ...sel, width: 52, textAlign: 'center' }}
        />
        <span style={{ fontSize: 12, color: colors.textMuted }}>h — hasta</span>
        <select style={sel} value={cfg.end_day} onChange={e => update({ end_day: Number(e.target.value) })}>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            border: `1px solid ${saved ? '#22c55e' : colors.grayLight}`,
            background: saved ? '#22c55e22' : colors.black,
            color: saved ? '#22c55e' : colors.textMuted,
            transition: 'all 0.2s',
          }}
        >
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
