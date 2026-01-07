'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { Package, Size } from '@/lib/types'
import type { MealWithRecipes } from '@/lib/db/meals'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros, formatMacros } from '@/lib/utils/macros'
import { colors } from '@/lib/theme'

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

    // Generar un ID único para esta instancia del paquete
    const packageInstanceId = `pkg_${crypto.randomUUID()}`

    // Cada meal seleccionado se agrega individualmente con packageInstanceId
    selection.forEach(item => {
      addToCart({
        mealId: item.mealId,
        mealName: item.mealName,
        sizeId: selectedSize.id,
        sizeName: selectedSize.name,
        qty: item.qty,
        unitPrice: selectedSize.package_price,
        packageId: pkg.id, // ID del paquete en la DB (para metadata/orden)
        packageName: pkg.name, // Nombre del paquete
        packageInstanceId // ID único de esta instancia en el carrito
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
    <main style={{ 
      padding: '40px 24px', 
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: 36, 
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 2
      }}>
        📦 <span style={{ color: colors.orange }}>{pkg.name}</span>
      </h1>
      {pkg.description && <p style={{ color: colors.textMuted, marginBottom: 24 }}>{pkg.description}</p>}

      {showSuccess && (
        <div style={{ 
          color: colors.black, 
          background: colors.orange,
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          fontWeight: 'bold'
        }}>
          ✓ Paquete agregado al carrito
        </div>
      )}

      {/* Size Selector */}
      <div style={{ 
        marginTop: 24, 
        marginBottom: 24, 
        padding: 20, 
        background: colors.grayDark, 
        borderRadius: 12,
        border: `2px solid ${colors.grayLight}`
      }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 12, color: colors.orange }}>
          1. Selecciona tamaño
        </label>
        <select
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: `2px solid ${colors.grayLight}`,
            background: colors.grayLight,
            color: colors.white
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
        <h3 style={{ color: colors.orange, marginBottom: 8 }}>
          2. Selecciona tus {pkg.meals_included} comidas
        </h3>
        <p style={{ color: colors.textMuted, marginBottom: 20 }}>
          Seleccionadas: <strong style={{ color: colors.white }}>{totalSelected} / {pkg.meals_included}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
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
                  border: qty > 0 ? `2px solid ${colors.orange}` : `2px solid ${colors.grayLight}`,
                  borderRadius: 12,
                  padding: 16,
                  background: qty > 0 ? colors.grayLight : colors.grayDark
                }}
              >
                {meal.img ? (
                  <Image 
                    src={meal.img} 
                    alt={meal.name}
                    width={280}
                    height={120}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: 120,
                    background: colors.black,
                    borderRadius: 8,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}>
                    🍽️
                  </div>
                )}
                <h4 style={{ margin: '8px 0', color: colors.orange }}>{meal.name}</h4>
                {meal.description && (
                  <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 8 }}>{meal.description}</p>
                )}
                
                {/* Macros */}
                {macros && (
                  <p style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 12 }}>
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
                      border: `1px solid ${colors.grayLight}`,
                      borderRadius: 8,
                      background: colors.grayLight,
                      color: colors.white,
                      cursor: qty === 0 ? 'not-allowed' : 'pointer',
                      opacity: qty === 0 ? 0.5 : 1
                    }}
                  >
                    −
                  </button>

                  <span style={{ fontWeight: 'bold', minWidth: 24, textAlign: 'center', color: colors.white }}>
                    {qty}
                  </span>

                  <button
                    onClick={() => handleAdd(meal)}
                    disabled={totalSelected >= pkg.meals_included}
                    style={{ 
                      width: 36, 
                      height: 36,
                      fontSize: 18,
                      border: `1px solid ${colors.grayLight}`,
                      borderRadius: 8,
                      background: colors.grayLight,
                      color: colors.white,
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

      </div>
      {/* Summary & Submit */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0, 
        background: colors.grayDark,
        padding: '20px 24px',
        borderTop: `2px solid ${colors.grayLight}`
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {selection.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 14, color: colors.textMuted }}>
            <strong style={{ color: colors.orange }}>Tu selección:</strong>{' '}
            {selection.map(s => `${s.mealName} x${s.qty}`).join(', ')}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: colors.white }}>
            Total ({selectedSize?.name || ''}):
          </span>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
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
            background: canSubmit ? colors.orange : colors.grayLight,
            color: canSubmit ? colors.black : colors.textMuted,
            border: 'none',
            borderRadius: 8,
            textTransform: 'uppercase'
          }}
        >
          {totalSelected < pkg.meals_included 
            ? `Selecciona ${pkg.meals_included - totalSelected} más`
            : '🛒 Agregar al carrito'
          }
        </button>
        </div>
      </div>
    </main>
  )
}
