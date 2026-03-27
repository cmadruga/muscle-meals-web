'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Size, MealBasic, MealWithRecipes } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros, formatMacros } from '@/lib/utils/macros'
import { toCocido } from '@/lib/utils/conversions'
import { colors } from '@/lib/theme'
import AddToCartModal from '@/components/AddToCartModal'
import CustomSizePanel from '@/components/CustomSizePanel'
import SizeSelect from '@/components/SizeSelect'

interface MealClientProps {
  meal: MealWithRecipes
  sizes: Size[]
  customerSizes?: Size[]
  suggestedMeals?: MealBasic[]
  initialSizeId?: string
}

/**
 * Client Component para ordenar meal individual
 */
export default function MealClient({ meal, sizes, customerSizes = [], suggestedMeals = [], initialSizeId }: MealClientProps) {
  const router = useRouter()
  const addToCart = useCartStore(state => state.addItem)

  const defaultSizeId = (initialSizeId && [...sizes, ...customerSizes].find(s => s.id === initialSizeId))
    ? initialSizeId
    : sizes[0]?.id || ''
  const [selectedSizeId, setSelectedSizeId] = useState(defaultSizeId)
  const [qty, setQty] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showRecipe, setShowRecipe] = useState(false)
  const [sessionSizes, setSessionSizes] = useState<Size[]>([])
  const [portionMode, setPortionMode] = useState<'crudo' | 'cocido'>('crudo')

  const allSizes = [...sizes, ...customerSizes, ...sessionSizes]
  const selectedSize = allSizes.find(s => s.id === selectedSizeId)

  const handleCustomSizeCreated = (size: Size) => {
    setSessionSizes(prev => [...prev, size])
    setSelectedSizeId(size.id)
  }

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

    // Mostrar modal de confirmación
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setQty(1) // Reset cantidad
  }

  const handleGoToCart = () => {
    setShowModal(false)
    setQty(1)
    router.push('/cart')
  }

  const handleContinueShopping = () => {
    setShowModal(false)
    setQty(1)
    router.push('/menu')
  }

  const handleMealClick = (mealId: string, sizeId?: string) => {
    setShowModal(false)
    setQty(1)
    router.push(`/meal/${mealId}${sizeId ? `?sizeId=${sizeId}` : ''}`)
  }

  return (
    <main style={{ 
      padding: '40px 24px', 
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Meal Info */}
      <div style={{ marginBottom: 32 }}>
        {meal.img ? (
          <Image
            src={meal.img}
            alt={meal.name}
            width={800}
            height={800}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 12, marginBottom: 20 }}
            priority
          />
        ) : (
          <div style={{
            width: '100%',
            height: 200,
            background: colors.grayDark,
            borderRadius: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64
          }}>
            🍽️
          </div>
        )}
        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 8,
          color: colors.orange
        }}>
          {meal.name}
        </h1>
        {meal.description && <p style={{ color: colors.textMuted }}>{meal.description}</p>}
      </div>

      {/* Size Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 12, color: colors.orange }}>
          Tamaño
        </label>
        <SizeSelect
          mainSizes={sizes.filter(s => s.is_main)}
          customerSizes={customerSizes}
          sessionSizes={sessionSizes}
          selectedId={selectedSizeId}
          onChange={setSelectedSizeId}
          formatOption={size => `${size.name} — $${(size.price / 100).toFixed(0)} MXN`}
        />

        {selectedSizeId === '__custom__' && (
          <CustomSizePanel onSizeCreated={handleCustomSizeCreated} />
        )}
      </div>

      {/* Macros + Porciones */}
      {macros && selectedSize && (
        <div style={{
          padding: 20,
          background: colors.grayDark,
          borderRadius: 12,
          border: `2px solid ${colors.grayLight}`,
          marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: colors.orange }}>
            Información Nutricional ({selectedSize.name})
          </h3>
          <p style={{ fontSize: 16, margin: '0 0 16px 0', color: colors.white }}>
            {formatMacros(macros)}
          </p>
          {selectedSize.description && (
            <p style={{ fontSize: 13, margin: '0 0 16px 0', color: colors.textMuted, fontStyle: 'italic' }}>
              {selectedSize.description}
            </p>
          )}

          {/* Separador */}
          <div style={{ borderTop: `1px solid ${colors.grayLight}`, marginBottom: 12 }} />

          {/* Porciones con toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
              Porciones
            </span>
            {/* Toggle pill */}
            <div style={{ display: 'flex', background: colors.black, borderRadius: 20, padding: 3, gap: 2, border: `1px solid ${colors.grayLight}` }}>
              <button
                onClick={() => setPortionMode('crudo')}
                style={{
                  padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer',
                  background: portionMode === 'crudo' ? colors.orange : 'transparent',
                  color: portionMode === 'crudo' ? colors.black : colors.textMuted,
                }}
              >Crudo</button>
              <button
                onClick={() => setPortionMode('cocido')}
                style={{
                  padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer',
                  background: portionMode === 'cocido' ? colors.orange : 'transparent',
                  color: portionMode === 'cocido' ? colors.black : colors.textMuted,
                }}
              >Cocido</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Proteína', raw: selectedSize.protein_qty, type: 'protein' as const },
              { label: 'Carbos',   raw: selectedSize.carb_qty,    type: 'carbs' as const },
              { label: 'Verduras', raw: selectedSize.veg_qty,     type: 'veg' as const },
            ].map(({ label, raw, type }) => {
              const grams = portionMode === 'crudo' ? raw : toCocido(raw, type)
              return (
                <div key={type} style={{
                  flex: 1,
                  background: colors.black,
                  borderRadius: 8,
                  padding: '8px 4px',
                  textAlign: 'center',
                  border: `1px solid ${colors.grayLight}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: colors.white, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: colors.orange, lineHeight: 1 }}>{grams}g</div>
                  <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 3 }}>
                    {portionMode === 'crudo' ? `≈${toCocido(raw, type)}g coc.` : `${raw}g crudo`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Botón Ver Receta */}
      <button
        onClick={() => setShowRecipe(!showRecipe)}
        style={{
          width: '100%',
          padding: '14px 20px',
          marginBottom: 16,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer',
          background: 'transparent',
          color: colors.orange,
          border: `2px solid ${colors.orange}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
      >
        <span>{showRecipe ? '▲' : '▼'}</span>
        <span>{showRecipe ? 'Ocultar ingredientes' : 'Ver ingredientes'}</span>
      </button>

      {/* Receta (colapsable) */}
      {showRecipe && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            padding: 20, 
            background: colors.grayDark, 
            borderRadius: 12,
            border: `2px solid ${colors.grayLight}`
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.white }}>{meal.mainRecipe.name}</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: colors.textSecondary }}>
              {meal.mainRecipe.ingredients.map((ing, idx) => {
                const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
                if (!ingredient) return null
                
                return (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {ingredient.name}
                  </li>
                )
              })}
            </ul>
            
            {meal.subRecipes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {meal.subRecipes.map((subRecipe, subIdx) => (
                  <div key={subIdx}>
                    <h4 style={{ marginBottom: 8, color: colors.white }}>{subRecipe.name}</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: colors.textSecondary }}>
                      {subRecipe.ingredients.map((ing, idx) => {
                        const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
                        if (!ingredient) return null
                        
                        return (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            {ingredient.name}
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
      )}

      {/* Modal de confirmación */}
      <AddToCartModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onGoToCart={handleGoToCart}
        onContinueShopping={handleContinueShopping}
        title="¡Agregado al carrito!"
        message={`${qty} x ${meal.name} (${selectedSize?.name})`}
        suggestedMeals={suggestedMeals}
        selectedSize={selectedSize}
        onMealClick={handleMealClick}
      />

      {/* Quantity */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 12, color: colors.orange }}>
          Cantidad
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            style={{ 
              width: 44, 
              height: 44, 
              fontSize: 20,
              border: `1px solid ${colors.grayLight}`,
              borderRadius: 8,
              background: colors.grayLight,
              color: colors.white,
              cursor: 'pointer'
            }}
          >
            −
          </button>
          <span style={{ fontSize: 20, fontWeight: 'bold', minWidth: 40, textAlign: 'center', color: colors.white }}>
            {qty}
          </span>
          <button
            onClick={() => setQty(q => q + 1)}
            style={{ 
              width: 44, 
              height: 44,
              fontSize: 20,
              border: `1px solid ${colors.grayLight}`,
              borderRadius: 8,
              background: colors.grayLight,
              color: colors.white,
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
      </div>

      </div>
      {/* Total & Submit */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0, 
        background: colors.grayDark,
        padding: '20px 24px',
        borderTop: `2px solid ${colors.grayLight}`
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: colors.white }}>Total:</span>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>${(totalPrice / 100).toFixed(0)} MXN</span>
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
            background: colors.orange,
            color: colors.black,
            border: 'none',
            borderRadius: 8,
            textTransform: 'uppercase'
          }}
        >
          🛒 Agregar al carrito
        </button>
        </div>
      </div>
    </main>
  )
}
