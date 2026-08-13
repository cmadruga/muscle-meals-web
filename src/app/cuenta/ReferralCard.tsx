'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'

export default function ReferralCard({
  referralCode,
  totalReferrals,
  pendingRewards,
}: {
  referralCode: string
  totalReferrals: number
  pendingRewards: number
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(referralCode.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Código */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: colors.textMuted }}>Tu código de referido</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            flex: 1,
            background: colors.black,
            border: `1px solid ${colors.grayLight}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'monospace',
            fontSize: 18,
            fontWeight: 700,
            color: colors.orange,
            letterSpacing: '0.08em',
          }}>
            {referralCode.toUpperCase()}
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: `1px solid ${copied ? '#10b981' : colors.orange}`,
              background: copied ? '#10b98122' : `${colors.orange}18`,
              color: copied ? '#10b981' : colors.orange,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: colors.black, borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.white }}>{totalReferrals}</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>
            Amigo{totalReferrals !== 1 ? 's' : ''} referido{totalReferrals !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ background: colors.black, borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: pendingRewards > 0 ? colors.orange : colors.white }}>
            {pendingRewards}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>
            Recompensa{pendingRewards !== 1 ? 's' : ''} pendiente{pendingRewards !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: colors.white }}>¿Cómo funciona?</p>
        <p style={{ margin: 0 }}>
          Comparte tu código con un amigo — él obtiene <span style={{ color: colors.orange, fontWeight: 600 }}>10% off</span> en su primer pedido,
          y tú ganas <span style={{ color: colors.orange, fontWeight: 600 }}>10% off</span> en tu siguiente pedido.
          ¡Sin límite de referidos!
        </p>
      </div>

    </div>
  )
}
