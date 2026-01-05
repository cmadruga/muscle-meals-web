'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Meal, Size } from '@/lib/types'
import { createOrder } from '@/lib/db/orders'

interface MealClientProps {
  meal: Meal
  sizes: Size[]
}

/**
 * Client Component para ordenar meal individual
 */
export default function MealClient({ meal, sizes }: MealClientProps) {
  const router = useRouter()
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '')
  const [qty, setQty] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSize = sizes.find(s => s.id === selectedSizeId)
  const totalPrice = selectedSize ? selectedSize.price * qty : 0

  const handleSubmit = async () => {
    if (!selectedSize) return

    setIsSubmitting(true)
    setError(null)

    try {
      const order = await createOrder(
        {
          total_amount: totalPrice,
          status: 'pending'
        },
        [{
          meal_id: meal.id,
          size_id: selectedSize.id,
          qty: qty,
          unit_price: selectedSize.price
        }]
      )

      router.push(`/checkout/${order.id}`)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la orden')
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      {/* Meal Info */}
      <div style={{ marginBottom: 32 }}>
        {meal.img && (
          <img 
            src={meal.img} 
            alt={meal.name}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
        )}
        <h1>{meal.name}</h1>
        {meal.description && <p style={{ color: '#666' }}>{meal.description}</p>}
      </div>

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

      {/* Size Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          Tamaño
        </label>
        <select
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc'
          }}
        >
          {sizes.map(size => (
            <option key={size.id} value={size.id}>
              {size.name} - ${(size.price / 100).toFixed(0)} MXN
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          Cantidad
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            style={{ 
              width: 40, 
              height: 40, 
              fontSize: 20,
              border: '1px solid #ccc',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            −
          </button>
          <span style={{ fontSize: 20, fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
            {qty}
          </span>
          <button
            onClick={() => setQty(q => q + 1)}
            style={{ 
              width: 40, 
              height: 40, 
              fontSize: 20,
              border: '1px solid #ccc',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Total & Submit */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0, 
        background: 'white',
        padding: '16px 0',
        borderTop: '1px solid #ccc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>Total:</span>
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>${(totalPrice / 100).toFixed(0)} MXN</span>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedSize}
          style={{
            width: '100%',
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
          {isSubmitting ? 'Creando orden...' : 'Ordenar ahora'}
        </button>
      </div>
    </main>
  )
}
