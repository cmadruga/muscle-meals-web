'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from './LoginModal'
import { F } from '@/lib/ui-fonts'

const C = {
  orange:  '#F79138',
  text:    '#F5F1EC',
  bg:      '#0c0a09',
  card:    '#141110',
}

export default function LoginBanner() {
  const { user, loading } = useAuth()
  const [showModal,  setShowModal]  = useState(false)
  const [open,       setOpen]       = useState(true)
  const [dismissed,  setDismissed]  = useState(false)

  if (loading || user || dismissed) return null

  return (
    <>
      <style>{`
        .lb-drawer {
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .lb-cta-primary:hover  { background: #ffa252 !important; }
        .lb-cta-ghost:hover    { background: rgba(255,255,255,.06) !important; }
      `}</style>

      <div
        className="lb-drawer"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
          transform: open ? 'translateY(0)' : 'translateY(calc(100% - 70px))',
          maxWidth: 560, margin: '0 auto',
          borderRadius: '14px 14px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,.65)',
          border: '1px solid rgba(255,255,255,.09)',
          borderBottom: 'none',
        }}
      >

        {/* ── Tab / handle — mismo estilo que header de Refiere ──── */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: '100%',
            background: '#191614',
            border: 'none', borderBottom: '1px solid rgba(255,255,255,.08)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* icon box — mismo estilo sólido que "%" en Refiere */}
            <span style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: C.orange,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#17140f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            {/* Franchise heading naranja — igual que "REFIERE Y GANA 10%" */}
            <span style={{
              font: `700 22px/1 ${F.display}`,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              color: C.orange,
            }}>
              Inicia sesión o regístrate
            </span>
          </div>
          <span style={{
            font: `400 11px/1 ${F.body}`,
            color: 'rgba(245,241,236,.35)',
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .25s',
            flexShrink: 0,
          }}>▲</span>
        </button>

        {/* ── Content ────────────────────────────────────────────── */}
        <div style={{
          background: `${C.card} url('/media/fondo-auth.jpg') center/900px repeat`,
          position: 'relative',
        }}>
          {/* texture overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,17,16,.84)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', padding: '32px 28px 28px', textAlign: 'center' }}>

            {/* Heading */}
            <h2 style={{
              margin: '0 0 6px',
              font: `700 42px/1 ${F.display}`,
              textTransform: 'uppercase',
              letterSpacing: '.02em',
              color: C.orange,
            }}>
              Crea tu cuenta
            </h2>
            <p style={{
              margin: '0 0 10px',
              font: `700 17px/1.2 ${F.display}`,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              color: C.text,
            }}>
              Y lleva el control de tus pedidos
            </p>
            <p style={{
              margin: '0 0 28px',
              font: `400 13.5px/1.55 ${F.body}`,
              color: 'rgba(245,241,236,.55)',
            }}>
              Guarda tu dirección, revisa tu historial y pide más rápido.
            </p>

            {/* Benefits */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left',
            }}>
              {[
                'Historial de pedidos siempre disponible',
                'Dirección guardada para pedir más rápido',
                'Repite tu última semana en un toque',
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="7" fill="rgba(247,145,56,.18)" />
                    <path d="M4 7l2 2 4-4" stroke={C.orange} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ font: `400 13px/1 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>{b}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="lb-cta-primary"
                onClick={() => setShowModal(true)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  border: 'none', borderRadius: 9,
                  background: C.orange, color: '#17140f',
                  font: `700 19px/1 ${F.display}`,
                  letterSpacing: '.09em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(247,145,56,.22)',
                }}
              >
                Iniciar sesion
              </button>
              <button
                className="lb-cta-ghost"
                onClick={() => setDismissed(true)}
                style={{
                  padding: '14px 16px',
                  border: '1px solid rgba(245,241,236,.1)', borderRadius: 9,
                  background: 'rgba(255,255,255,.04)',
                  font: `500 15px/1 ${F.body}`,
                  color: 'rgba(245,241,236,.65)',
                  cursor: 'pointer',
                }}
              >
                Continuar sin cuenta
              </button>
            </div>

          </div>
        </div>
      </div>

      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
