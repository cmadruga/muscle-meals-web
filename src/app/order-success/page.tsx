'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { updateOrderStatus, updateConektaOrderId, getOrderWithItems } from '@/lib/db/orders'
import type { OrderWithItems } from '@/lib/types'
import { colors } from '@/lib/theme'

function OrderSuccessContent() {
  const clearCart = useCartStore(state => state.clearCart)
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Conekta envía el order_id en la URL
        const conektaId = searchParams.get('order_id')
        
        // Nuestro order_id está en el parámetro our_order_id
        const ourOrderId = searchParams.get('our_order_id')
        
        if (ourOrderId) {
          // Actualizar status de la orden a 'paid'
          await updateOrderStatus(ourOrderId, 'paid')
          
          // Guardar el ID de Conekta si lo tenemos
          if (conektaId) {
            await updateConektaOrderId(ourOrderId, conektaId)
          }
          
          // Obtener los detalles de la orden
          const orderData = await getOrderWithItems(ourOrderId)
          setOrder(orderData)
        }
        
        // Limpiar carrito cuando el pago fue exitoso
        clearCart()
      } catch (error) {
        console.error('Error processing payment success:', error)
      } finally {
        setLoading(false)
      }
    }

    processPayment()
  }, [clearCart, searchParams])

  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: colors.black
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: colors.grayDark,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 16,
        padding: 48,
        textAlign: 'center'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: colors.orange,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 48,
          color: colors.black
        }}>
          ✓
        </div>

        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 16,
          color: colors.orange,
          textTransform: 'uppercase'
        }}>
          ¡Pago exitoso!
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: colors.textMuted,
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Tu orden ha sido confirmada. Recibirás un email con los detalles de tu pedido.
        </p>

        {loading && (
          <div style={{
            padding: 24,
            background: colors.grayLight,
            borderRadius: 8,
            marginBottom: 32
          }}>
            <p style={{ margin: 0, color: colors.textMuted }}>Cargando detalles...</p>
          </div>
        )}

        {!loading && order && (
          <div style={{
            padding: 24,
            background: colors.grayLight,
            borderRadius: 8,
            marginBottom: 32,
            textAlign: 'left'
          }}>
            <h2 style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              marginBottom: 16,
              color: colors.orange
            }}>
              Resumen de tu orden
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ 
                fontSize: 14, 
                color: colors.textMuted,
                margin: '0 0 4px 0'
              }}>
                <strong style={{ color: colors.white }}>ID de orden:</strong> {order.order_number}
              </p>
              <p style={{ 
                fontSize: 14, 
                color: colors.textMuted,
                margin: '0 0 4px 0'
              }}>
                <strong style={{ color: colors.white }}>Estado:</strong> {order.status === 'paid' ? 'Pagado ✓' : order.status}
              </p>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.grayDark}`,
              paddingTop: 16,
              marginBottom: 16
            }}>
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 12,
                color: colors.white
              }}>
                Items ({order.items.length})
              </h3>
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '8px 0',
                    borderBottom: idx < order.items.length - 1 ? `1px solid ${colors.grayDark}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 14,
                    color: colors.textMuted
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: colors.white, marginBottom: 2 }}>
                      {item.meal_name || 'Platillo'}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      {item.size_name && `${item.size_name} · `}x{item.qty}
                    </div>
                  </div>
                  <span style={{ fontWeight: 'bold', color: colors.white }}>
                    ${(item.unit_price * item.qty / 100).toFixed(0)} MXN
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: `2px solid ${colors.orange}`,
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>
                Total:
              </span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: colors.orange }}>
                ${(order.total_amount / 100).toFixed(0)} MXN
              </span>
            </div>
          </div>
        )}

        {!loading && !order && (
          <div style={{
            padding: 16,
            background: colors.grayLight,
            borderRadius: 8,
            marginBottom: 32
          }}>
            <p style={{ 
              fontSize: 14, 
              color: colors.textMuted,
              margin: 0
            }}>
              Revisa tu correo para ver el estado de tu pedido y los próximos pasos.
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          flexDirection: 'column'
        }}>
          <Link
            href="/"
            style={{
              display: 'block',
              padding: '14px 24px',
              background: colors.orange,
              color: colors.black,
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              textTransform: 'uppercase'
            }}
          >
            Volver al inicio
          </Link>

          <Link
            href="/menu"
            style={{
              display: 'block',
              padding: '14px 24px',
              background: 'transparent',
              color: colors.orange,
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              border: `2px solid ${colors.orange}`
            }}
          >
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
      <main style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: colors.black
      }}>
        <div style={{
          maxWidth: 500,
          width: '100%',
          background: colors.grayDark,
          borderRadius: 16,
          padding: 48,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 18, color: colors.textMuted }}>Cargando...</p>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
