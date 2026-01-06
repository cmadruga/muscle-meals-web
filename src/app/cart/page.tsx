'use client'

import { useCartStore } from '@/lib/store/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { createOrder } from '@/lib/db/orders'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQty, clearCart, getTotal } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      const order = await createOrder(
        {
          total_amount: getTotal(),
          status: 'pending'
        },
        items.map(item => ({
          meal_id: item.mealId,
          size_id: item.sizeId,
          qty: item.qty,
          unit_price: item.unitPrice,
          package_id: item.packageId
        }))
      )

      // Navegar primero
      router.push(`/checkout/${order.id}`)
      
      // Limpiar carrito después de un pequeño delay para evitar flash
      setTimeout(() => clearCart(), 100)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la orden')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main style={{ padding: 40, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h1>🛒 Carrito vacío</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Agrega comidas o paquetes para comenzar tu orden
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#333',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Ver menú
        </Link>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>

			{/* Back Button */}
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 24,
          padding: '8px 16px',
          fontSize: 14,
          border: '1px solid #ccc',
          borderRadius: 8,
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        ← Regresar
      </button>

      <h1>🛒 Tu Carrito</h1>

      {error && (
        <div style={{
          color: 'white',
          background: '#ef4444',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {/* Items */}
      <div style={{ marginBottom: 32 }}>
        {items.map((item, idx) => (
          <div
            key={`${item.mealId}-${item.sizeId}`}
            style={{
              padding: 16,
              borderBottom: idx < items.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>
                {item.mealName}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                {item.sizeName}
                {item.packageId && <span style={{ marginLeft: 8 }}>(Paquete)</span>}
              </p>
            </div>

            {/* Quantity controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => updateQty(item.mealId, item.sizeId, item.qty - 1)}
                style={{
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                −
              </button>
              <span style={{ fontWeight: 'bold', minWidth: 24, textAlign: 'center' }}>
                {item.qty}
              </span>
              <button
                onClick={() => updateQty(item.mealId, item.sizeId, item.qty + 1)}
                style={{
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>

            <div style={{ textAlign: 'right', minWidth: 100 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#666' }}>
                ${(item.unitPrice / 100).toFixed(0)} c/u
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
                ${((item.unitPrice * item.qty) / 100).toFixed(0)} MXN
              </p>
            </div>

            <button
              onClick={() => removeItem(item.mealId, item.sizeId)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ef4444',
                borderRadius: 8,
                background: 'white',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>Total:</span>
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>
            ${(getTotal() / 100).toFixed(0)} MXN
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 16 }}>
        <button
          onClick={() => clearCart()}
          style={{
            flex: 1,
            padding: '16px 24px',
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Vaciar carrito
        </button>
        <button
          onClick={handleCheckout}
          disabled={isSubmitting}
          style={{
            flex: 2,
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1,
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: 8
          }}
        >
          {isSubmitting ? 'Procesando...' : 'Continuar al pago'}
        </button>
      </div>
    </main>
  )
}
