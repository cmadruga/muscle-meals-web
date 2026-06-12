'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup } from './page'
import { colors } from '@/lib/theme'
import Link from 'next/link'

interface Props {
  packages: PackageGroup[]
  individuals: CartItem[]
  orderDate: string | null
  orderNumber: string | null
}

export default function RepetirClient({ packages, individuals, orderDate, orderNumber }: Props) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()

  const hasItems = packages.length > 0 || individuals.length > 0

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const handleRepetir = () => {
    clearCart()
    packages.forEach(pkg => pkg.items.forEach(item => addItem(item)))
    individuals.forEach(item => addItem(item))
    router.push('/cart')
  }

  const totalItems =
    packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.qty, 0)

  const totalPrice =
    packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.unitPrice * i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.unitPrice * i.qty, 0)

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
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Header */}
        <h1 className="franchise-stroke" style={{
          fontFamily: 'Franchise, sans-serif',
          fontSize: 42,
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          <span style={{ color: colors.orange }}>Volver</span> a pedir
        </h1>

        {!hasItems ? (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ color: colors.textMuted, fontSize: 15, marginBottom: 24 }}>
              Aún no tienes pedidos anteriores.
            </p>
            <Link
              href="/menu"
              className="franchise-stroke"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 20,
                letterSpacing: 0,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Ver menú →
            </Link>
          </div>
        ) : (
          <>
            {/* Subtitle */}
            <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28 }}>
              {formattedDate
                ? `Repite tu pedido del ${formattedDate}`
                : 'Tu último pedido'}
              {orderNumber && (
                <span style={{ color: colors.grayLight, marginLeft: 8, fontSize: 12 }}>
                  {orderNumber}
                </span>
              )}
            </p>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>

              {/* Paquetes */}
              {packages.map((pkg, pi) => (
                <div key={pkg.instanceId} style={{
                  background: colors.grayDark,
                  border: `1px solid ${colors.orange}44`,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 16px',
                    background: colors.orange + '18',
                    borderBottom: `1px solid ${colors.orange}33`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ color: colors.orange, fontWeight: 700, fontSize: 13 }}>
                      Paquete {packages.length > 1 ? pi + 1 : ''} · {pkg.items.length} comidas
                    </span>
                    <span style={{ color: colors.white, fontWeight: 600, fontSize: 13 }}>
                      ${(pkg.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) / 100).toFixed(0)} MXN
                    </span>
                  </div>
                  {pkg.items.map((item, i) => (
                    <div key={`${item.mealId}-${i}`} style={{
                      padding: '11px 16px',
                      borderBottom: i < pkg.items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <span style={{ fontSize: 14, color: colors.white }}>{item.mealName}</span>
                      <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>
                        {item.sizeName}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Individuales */}
              {individuals.length > 0 && (
                <div style={{
                  background: colors.grayDark,
                  border: `1px solid ${colors.grayLight}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {packages.length > 0 && (
                    <div style={{
                      padding: '8px 16px',
                      borderBottom: `1px solid ${colors.grayLight}`,
                      color: colors.textMuted,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Individual
                    </div>
                  )}
                  {individuals.map((item, i) => (
                    <div key={`${item.mealId}-${item.sizeId}-${i}`} style={{
                      padding: '12px 16px',
                      borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <div>
                        <span style={{ fontSize: 14, color: colors.white }}>{item.mealName}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{item.sizeName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.white }}>
                          ${(item.unitPrice * item.qty / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: `1px solid ${colors.grayLight}`,
              marginBottom: 20,
            }}>
              <span style={{ color: colors.textMuted, fontSize: 14 }}>{totalItems} comidas</span>
              <span style={{ color: colors.white, fontWeight: 700, fontSize: 18 }}>
                ${(totalPrice / 100).toFixed(0)} MXN
              </span>
            </div>

            {/* Botón */}
            <button
              onClick={handleRepetir}
              className="franchise-stroke"
              style={{
                width: '100%',
                padding: '16px',
                background: colors.orange,
                color: colors.white,
                border: 'none',
                borderRadius: 8,
                fontFamily: 'Franchise, sans-serif',
                fontSize: 22,
                letterSpacing: 0,
                lineHeight: 1,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Volver a pedir →
            </button>
          </>
        )}
      </div>
    </main>
  )
}
