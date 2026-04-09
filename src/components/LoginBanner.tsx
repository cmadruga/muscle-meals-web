'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from './LoginModal'
import { colors } from '@/lib/theme'

export default function LoginBanner() {
  const { user, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [open, setOpen] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (loading || user || dismissed) return null

  return (
    <>
      <style>{`
        .login-drawer {
          transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .login-drawer-tab {
          transition: transform 0.3s;
        }
      `}</style>

      <div
        className="login-drawer"
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
        {/* Tab / handle */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: '100%',
            background: colors.grayDark,
            border: 'none',
            borderBottom: `1px solid ${colors.grayLight}`,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: colors.white,
          }}
        >
          <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>
            Inicia sesión · Envío gratis
          </span>
          <span
            className="login-drawer-tab"
            style={{
              fontSize: 12,
              color: colors.textMuted,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Sección promo — mismo fondo que hero de landing */}
        <div style={{
          backgroundImage: 'url(/media/Fondo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '32px 28px 24px',
          textAlign: 'center',
          borderBottom: `1px solid ${colors.grayLight}`,
          position: 'relative',
        }}>
          {/* Overlay oscuro para legibilidad */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
          }} />
          <div style={{ position: 'relative' }}>
            <p style={{
              fontFamily: 'sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 600,
            }}>
              Regístrate ahora para
            </p>
            <p style={{
              fontFamily: 'Franchise, sans-serif',
              fontSize: 56,
              letterSpacing: 1,
              color: colors.orange,
              margin: '0 0 4px',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}>
              Envío Gratis
            </p>
            <p style={{
              fontFamily: 'Franchise, sans-serif',
              fontSize: 22,
              letterSpacing: 0,
              color: colors.white,
              margin: 0,
              lineHeight: 1.2,
            }}>
              en tu siguiente pedido
            </p>
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              margin: '10px 0 0',
            }}>
              Crea tu cuenta y tu próximo envío estándar ($49) es gratis.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div style={{
          background: colors.grayDark,
          padding: '20px 28px 28px',
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={() => setShowModal(true)}
            className="franchise-stroke"
            style={{
              flex: 1,
              background: colors.orange,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              padding: '15px 20px',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 22,
              letterSpacing: 0,
              lineHeight: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Iniciar sesión
          </button>

          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.grayLight}`,
              borderRadius: 8,
              color: colors.textMuted,
              fontSize: 13,
              padding: '15px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Continuar sin cuenta
          </button>
        </div>
      </div>

      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
