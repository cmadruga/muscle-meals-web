'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import LoginModal from './LoginModal'
import { colors } from '@/lib/theme'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const itemCount = useCartStore(state => state.getItemCount())
  const [mounted, setMounted] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, loading } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!showDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setShowDropdown(false)
    router.push('/')
    router.refresh()
  }

  const getBackButton = () => {
    if (pathname === '/checkout') return { show: true, label: '← Carrito', href: '/cart' }
    if (pathname === '/cart') return { show: true, label: '← Menú', href: '/menu' }
    if (pathname === '/cuenta') return { show: true, label: '← Menú', href: '/menu' }
    if (pathname === '/cuenta/ordenes') return { show: true, label: '← Mi cuenta', href: '/cuenta' }
    if (pathname?.startsWith('/package/') || pathname?.startsWith('/meal/')) {
      return { show: true, label: '← Menú', href: '/menu' }
    }
    return { show: false, label: '', href: '' }
  }

  const backButton = getBackButton()

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || '?'

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''

  return (
    <>
      <style>{`
        .nav-back-label { }
        .nav-cart-text { }
        .nav-logo-full { display: inline; }
        .nav-logo-short { display: none; }
        .nav-login-btn { padding: 8px 28px; font-size: 14px; }
        @media (max-width: 640px) {
          .nav-back-label { display: none; }
          .nav-cart-text { display: none; }
          .nav-logo-full { display: none; }
          .nav-logo-short { display: inline; }
          .nav-login-btn { padding: 7px 12px; font-size: 13px; }
        }
      `}</style>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: colors.black,
        borderBottom: `2px solid ${colors.grayLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image
              src="/logo.png"
              alt="Muscle Meals"
              width={140}
              height={40}
              className="nav-logo-full"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <Image
              src="/logo-sm.png"
              alt="Muscle Meals"
              width={40}
              height={40}
              className="nav-logo-short"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {backButton.show && (
            <Link
              href={backButton.href}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                border: `1px solid ${colors.grayLight}`,
                borderRadius: 6,
                background: 'transparent',
                textDecoration: 'none',
                color: colors.white,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ←<span className="nav-back-label">&nbsp;{backButton.label.replace('← ', '')}</span>
            </Link>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mounted && !loading && (
            user ? (
              /* ── Avatar con dropdown ── */
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: colors.orange,
                    color: colors.black,
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </button>

                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: colors.grayDark,
                    border: `1px solid ${colors.grayLight}`,
                    borderRadius: 10,
                    minWidth: 200,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 100,
                  }}>
                    {/* Header con nombre */}
                    <div style={{
                      padding: '14px 16px 12px',
                      borderBottom: `1px solid ${colors.grayLight}`,
                    }}>
                      <p style={{ color: colors.white, fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {userName.split(' ')[0]}
                      </p>
                      <p style={{ color: colors.textMuted, fontSize: 12, margin: '2px 0 0' }}>
                        {user.email}
                      </p>
                    </div>

                    {/* Opciones */}
                    <DropdownLink href="/cuenta" onClick={() => setShowDropdown(false)}>
                      Mi cuenta
                    </DropdownLink>
                    <DropdownLink href="/cuenta/ordenes" onClick={() => setShowDropdown(false)}>
                      Mis órdenes
                    </DropdownLink>

                    <div style={{ borderTop: `1px solid ${colors.grayLight}`, marginTop: 4 }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.error,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Botón Iniciar sesión ── */
              <button
                onClick={() => setShowLogin(true)}
                className="nav-login-btn"
                style={{
                  background: colors.orange,
                  border: 'none',
                  borderRadius: 8,
                  color: colors.black,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Iniciar sesión
              </button>
            )
          )}

          {/* Cart */}
          <Link
            href="/cart"
            style={{
              position: 'relative',
              padding: '8px 16px',
              fontSize: 14,
              border: `2px solid ${colors.orange}`,
              borderRadius: 8,
              background: 'transparent',
              textDecoration: 'none',
              color: colors.white,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 'bold'
            }}
          >
            🛒<span className="nav-cart-text">Carrito</span>
            {mounted && itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: colors.orange,
                color: colors.black,
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}

function DropdownLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        padding: '11px 16px',
        color: colors.white,
        textDecoration: 'none',
        fontSize: 14,
      }}
    >
      {children}
    </Link>
  )
}
