'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'

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
      return { show: true, label: '← Tienda', href: '/' }
    }
    if (pathname?.startsWith('/package/') || pathname?.startsWith('/meal/')) {
      return { show: true, label: '← Tienda', href: '/' }
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
      background: 'white',
      borderBottom: '1px solid #ccc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 1000
    }}>
      {/* Left - Back Button or Home Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link
          href="/"
          style={{
            fontSize: 24,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Inicio"
        >
          HOME
        </Link>
        
        {backButton.show && (
          <Link
            href={backButton.href}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 8,
              background: 'white',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8
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
          border: '1px solid #ccc',
          borderRadius: 8,
          background: 'white',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        🛒 Carrito
        {mounted && itemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: '#ef4444',
            color: 'white',
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
