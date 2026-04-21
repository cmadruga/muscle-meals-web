'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'

const DEFAULT_MESSAGE = 'Por el momento no estamos recibiendo pedidos. ¡Vuelve pronto!'

export default function SalesPausedModal({ message }: { message: string }) {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.grayDark,
          border: `2px solid #ef4444`,
          borderRadius: 16,
          padding: '36px 32px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
        <h2 style={{
          color: '#ef4444', fontFamily: 'Franchise, sans-serif',
          fontSize: 28, letterSpacing: 1, margin: '0 0 12px',
          textTransform: 'uppercase',
        }}>
          Ventas pausadas
        </h2>
        <p style={{
          color: colors.textSecondary, fontSize: 16, lineHeight: 1.5,
          margin: '0 0 28px',
        }}>
          {message || DEFAULT_MESSAGE}
        </p>
        <button
          onClick={() => setOpen(false)}
          style={{
            padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${colors.grayLight}`,
            background: colors.black, color: colors.textMuted,
            fontSize: 14, fontWeight: 600,
          }}
        >
          Ver el menú de todas formas
        </button>
      </div>
    </div>
  )
}
