'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Size, MealBasic, MealWithRecipes } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros, formatMacros } from '@/lib/utils/macros'
// import { toCocido } from '@/lib/utils/conversions' // reservado para toggle crudo/cocido
import { calculateCustomSizePrice, CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'
import { colors } from '@/lib/theme'

function calcMealPrice(meal: MealWithRecipes, customSize: Size, fitSize: Size | undefined): number {
  let proIngId: string | null = null
  let carbIngId: string | null = null
  for (const ing of meal.ingredients) {
    if (ing.type === 'pro' && !proIngId) proIngId = ing.id
    if (ing.type === 'carb' && !carbIngId) carbIngId = ing.id
  }
  const proQty  = proIngId  ? (customSize.protein_qty[proIngId]  ?? 0) : 0
  const carbQty = carbIngId ? (customSize.carb_qty[carbIngId]    ?? 0) : 0
  const fitPro  = proIngId  ? (fitSize?.protein_qty[proIngId]  ?? 0) : 0
  const fitCarb = carbIngId ? (fitSize?.carb_qty[carbIngId]    ?? 0) : 0
  const normPro  = fitPro  > 0 ? proQty  * PROTEIN_BASE.FIT / fitPro  : proQty
  const normCarb = fitCarb > 0 ? carbQty * CARB_BASE.FIT    / fitCarb : carbQty
  return calculateCustomSizePrice(normPro, normCarb, customSize.veg_qty).price
}

function calcMinPrice(size: Size, fitSize: Size | undefined): number {
  const proNorms = Object.entries(size.protein_qty).map(([id, qty]) => {
    const fitQty = fitSize?.protein_qty[id] ?? 0
    return fitQty > 0 ? qty * PROTEIN_BASE.FIT / fitQty : qty
  }).filter(v => v > 0)
  const carbNorms = Object.entries(size.carb_qty).map(([id, qty]) => {
    const fitQty = fitSize?.carb_qty[id] ?? 0
    return fitQty > 0 ? qty * CARB_BASE.FIT / fitQty : qty
  }).filter(v => v > 0)
  const proMin = proNorms.length > 0 ? Math.min(...proNorms) : 0
  const carbMin = carbNorms.length > 0 ? Math.min(...carbNorms) : 0
  return calculateCustomSizePrice(proMin, carbMin, size.veg_qty).price
}
import AddToCartModal from '@/components/AddToCartModal'
import CustomSizePanel from '@/components/CustomSizePanel'

interface MealClientProps {
  meal: MealWithRecipes
  sizes: Size[]
  customerSizes?: Size[]
  suggestedMeals?: MealBasic[]
  initialSizeId?: string
  isAuthenticated?: boolean
  salesEnabled?: boolean
}

/**
 * Client Component para ordenar meal individual
 */
export default function MealClient({ meal, sizes, customerSizes = [], suggestedMeals = [], initialSizeId, isAuthenticated, salesEnabled = true }: MealClientProps) {
  const router = useRouter()
  const addToCart = useCartStore(state => state.addItem)

  const fitSize = sizes.find(s => s.name.toLowerCase() === 'fit')
  const customerDefault = customerSizes.find(s => s.is_main)
  const defaultSizeId = (initialSizeId && [...sizes, ...customerSizes].find(s => s.id === initialSizeId))
    ? initialSizeId
    : customerDefault?.id || fitSize?.id || sizes[0]?.id || ''
  const [selectedSizeId, setSelectedSizeId] = useState(defaultSizeId)
  const [qty, setQty] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showRecipe, setShowRecipe] = useState(false)
  const [sessionSizes, setSessionSizes] = useState<Size[]>([])
  // const [portionMode, setPortionMode] = useState<'crudo' | 'cocido'>('crudo')

  const sessionIds = new Set(sessionSizes.map(s => s.id))
  const allSizes = [...sizes, ...customerSizes.filter(s => !sessionIds.has(s.id)), ...sessionSizes]
  const selectedSize = allSizes.find(s => s.id === selectedSizeId)

  const [customInitialSize, setCustomInitialSize] = useState<Size | undefined>()

  const handleCustomSizeCreated = (size: Size) => {
    setSessionSizes(prev => [...prev.filter(s => s.id !== size.id), size])
    setCustomInitialSize(undefined)
    setSelectedSizeId(size.id)
  }

  const handleEditCustomSize = (size: Size) => {
    setCustomInitialSize(size)
    setSelectedSizeId('__custom__')
  }

  // Calcular macros según size seleccionado
  const macros = useMemo(() => {
    if (!selectedSize) return null
    
    const ingredientsMap = new Map(meal.ingredients.map(i => [i.id, i]))
    return calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, selectedSize)
  }, [meal, selectedSize])

  const totalPrice = selectedSize
    ? (selectedSize.customer_id
        ? calcMealPrice(meal, selectedSize, fitSize) * qty
        : selectedSize.price * qty)
    : 0

  const handleAddToCart = () => {
    if (!selectedSize) return

    addToCart({
      mealId: meal.id,
      mealName: meal.name,
      sizeId: selectedSize.id,
      sizeName: selectedSize.name,
      qty: qty,
      unitPrice: selectedSize.customer_id
        ? calcMealPrice(meal, selectedSize, fitSize)
        : selectedSize.price
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Tamaños principales */}
          {sizes.filter(s => s.is_main).map(size => {
            const isSelected = selectedSizeId === size.id
            return (
              <button
                key={size.id}
                onClick={() => setSelectedSizeId(size.id)}
                style={{
                  flex: '1 1 0',
                  minWidth: 80,
                  padding: '14px 8px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? colors.orange : colors.grayLight}`,
                  background: isSelected ? 'rgba(254,151,57,0.15)' : colors.black,
                  color: isSelected ? colors.orange : colors.white,
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  fontFamily: 'Franchise, sans-serif',
                }}
              >
                <div style={{ fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 }}>{size.name}</div>
                <div style={{ fontSize: 13, color: isSelected ? colors.orange : colors.textMuted, marginTop: 3, fontFamily: 'sans-serif', fontWeight: 600 }}>
                  ${(size.price / 100).toFixed(0)} MXN
                </div>
              </button>
            )
          })}

          {/* 4to botón: mis tamaños + crear nuevo como última opción del select */}
          {(() => {
            const myList = [...customerSizes.filter(s => !sessionIds.has(s.id)), ...sessionSizes]
            const active = myList.find(s => s.id === selectedSizeId)
            const isCreating = selectedSizeId === '__custom__'
            const isSelected = !!active || isCreating
            return (
              <div style={{ flex: '1 1 0', minWidth: 80, position: 'relative' }}>
                <div style={{
                  padding: '14px 8px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? colors.orange : colors.grayLight}`,
                  background: isSelected ? 'rgba(254,151,57,0.15)' : colors.black,
                  color: isSelected ? colors.orange : colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  fontFamily: 'Franchise, sans-serif',
                  pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: isCreating || active ? 16 : 22, textTransform: 'uppercase', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {active ? active.name : isCreating ? 'Crear nuevo' : '＋'}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 3, fontFamily: 'sans-serif', fontWeight: 600 }}>
                    {active ? `$${(calcMealPrice(meal, active, fitSize) / 100).toFixed(0)} MXN` : 'personalizado'}
                  </div>
                </div>
                <select
                  value={isSelected ? selectedSizeId : ''}
                  onChange={e => { if (e.target.value) setSelectedSizeId(e.target.value) }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                >
                  <option value="">Personalizado...</option>
                  {myList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — ${(calcMealPrice(meal, s, fitSize) / 100).toFixed(0)} MXN</option>
                  ))}
                  <option value="__custom__">＋ Crear nuevo</option>
                </select>
              </div>
            )
          })()}
        </div>

        {selectedSizeId === '__custom__' && (
          <div style={{ marginTop: 16 }}>
            <CustomSizePanel
              proIngredients={meal.ingredients.filter(i => i.type === 'pro')}
              carbIngredients={meal.ingredients.filter(i => i.type === 'carb')}
              fitSize={fitSize}
              initialSize={customInitialSize}
              isAuthenticated={isAuthenticated}
              onSizeCreated={handleCustomSizeCreated}
            />
          </div>
        )}

        {/* Editar tamaño custom guardado */}
        {selectedSize && !!selectedSize.customer_id && selectedSizeId !== '__custom__' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <div style={{ flex: '3 1 0' }} />
            <button
              onClick={() => handleEditCustomSize(selectedSize)}
              style={{
                flex: '1 1 0',
                minWidth: 80,
                padding: '7px 8px',
                borderRadius: 8,
                border: `1px solid ${colors.grayLight}`,
                background: 'transparent',
                color: colors.textMuted,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'sans-serif',
              }}
            >
              Editar
            </button>
          </div>
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
            {/* Toggle pill — oculto por ahora, solo crudo */}
            {/* <div style={{ display: 'flex', background: colors.black, borderRadius: 20, padding: 3, gap: 2, border: `1px solid ${colors.grayLight}` }}>
              <button onClick={() => setPortionMode('crudo')} >Crudo</button>
              <button onClick={() => setPortionMode('cocido')} >Cocido</button>
            </div> */}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {(() => {
              const proIng  = meal.ingredients.find(i => i.type === 'pro')
              const carbIng = meal.ingredients.find(i => i.type === 'carb')
              const vegIng  = meal.ingredients.find(i => i.type === 'veg')
              const rows: { label: string; sub?: string; raw: number }[] = [
                {
                  label: 'Proteína',
                  sub: proIng?.public_name ?? proIng?.name,
                  raw: proIng ? (selectedSize.protein_qty[proIng.id] ?? 0) : 0,
                },
                {
                  label: 'Carbos',
                  sub: carbIng?.public_name ?? carbIng?.name,
                  raw: carbIng ? (selectedSize.carb_qty[carbIng.id] ?? 0) : 0,
                },
                {
                  label: 'Verduras',
                  sub: vegIng?.public_name ?? vegIng?.name,
                  raw: vegIng ? selectedSize.veg_qty : 0,
                },
              ]
              return rows.map(({ label, sub, raw }) => (
                <div key={label} style={{
                  flex: 1, background: colors.black, borderRadius: 8,
                  padding: '8px 4px', textAlign: 'center', border: `1px solid ${colors.grayLight}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: colors.white, marginBottom: 2, lineHeight: 1.2 }}>{label}</div>
                  {sub && <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 4, lineHeight: 1.2 }}>({sub})</div>}
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: colors.orange, lineHeight: 1 }}>{raw}g</div>
                </div>
              ))
            })()}
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
          fontFamily: 'Franchise, sans-serif',
          fontSize: 18,
          letterSpacing: 0,
          lineHeight: 1,
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
                    {ingredient.public_name ?? ingredient.name}
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
        
        {!salesEnabled ? (
          <div style={{
            width: '100%', padding: '16px 20px', borderRadius: 8, textAlign: 'center',
            background: '#ef444422', border: '1px solid #ef4444',
            color: '#ef4444', fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
          }}>
            Ventas temporalmente pausadas
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="franchise-stroke"
            style={{
              width: '100%',
              padding: '16px 24px',
              cursor: !selectedSize ? 'not-allowed' : 'pointer',
              opacity: !selectedSize ? 0.5 : 1,
              background: colors.orange,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              fontFamily: 'Franchise, sans-serif',
              fontSize: 22,
              letterSpacing: 0,
              lineHeight: 1,
              textTransform: 'uppercase'
            }}
          >
            Agregar al carrito
          </button>
        )}
        </div>
      </div>
    </main>
  )
}
