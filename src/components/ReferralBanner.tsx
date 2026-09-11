'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getReferralStatsByUserId } from '@/app/actions/referrals'

const C = {
  orange: '#F79138',
  orangeHover: '#ffa252',
  orangeText: '#17140f',
  text: '#F5F1EC',
  textDim: 'rgba(245,241,236,.6)',
  headerBg: '#191614',
  bodyBg: '#0c0a09',
}
const F = {
  body: 'Barlow,system-ui,sans-serif',
  display: `'Franchise','Big Shoulders Display',sans-serif`,
}

interface Props {
  /** 'fixed' = desktop bubble (position:fixed, hidden on mobile)
   *  'inline' = mobile card (inline in page flow, hidden on desktop) */
  variant?: 'fixed' | 'inline'
}

export default function ReferralBanner({ variant = 'fixed' }: Props) {
  const { user, loading } = useAuth()
  const [dismissed, setDismissed] = useState(false)
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

  function handleWhatsApp() {
    if (!stats?.referralCode) return
    const code = stats.referralCode.toUpperCase()
    const text = encodeURIComponent(
      `¡Prueba Muscle Meals! Usa mi código ${code} y obtén 10% de descuento en tu primer pedido 💪 https://www.musclemeals.com.mx/`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading || !user || !stats?.referralCode) return null
  if (variant === 'fixed' && dismissed) return null

  const code = stats.referralCode.toUpperCase()

  // ── Inline mobile card ────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <>
        <style>{`
          .ref-inline { display: none; }
          @media (max-width: 900px) { .ref-inline { display: block; } }
          .ref-inline-copy:hover { background: ${C.orangeHover} !important; }
          .ref-inline-wa:hover { background: rgba(255,255,255,.06) !important; }
        `}</style>
        <div className="ref-inline" style={{ marginTop: 16 }}>
          <div style={{
            border: `1px solid ${C.orange}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div
              onClick={() => setOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 15px',
                background: C.headerBg,
                cursor: 'pointer',
              }}
            >
              {/* % badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: C.orange,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: F.body, fontWeight: 900, fontSize: 17, color: C.orangeText,
              }}>%</div>

              {/* Title + subtitle */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: F.display, fontWeight: 700, fontSize: 18,
                  textTransform: 'uppercase', color: C.orange, lineHeight: 1,
                }}>
                  Refiere y gana 10%
                </div>
                <div style={{
                  fontFamily: F.body, fontSize: 12, color: C.textDim,
                  marginTop: 4, lineHeight: 1,
                }}>
                  Para ti y para quien invites
                </div>
              </div>

              {/* Chevron */}
              <span style={{
                fontFamily: F.body, fontSize: 10, color: 'rgba(245,241,236,.4)',
                display: 'inline-block',
                transform: open ? 'rotate(180deg)' : 'none',
              }}>▼</span>
            </div>

            {/* Body */}
            {open && (
              <div style={{ background: C.bodyBg, padding: '16px 15px 15px' }}>
                <p style={{
                  fontFamily: F.body, fontSize: 14, lineHeight: 1.55,
                  color: C.textDim, margin: '0 0 14px',
                }}>
                  Quien use tu código recibe{' '}
                  <strong style={{ color: C.text, fontWeight: 700 }}>10% en su primer pedido</strong>
                  , y a ti te damos{' '}
                  <strong style={{ color: C.text, fontWeight: 700 }}>10% en el siguiente</strong>
                  . Sin límite.
                </p>

                {/* Code row */}
                <div style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                  <div style={{
                    flex: 1, padding: '11px 13px',
                    border: `1.5px dashed ${C.orange}`,
                    borderRadius: 9, background: 'rgba(247,145,56,.06)',
                    fontFamily: F.body, fontWeight: 700, fontSize: 15,
                    letterSpacing: '.08em', color: C.orange,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {code}
                  </div>
                  <button
                    className="ref-inline-copy"
                    onClick={handleCopy}
                    style={{
                      padding: '11px 18px', borderRadius: 9,
                      background: copied ? '#7ac77a' : C.orange,
                      border: 'none', cursor: 'pointer',
                      fontFamily: F.display, fontWeight: 700, fontSize: 17,
                      textTransform: 'uppercase',
                      color: copied ? '#14110f' : C.orangeText,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {copied ? '✓' : 'Copiar'}
                  </button>
                </div>

                {/* WhatsApp */}
                <button
                  className="ref-inline-wa"
                  onClick={handleWhatsApp}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 9, border: `1px solid rgba(245,241,236,.18)`,
                    background: 'rgba(255,255,255,.03)', cursor: 'pointer',
                    fontFamily: F.body, fontWeight: 600, fontSize: 14,
                    color: C.text,
                  }}
                >
                  Compartir por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Fixed desktop bubble ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .referral-chip { display: flex; flex-direction: column; }
        @media (max-width: 900px) { .referral-chip { display: none !important; } }
        .referral-copy-btn:hover { background: ${C.orangeHover} !important; }
        .referral-wa-btn:hover { background: rgba(255,255,255,.06) !important; }
      `}</style>

      <div
        className="referral-chip"
        style={{
          position: 'fixed',
          right: 22,
          bottom: 20,
          zIndex: 950,
          width: 430,
          border: `2px solid ${C.orange}`,
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,.65)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px',
            background: C.headerBg,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: C.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F.body, fontWeight: 900, fontSize: 20, color: C.orangeText,
          }}>%</div>

          <span style={{
            flex: 1,
            fontFamily: F.display, fontWeight: 900, fontSize: 22,
            textTransform: 'uppercase', color: C.orange, lineHeight: 1,
          }}>
            Refiere y gana 10%
          </span>

          <span style={{
            fontFamily: F.body, fontSize: 11, color: 'rgba(245,241,236,.4)',
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'none',
            marginRight: 6,
          }}>▼</span>

          <button
            onClick={e => { e.stopPropagation(); setDismissed(true) }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: F.body, fontSize: 18, lineHeight: 1,
              color: 'rgba(245,241,236,.4)', padding: '0 2px',
            }}
            aria-label="Cerrar"
          >×</button>
        </div>

        {/* Body */}
        {open && (
          <div style={{ background: C.bodyBg, padding: '20px 18px 18px' }}>
            <p style={{
              fontFamily: F.body, fontSize: 15, lineHeight: 1.6,
              color: C.textDim, margin: '0 0 18px',
            }}>
              Comparte tu código. Quien lo use recibe{' '}
              <strong style={{ color: C.text, fontWeight: 700 }}>10% en su primer pedido</strong>
              , y a ti te damos{' '}
              <strong style={{ color: C.text, fontWeight: 700 }}>10% en el siguiente</strong>
              . Sin límite de referidos.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{
                flex: 1, padding: '11px 16px',
                border: `1.5px dashed ${C.orange}`,
                borderRadius: 10, background: 'rgba(247,145,56,.06)',
                fontFamily: F.body, fontWeight: 700, fontSize: 17,
                letterSpacing: '.1em', color: C.orange,
                display: 'flex', alignItems: 'center',
              }}>
                {code}
              </div>
              <button
                className="referral-copy-btn"
                onClick={handleCopy}
                style={{
                  padding: '13px 22px', borderRadius: 10,
                  background: copied ? '#7ac77a' : C.orange,
                  border: 'none', cursor: 'pointer',
                  fontFamily: F.display, fontWeight: 700, fontSize: 18,
                  textTransform: 'uppercase',
                  color: copied ? '#14110f' : C.orangeText,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  letterSpacing: '.01em',
                }}
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <button
              className="referral-wa-btn"
              onClick={handleWhatsApp}
              style={{
                width: '100%', padding: '12px',
                borderRadius: 10, border: `1px solid rgba(245,241,236,.18)`,
                background: 'rgba(255,255,255,.03)', cursor: 'pointer',
                fontFamily: F.body, fontWeight: 600, fontSize: 15,
                color: C.text,
              }}
            >
              Compartir por WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  )
}
