'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Package, Meal, Size, CreateOrderItemData } from '@/lib/types'
import { createOrder } from '@/lib/db/orders'

interface PackageClientProps {
  pkg: Package
  meals: Meal[]
  sizes: Size[]
}

interface SelectionItem {
  mealId: string
  mealName: string
  qty: number
}

/**
 * Client Component para armar un paquete
 * 1. Selecciona size
 * 2. Selecciona N meals
 * 3. Crea orden
 */
export default function PackageClient({ pkg, meals, sizes }: PackageClientProps) {
  const router = useRouter()
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '')
  const [selection, setSelection] = useState<SelectionItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSize = sizes.find(s => s.id === selectedSizeId)
  
  // Total de comidas seleccionadas
  const totalSelected = useMemo(
    () => selection.reduce((sum, item) => sum + item.qty, 0),
    [selection]
  )

  // Precio total del paquete
  const totalPrice = selectedSize ? selectedSize.package_price * pkg.meals_included : 0

  const canSubmit = totalSelected === pkg.meals_included && !isSubmitting && selectedSize

  // Agregar meal
  const handleAdd = (meal: Meal) => {
    if (totalSelected >= pkg.meals_included) return

    setSelection(prev => {
      const existing = prev.find(item => item.mealId === meal.id)

      if (existing) {
        return prev.map(item =>
          item.mealId === meal.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }

      return [...prev, { mealId: meal.id, mealName: meal.name, qty: 1 }]
    })
  }

  // Remover meal
  const handleRemove = (mealId: string) => {
    setSelection(prev => {
      const updated = prev.map(item =>
        item.mealId === mealId
          ? { ...item, qty: item.qty - 1 }
          : item
      )
      return updated.filter(item => item.qty > 0)
    })
  }

  // Obtener cantidad de un meal
  const getQty = (mealId: string) => {
    const item = selection.find(s => s.mealId === mealId)
    return item?.qty || 0
  }

  // Crear orden
  const handleSubmit = async () => {
    if (!canSubmit || !selectedSize) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Cada meal seleccionado es un order_item
      const orderItems: CreateOrderItemData[] = selection.map(item => ({
        meal_id: item.mealId,
        size_id: selectedSize.id,
        qty: item.qty,
        unit_price: selectedSize.package_price,
        package_id: pkg.id
      }))

      const order = await createOrder(
        {
          total_amount: totalPrice,
          status: 'pending'
        },
        orderItems
      )

      router.push(`/checkout/${order.id}`)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la orden')
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <h1>{pkg.name}</h1>
      {pkg.description && <p style={{ color: '#666' }}>{pkg.description}</p>}

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
      <div style={{ marginTop: 24, marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          1. Selecciona tamaño
        </label>
        <select
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc'
          }}
        >
          {sizes.map(size => (
            <option key={size.id} value={size.id}>
              {size.name} - ${(size.package_price * pkg.meals_included / 100).toFixed(0)} MXN ({pkg.meals_included} comidas)
            </option>
          ))}
        </select>
      </div>

      {/* Meals Selection */}
      <div style={{ marginBottom: 24 }}>
        <h3>2. Selecciona tus {pkg.meals_included} comidas</h3>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Seleccionadas: <strong>{totalSelected} / {pkg.meals_included}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {meals.map(meal => {
            const qty = getQty(meal.id)
            return (
              <div 
                key={meal.id}
                style={{
                  border: qty > 0 ? '2px solid #333' : '1px solid #ccc',
                  borderRadius: 8,
                  padding: 16,
                  background: qty > 0 ? '#f9f9f9' : 'white'
                }}
              >
                {meal.img && (
                  <img 
                    src={meal.img} 
                    alt={meal.name}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                  />
                )}
                <h4 style={{ margin: '8px 0' }}>{meal.name}</h4>
                {meal.description && (
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>{meal.description}</p>
                )}

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => handleRemove(meal.id)}
                    disabled={qty === 0}
                    style={{ 
                      width: 36, 
                      height: 36,
                      fontSize: 18,
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      background: 'white',
                      cursor: qty === 0 ? 'not-allowed' : 'pointer',
                      opacity: qty === 0 ? 0.5 : 1
                    }}
                  >
                    −
                  </button>

                  <span style={{ fontWeight: 'bold', minWidth: 24, textAlign: 'center' }}>
                    {qty}
                  </span>

                  <button
                    onClick={() => handleAdd(meal)}
                    disabled={totalSelected >= pkg.meals_included}
                    style={{ 
                      width: 36, 
                      height: 36,
                      fontSize: 18,
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      background: 'white',
                      cursor: totalSelected >= pkg.meals_included ? 'not-allowed' : 'pointer',
                      opacity: totalSelected >= pkg.meals_included ? 0.5 : 1
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary & Submit */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0, 
        background: 'white',
        padding: '16px 0',
        borderTop: '1px solid #ccc'
      }}>
        {selection.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
            <strong>Tu selección:</strong>{' '}
            {selection.map(s => `${s.mealName} x${s.qty}`).join(', ')}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>
            Total ({selectedSize?.name || ''}):
          </span>
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>
            ${(totalPrice / 100).toFixed(0)} MXN
          </span>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 'bold',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
            background: canSubmit ? '#333' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 8
          }}
        >
          {isSubmitting 
            ? 'Creando orden...' 
            : totalSelected < pkg.meals_included 
              ? `Selecciona ${pkg.meals_included - totalSelected} más`
              : 'Continuar al pago'
          }
        </button>
      </div>
    </main>
  )
}
