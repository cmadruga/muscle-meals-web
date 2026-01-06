'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Package, Size } from '@/lib/types'
import type { MealWithRecipes } from '@/lib/db/meals'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros, formatMacros } from '@/lib/utils/macros'

interface PackageClientProps {
  pkg: Package
  meals: MealWithRecipes[]
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
  const addToCart = useCartStore(state => state.addItem)
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '')
  const [selection, setSelection] = useState<SelectionItem[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const selectedSize = sizes.find(s => s.id === selectedSizeId)
  
  // Total de comidas seleccionadas
  const totalSelected = useMemo(
    () => selection.reduce((sum, item) => sum + item.qty, 0),
    [selection]
  )

  // Precio total del paquete
  const totalPrice = selectedSize ? selectedSize.package_price * pkg.meals_included : 0

  const canSubmit = totalSelected === pkg.meals_included && selectedSize

  // Agregar meal
  const handleAdd = (meal: MealWithRecipes) => {
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

  // Agregar paquete al carrito
  const handleAddToCart = () => {
    if (!canSubmit || !selectedSize) return

    // Cada meal seleccionado se agrega individualmente con package_id
    selection.forEach(item => {
      addToCart({
        mealId: item.mealId,
        mealName: item.mealName,
        sizeId: selectedSize.id,
        sizeName: selectedSize.name,
        qty: item.qty,
        unitPrice: selectedSize.package_price,
        packageId: pkg.id
      })
    })

    // Mostrar mensaje de éxito
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setSelection([]) // Limpiar selección
    }, 2000)
  }

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
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

      <h1>{pkg.name}</h1>
      {pkg.description && <p style={{ color: '#666' }}>{pkg.description}</p>}

      {showSuccess && (
        <div style={{ 
          color: 'white', 
          background: '#10b981',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16 
        }}>
          ✓ Paquete agregado al carrito
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
            
            // Calcular macros para este meal con el size seleccionado
            let macros = null
            if (selectedSize) {
              const ingredientsMap = new Map(meal.ingredients.map(i => [i.id, i]))
              macros = calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, selectedSize)
            }
            
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
                  <Image 
                    src={meal.img} 
                    alt={meal.name}
                    width={280}
                    height={120}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                  />
                )}
                <h4 style={{ margin: '8px 0' }}>{meal.name}</h4>
                {meal.description && (
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{meal.description}</p>
                )}
                
                {/* Macros */}
                {macros && (
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    {formatMacros(macros)}
                  </p>
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
          onClick={handleAddToCart}
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
          {totalSelected < pkg.meals_included 
            ? `Selecciona ${pkg.meals_included - totalSelected} más`
            : '🛒 Agregar al carrito'
          }
        </button>
      </div>
    </main>
  )
}
