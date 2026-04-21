'use client'

import { useState, useTransition } from 'react'
import { toggleSalesEnabled } from '@/app/actions/admin-settings'
import { colors } from '@/lib/theme'

export default function SalesToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const next = !enabled
    if (!next && !confirm('¿Apagar ventas? Los clientes no podrán agregar pedidos.')) return
    setEnabled(next)
    startTransition(async () => {
      await toggleSalesEnabled(next)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>Ventas</span>
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={enabled ? 'Apagar ventas' : 'Encender ventas'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20, cursor: isPending ? 'wait' : 'pointer',
          border: `1px solid ${enabled ? '#22c55e' : colors.grayLight}`,
          background: enabled ? '#22c55e22' : '#ef444422',
          color: enabled ? '#22c55e' : '#ef4444',
          fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: enabled ? '#22c55e' : '#ef4444',
          display: 'inline-block',
        }} />
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
