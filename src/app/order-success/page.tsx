'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { colors } from '@/lib/theme'

function OrderSuccessContent() {
  const clearCart = useCartStore(state => state.clearCart)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('our_order_id')

  useEffect(() => {
    // El webhook ya marcó la orden como pagada — solo limpiamos el carrito
    clearCart()
  }, [clearCart])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: colors.black,
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: colors.grayDark,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: colors.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 48, color: colors.black,
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: 32, marginBottom: 16, color: colors.orange, textTransform: 'uppercase' }}>
          ¡Pago exitoso!
        </h1>

        <p style={{ fontSize: 18, color: colors.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
          Tu pedido fue confirmado. Recibirás un WhatsApp con los detalles en breve.
        </p>

        {orderId && (
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 32 }}>
            Referencia: <span style={{ color: colors.white, fontFamily: 'monospace' }}>
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <Link href="/" style={{
            display: 'block', padding: '14px 24px',
            background: colors.orange, color: colors.black,
            textDecoration: 'none', borderRadius: 8,
            fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase',
          }}>
            Volver al inicio
          </Link>
          <Link href="/menu" style={{
            display: 'block', padding: '14px 24px',
            background: 'transparent', color: colors.orange,
            textDecoration: 'none', borderRadius: 8,
            fontWeight: 'bold', fontSize: 16,
            border: `2px solid ${colors.orange}`,
          }}>
            Hacer otro pedido
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.black }}>
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
