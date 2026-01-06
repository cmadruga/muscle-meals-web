'use client'

import { useCartStore } from '@/lib/store/cart'
import Link from 'next/link'

export default function CartIcon() {
  const itemCount = useCartStore(state => state.getItemCount())

  return (
    <Link
      href="/cart"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        padding: '12px 20px',
        background: '#333',
        color: 'white',
        borderRadius: 8,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 16,
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}
    >
      🛒 Carrito
      {itemCount > 0 && (
        <span style={{
          background: '#ef4444',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12
        }}>
          {itemCount}
        </span>
      )}
    </Link>
  )
}
