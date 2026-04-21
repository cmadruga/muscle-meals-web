'use client'

import { useState, useTransition } from 'react'
import { toggleSalesEnabled, saveSalesPauseMessage } from '@/app/actions/admin-settings'
import { colors } from '@/lib/theme'

interface SalesToggleProps {
  initialEnabled: boolean
  initialMessage: string
}

export default function SalesToggle({ initialEnabled, initialMessage }: SalesToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [message, setMessage] = useState(initialMessage)
  const [isPending, startTransition] = useTransition()
  const [msgSaved, setMsgSaved] = useState(false)

  const handleToggle = () => {
    const next = !enabled
    if (!next && !confirm('¿Apagar ventas? Los clientes no podrán agregar pedidos.')) return
    setEnabled(next)
    startTransition(async () => {
      await toggleSalesEnabled(next)
    })
  }

  const handleSaveMessage = () => {
    startTransition(async () => {
      await saveSalesPauseMessage(message)
      setMsgSaved(true)
      setTimeout(() => setMsgSaved(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>Ventas</span>
        <button
          onClick={handleToggle}
          disabled={isPending}
          title={enabled ? 'Apagar ventas' : 'Encender ventas'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20, cursor: isPending ? 'wait' : 'pointer',
            border: `1px solid ${enabled ? '#22c55e' : '#ef4444'}`,
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

      {/* Mensaje de pausa — siempre visible para poder prepararlo antes de apagar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Mensaje del popup (ej: Volvemos el lunes)"
          maxLength={120}
          style={{
            fontSize: 12, padding: '4px 8px', borderRadius: 6, width: 260,
            border: `1px solid ${colors.grayLight}`, background: colors.grayDark,
            color: colors.white, outline: 'none',
          }}
        />
        <button
          onClick={handleSaveMessage}
          disabled={isPending}
          style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${msgSaved ? '#22c55e' : colors.grayLight}`,
            background: msgSaved ? '#22c55e22' : colors.black,
            color: msgSaved ? '#22c55e' : colors.textMuted,
            whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}
        >
          {msgSaved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
