'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { updateOrderStatus, getOrderWithItems } from '@/lib/db/orders'
import type { OrderWithItems } from '@/lib/types'

function OrderSuccessContent() {
  const clearCart = useCartStore(state => state.clearCart)
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Conekta envía su propio order_id, pero nuestro UUID está en metadata
        // Necesitamos obtener el metadata de Conekta primero
        // Por ahora, usaremos el parámetro que nosotros agreguemos manualmente
        const ourOrderId = searchParams.get('our_order_id')
        
        if (ourOrderId) {
          // Actualizar status de la orden a 'paid'
          await updateOrderStatus(ourOrderId, 'paid')
          
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 48
        }}>
          ✓
        </div>

        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 16,
          color: '#1f2937'
        }}>
          ¡Pago exitoso!
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: '#6b7280',
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Tu orden ha sido confirmada. Recibirás un email con los detalles de tu pedido.
        </p>

        {loading && (
          <div style={{
            padding: 24,
            background: '#f3f4f6',
            borderRadius: 8,
            marginBottom: 32
          }}>
            <p style={{ margin: 0, color: '#6b7280' }}>Cargando detalles...</p>
          </div>
        )}

        {!loading && order && (
          <div style={{
            padding: 24,
            background: '#f3f4f6',
            borderRadius: 8,
            marginBottom: 32,
            textAlign: 'left'
          }}>
            <h2 style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              marginBottom: 16,
              color: '#1f2937'
            }}>
              Resumen de tu orden
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ 
                fontSize: 14, 
                color: '#6b7280',
                margin: '0 0 4px 0'
              }}>
                <strong>ID de orden:</strong> {order.id}
              </p>
              <p style={{ 
                fontSize: 14, 
                color: '#6b7280',
                margin: '0 0 4px 0'
              }}>
                <strong>Estado:</strong> {order.status === 'paid' ? 'Pagado ✓' : order.status}
              </p>
            </div>

            <div style={{
              borderTop: '1px solid #d1d5db',
              paddingTop: 16,
              marginBottom: 16
            }}>
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 12,
                color: '#1f2937'
              }}>
                Items ({order.items.length})
              </h3>
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '8px 0',
                    borderBottom: idx < order.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 14,
                    color: '#4b5563'
                  }}
                >
                  <span>x{item.qty}</span>
                  <span>${(item.unit_price * item.qty / 100).toFixed(0)} MXN</span>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '2px solid #d1d5db',
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                Total:
              </span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                ${(order.total_amount / 100).toFixed(0)} MXN
              </span>
            </div>
          </div>
        )}

        {!loading && !order && (
          <div style={{
            padding: 16,
            background: '#f3f4f6',
            borderRadius: 8,
            marginBottom: 32
          }}>
            <p style={{ 
              fontSize: 14, 
              color: '#6b7280',
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
              padding: '12px 24px',
              background: '#333',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16
            }}
          >
            Volver al inicio
          </Link>

          <Link
            href="/cart"
            style={{
              display: 'block',
              padding: '12px 24px',
              background: 'transparent',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              border: '2px solid #667eea'
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          maxWidth: 500,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <p style={{ fontSize: 18, color: '#6b7280' }}>Cargando...</p>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
