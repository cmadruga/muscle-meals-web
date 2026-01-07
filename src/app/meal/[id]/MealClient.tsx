'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { Size } from '@/lib/types'
import type { MealWithRecipes } from '@/lib/db/meals'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros, formatMacros } from '@/lib/utils/macros'

interface MealClientProps {
  meal: MealWithRecipes
  sizes: Size[]
}

/**
 * Client Component para ordenar meal individual
 */
export default function MealClient({ meal, sizes }: MealClientProps) {
  const addToCart = useCartStore(state => state.addItem)
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '')
  const [qty, setQty] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  const selectedSize = sizes.find(s => s.id === selectedSizeId)

  // Calcular macros según size seleccionado
  const macros = useMemo(() => {
    if (!selectedSize) return null
    
    const ingredientsMap = new Map(meal.ingredients.map(i => [i.id, i]))
    return calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, selectedSize)
  }, [meal, selectedSize])

  const totalPrice = selectedSize ? selectedSize.price * qty : 0

  const handleAddToCart = () => {
    if (!selectedSize) return

    addToCart({
      mealId: meal.id,
      mealName: meal.name,
      sizeId: selectedSize.id,
      sizeName: selectedSize.name,
      qty: qty,
      unitPrice: selectedSize.price
    })

    // Mostrar mensaje de éxito
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      {/* Meal Info */}
      <div style={{ marginBottom: 32 }}>
        {meal.img && (
          <Image 
            src={meal.img} 
            alt={meal.name}
            width={800}
            height={300}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            priority
          />
        )}
        <h1>{meal.name}</h1>
        {meal.description && <p style={{ color: '#666' }}>{meal.description}</p>}
      </div>

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

      {/* Macros */}
      {macros && (
        <div style={{ 
          padding: 16, 
          background: '#f5f5f5', 
          borderRadius: 8,
          marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0 }}>Información Nutricional ({selectedSize?.name})</h3>
          <p style={{ fontSize: 16, margin: 0, color: '#333' }}>
            {formatMacros(macros)}
          </p>
        </div>
      )}

      {/* Receta */}
      <div style={{ marginBottom: 32 }}>
        <h3>Receta</h3>
        <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>{meal.mainRecipe.name}</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {meal.mainRecipe.ingredients.map((ing, idx) => {
              const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
              if (!ingredient) return null
              
              // Mostrar cantidad ajustada por size si aplica
              let displayQty = ing.qty
              if (selectedSize) {
                if (ingredient.type === 'pro') displayQty = selectedSize.protein_qty
                else if (ingredient.type === 'carb') displayQty = selectedSize.carb_qty
                else if (ingredient.type === 'veg') displayQty = selectedSize.veg_qty
              }
              
              return (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {ingredient.name} - {displayQty}{ing.unit}
                </li>
              )
            })}
          </ul>
          
          {meal.subRecipes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {meal.subRecipes.map((subRecipe, subIdx) => (
                <div key={subIdx}>
                  <h4 style={{ marginBottom: 8 }}>{subRecipe.name}</h4>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {subRecipe.ingredients.map((ing, idx) => {
                      const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
                      if (!ingredient) return null
                      
                      return (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {ingredient.name} - {ing.qty}{ing.unit}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div style={{ 
          color: 'white', 
          background: '#10b981',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16 
        }}>
          ✓ Agregado al carrito
        </div>
      )}

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
          onClick={handleAddToCart}
          disabled={!selectedSize}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 'bold',
            cursor: !selectedSize ? 'not-allowed' : 'pointer',
            opacity: !selectedSize ? 0.5 : 1,
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: 8
          }}
        >
          🛒 Agregar al carrito
        </button>
      </div>
    </main>
  )
}
