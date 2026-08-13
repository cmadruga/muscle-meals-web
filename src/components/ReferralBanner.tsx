'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getReferralStatsByUserId } from '@/app/actions/referrals'
import { colors } from '@/lib/theme'

export default function ReferralBanner() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<{
    referralCode: string | null
    totalReferrals: number
    pendingRewards: number
  } | null>(null)

  useEffect(() => {
    if (!user) return
    getReferralStatsByUserId(user.id).then(s => setStats(s)).catch(() => {})
  }, [user?.id])

  async function handleCopy() {
    if (!stats?.referralCode) return
    await navigator.clipboard.writeText(stats.referralCode.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Solo mostrar para usuarios logueados con código de referido
  if (loading || !user || !stats?.referralCode) return null

  return (
    <>
      <style>{`
        .referral-drawer {
          transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .referral-drawer-arrow {
          transition: transform 0.3s;
        }
      `}</style>

      <div
        className="referral-drawer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          transform: open ? 'translateY(0)' : 'translateY(calc(100% - 44px))',
          maxWidth: 560,
          margin: '0 auto',
          borderRadius: open ? '16px 16px 0 0' : '12px 12px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        } as React.CSSProperties}
      >
        {/* Tab */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: '100%',
            background: colors.orange,
            border: 'none',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontFamily: 'Franchise, sans-serif', fontSize: 18, color: colors.black, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            🎁 Comparte y gana — Refiere amigos, gana 10% off
          </span>
          <span
            className="referral-drawer-arrow"
            style={{
              fontSize: 12,
              color: colors.black,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Contenido */}
        <div style={{
          background: colors.grayDark,
          padding: '20px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Explicación */}
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
            Comparte tu código — tu amigo obtiene{' '}
            <span style={{ color: colors.orange, fontWeight: 700 }}>10% off</span> en su primer pedido,
            y tú ganas{' '}
            <span style={{ color: colors.orange, fontWeight: 700 }}>10% off</span> en tu siguiente.
          </p>

          {/* Código + copiar */}
          <div style={{ display: 'flex', gap: 8 }}>
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
              {stats.referralCode.toUpperCase()}
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
      </div>
    </>
  )
}
