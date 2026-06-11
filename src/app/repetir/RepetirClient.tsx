'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'
import { colors } from '@/lib/theme'
import Link from 'next/link'

interface Props {
  items: CartItem[] | null
  orderDate: string | null
  orderNumber: string | null
}

export default function RepetirClient({ items, orderDate, orderNumber }: Props) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()

  const handleRepetir = () => {
    if (!items) return
    clearCart()
    items.forEach(item => addItem(item))
    router.push('/carrito')
  }

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <main style={{
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ color: colors.orange }}>Volver</span> a pedir
        </h1>

        {!items ? (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ color: colors.textMuted, fontSize: 15, marginBottom: 24 }}>
              Aún no tienes pedidos anteriores.
            </p>
            <Link
              href="/menu"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Ver menú →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28 }}>
              Tu último pedido{orderNumber ? ` · ${orderNumber}` : ''}{formattedDate ? ` · ${formattedDate}` : ''}
            </p>

            <div style={{
              background: colors.grayDark,
              border: `1px solid ${colors.grayLight}`,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 24,
            }}>
              {items.map((item, i) => (
                <div
                  key={`${item.mealId}-${item.sizeId}-${i}`}
                  style={{
                    padding: '14px 18px',
                    borderBottom: i < items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 15, color: colors.white, fontWeight: 500 }}>
                      {item.mealName}
                    </span>
                    <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>
                      {item.sizeName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>×{item.qty}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>
                      ${(item.unitPrice * item.qty / 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRepetir}
              style={{
                width: '100%',
                padding: '16px',
                background: colors.orange,
                color: colors.white,
                border: 'none',
                borderRadius: 10,
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Pedir de nuevo →
            </button>

            <p style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              Se reemplazará tu carrito actual con este pedido
            </p>
          </>
        )}
      </div>
    </main>
  )
}
