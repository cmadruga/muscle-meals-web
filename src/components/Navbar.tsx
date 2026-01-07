'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import { colors } from '@/lib/theme'

export default function Navbar() {
  const pathname = usePathname()
  const itemCount = useCartStore(state => state.getItemCount())
  const [mounted, setMounted] = useState(false)

  // Solo mostrar contador después de hidratar en el cliente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Determinar si mostrar botón de regresar y a dónde
  const getBackButton = () => {
    if (pathname === '/checkout') {
      return { show: true, label: '← Carrito', href: '/cart' }
    }
    if (pathname === '/cart') {
      return { show: true, label: '← Menú', href: '/menu' }
    }
    if (pathname?.startsWith('/package/') || pathname?.startsWith('/meal/')) {
      return { show: true, label: '← Menú', href: '/menu' }
    }
    return { show: false, label: '', href: '' }
  }

  const backButton = getBackButton()

  return (
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
      {/* Left - Logo + Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link
          href="/"
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            color: colors.white,
            letterSpacing: 1
          }}
          title="Inicio"
        >
          <span style={{ color: colors.orange }}>MUSCLE</span>
          <span style={{ marginLeft: 6 }}>MEALS</span>
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
            {backButton.label}
          </Link>
        )}
      </div>

      {/* Right - Cart Button */}
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
        🛒 Carrito
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
    </nav>
  )
}
