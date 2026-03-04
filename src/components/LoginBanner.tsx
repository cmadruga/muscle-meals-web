'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from './LoginModal'
import { colors } from '@/lib/theme'

/**
 * Barra fija en la parte inferior — solo se muestra en cart/checkout cuando el usuario NO está logueado.
 * Invita a iniciar sesión para guardar historial de órdenes.
 */
export default function LoginBanner() {
  const { user, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // No mostrar si está cargando, ya está logueado, o cerró el banner
  if (loading || user || dismissed) return null

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: colors.grayDark,
        borderTop: `1px solid ${colors.grayLight}`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <p style={{
          color: colors.textSecondary,
          fontSize: 14,
          margin: 0,
          lineHeight: 1.4,
        }}>
          <span style={{ color: colors.white, fontWeight: 600 }}>¿Ya tienes cuenta?</span>
          {' '}Inicia sesión para guardar tu historial de órdenes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: colors.orange,
              color: colors.black,
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Iniciar sesión
          </button>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 6px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
