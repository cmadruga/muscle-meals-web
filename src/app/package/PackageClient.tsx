'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Size, MealWithRecipes } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros } from '@/lib/utils/macros'
// import { toCocido } from '@/lib/utils/conversions' // reservado para toggle crudo/cocido
import { calculateCustomSizePrice, CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'
import { colors } from '@/lib/theme'
import AddToCartModal from '@/components/AddToCartModal'
import CustomSizePanel from '@/components/CustomSizePanel'

interface PackageConfig {
  minMeals: number
  name: string
  description?: string | null
}

interface PackageClientProps {
  meals: MealWithRecipes[]
  sizes: Size[]
  customerSizes?: Size[]
  editInstanceId?: string
}

interface SelectionItem {
  mealId: string
  mealName: string
  sizeId: string
  sizeName: string
  unitPrice: number  // package_price calculado para este meal+size
  qty: number
}

// Calcula el package_price correcto para un platillo con un custom size
function calcMealCustomPrice(meal: MealWithRecipes, customSize: Size, fitSize: Size): number {
  let proIngId: string | null = null
  let carbIngId: string | null = null
  for (const ing of meal.ingredients) {
    if (ing.type === 'pro' && !proIngId) proIngId = ing.id
    if (ing.type === 'carb' && !carbIngId) carbIngId = ing.id
  }

  const proQty  = proIngId  ? (customSize.protein_qty[proIngId]  ?? 0) : 0
  const carbQty = carbIngId ? (customSize.carb_qty[carbIngId]    ?? 0) : 0

  const fitPro  = proIngId  ? (fitSize.protein_qty[proIngId]  ?? 0) : 0
  const fitCarb = carbIngId ? (fitSize.carb_qty[carbIngId]    ?? 0) : 0

  const normPro  = fitPro  > 0 ? proQty  * PROTEIN_BASE.FIT / fitPro  : proQty
  const normCarb = fitCarb > 0 ? carbQty * CARB_BASE.FIT    / fitCarb : carbQty

  return calculateCustomSizePrice(normPro, normCarb, customSize.veg_qty).packagePrice
}

const pkg: PackageConfig = {
  minMeals: 5,
  name: 'Arma tu paquete',
  description: 'Agrega mínimo 5 platillos. Precio especial activo al agregar 5 o más. Puedes combinar tamaños.'
}

/**
 * Client Component para armar un paquete
 * 1. Selecciona size
 * 2. Selecciona N meals
 * 3. Crea orden
 */
export default function PackageClient({ meals, sizes, customerSizes = [], editInstanceId }: PackageClientProps) {
  const router = useRouter()
  const { addItem: addToCart, removePackage } = useCartStore()
  const fitSize = sizes.find(s => s.name.toLowerCase() === 'fit')
  const [selectedSizeId, setSelectedSizeId] = useState(fitSize?.id || sizes[0]?.id || '')
  const [selection, setSelection] = useState<SelectionItem[]>([])

  // Hidratar selección desde el carrito después del mount (evita hydration mismatch con SSR)
  useEffect(() => {
    if (!editInstanceId) return
    const cartItems = useCartStore.getState().items
      .filter(i => i.packageInstanceId === editInstanceId)
      .map(i => ({
        mealId: i.mealId,
        mealName: i.mealName,
        sizeId: i.sizeId,
        sizeName: i.sizeName,
        unitPrice: i.unitPrice,
        qty: i.qty,
      }))
    setSelection(cartItems)
  }, [editInstanceId])
  const [showModal, setShowModal] = useState(false)
  const [expandedMealIds, setExpandedMealIds] = useState<Set<string>>(new Set())
  const [sessionSizes, setSessionSizes] = useState<Size[]>([])
  // const [portionMode, setPortionMode] = useState<'crudo' | 'cocido'>('crudo')

  // Convertir meals a formato MealBasic para sugerencias
  const suggestedMeals = meals.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    img: m.img
  }))

  const allSizes = [...sizes, ...customerSizes, ...sessionSizes]
  const selectedSize = allSizes.find(s => s.id === selectedSizeId)

  const handleCustomSizeCreated = (size: Size) => {
    setSessionSizes(prev => [...prev, size])
    setSelectedSizeId(size.id)
  }
  
  // Total de comidas seleccionadas
  const totalSelected = useMemo(
    () => selection.reduce((sum, item) => sum + item.qty, 0),
    [selection]
  )

  // Precio total: suma unitPrice calculado por platillo
  const totalPrice = useMemo(
    () => selection.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [selection]
  )

  const canSubmit = totalSelected >= pkg.minMeals && selection.length > 0

  // Agregar meal con el size activo
  const handleAdd = (meal: MealWithRecipes) => {
    if (!selectedSize) return
    const unitPrice = selectedSize.is_main
      ? selectedSize.package_price
      : calcMealCustomPrice(meal, selectedSize, fitSize ?? selectedSize)
    setSelection(prev => {
      const existing = prev.find(i => i.mealId === meal.id && i.sizeId === selectedSize.id)
      if (existing) {
        return prev.map(i => i.mealId === meal.id && i.sizeId === selectedSize.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { mealId: meal.id, mealName: meal.name, sizeId: selectedSize.id, sizeName: selectedSize.name, unitPrice, qty: 1 }]
    })
  }

  // Remover del size activo
  const handleRemove = (mealId: string) => {
    if (!selectedSize) return
    setSelection(prev =>
      prev.map(i => i.mealId === mealId && i.sizeId === selectedSize.id ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    )
  }

  // Cantidad total de un meal (todos los sizes)
  const getQty = (mealId: string) =>
    selection.filter(i => i.mealId === mealId).reduce((s, i) => s + i.qty, 0)

  // Cantidad de un meal en el size activo
  const getQtyForCurrentSize = (mealId: string) =>
    selection.find(i => i.mealId === mealId && i.sizeId === selectedSizeId)?.qty ?? 0

  // Breakdown por size de un meal (para mostrar en card)
  const getSizeBreakdown = (mealId: string) =>
    selection.filter(i => i.mealId === mealId && i.qty > 0)

  // Toggle ingredientes
  const toggleIngredients = (mealId: string) => {
    setExpandedMealIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  // Agregar paquete al carrito
  const handleAddToCart = () => {
    if (!canSubmit || !selectedSize) return

    // Si estamos editando, eliminar el paquete original primero
    if (editInstanceId) {
      removePackage(editInstanceId)
    }

    // Generar un ID único para esta instancia del paquete
    const packageInstanceId = `pkg_${crypto.randomUUID()}`

    // Cada meal seleccionado se agrega individualmente con packageInstanceId
    selection.forEach(item => {
      addToCart({
        mealId: item.mealId,
        mealName: item.mealName,
        sizeId: item.sizeId,
        sizeName: item.sizeName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        packageName: pkg.name,
        packageInstanceId
      })
    })

    // Mostrar modal de confirmación
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelection([]) // Limpiar selección
  }

  const handleGoToCart = () => {
    setShowModal(false)
    setSelection([])
    router.push('/cart')
  }

  const handleContinueShopping = () => {
    setShowModal(false)
    setSelection([])
    router.push(editInstanceId ? '/cart' : '/menu')
  }

  const handleMealClick = (mealId: string, sizeId?: string) => {
    setShowModal(false)
    router.push(`/meal/${mealId}${sizeId ? `?sizeId=${sizeId}` : ''}`)
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
        <span style={{ color: colors.orange }}>{pkg.name}</span>
      </h1>
      {pkg.description && <p style={{ color: colors.textMuted, marginBottom: 24 }}>{pkg.description}</p>}

      {/* Modal de confirmación */}
      <AddToCartModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onGoToCart={handleGoToCart}
        onContinueShopping={handleContinueShopping}
        title={editInstanceId ? '¡Paquete actualizado!' : '¡Agregado al carrito!'}
        message={editInstanceId ? `Tu paquete de ${totalSelected} platillos ha sido actualizado` : `Tu paquete de ${totalSelected} platillos ha sido agregado al carrito`}
        suggestedMeals={suggestedMeals}
        selectedSize={selectedSize}
        onMealClick={handleMealClick}
      />

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

        {/* Botones de tamaño */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                  ${(size.package_price / 100).toFixed(0)}/platillo
                </div>
              </button>
            )
          })}

          {/* Botón Custom */}
          <button
            onClick={() => setSelectedSizeId('__custom__')}
            style={{
              flex: '1 1 0',
              minWidth: 80,
              padding: '14px 8px',
              borderRadius: 10,
              border: `2px solid ${selectedSizeId === '__custom__' ? colors.orange : colors.grayLight}`,
              background: selectedSizeId === '__custom__' ? 'rgba(254,151,57,0.15)' : colors.black,
              color: selectedSizeId === '__custom__' ? colors.orange : colors.textMuted,
              cursor: 'pointer',
              textAlign: 'center',
              lineHeight: 1.3,
              fontFamily: 'Franchise, sans-serif',
            }}
          >
            <div style={{ fontSize: 22 }}>＋</div>
            <div style={{ fontSize: 13, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>tamaño personalizado</div>
          </button>
        </div>

        {selectedSizeId === '__custom__' && (() => {
          // Collect unique pro/carb ingredients across all meals
          const proMap = new Map<string, import('@/lib/types').Ingredient>()
          const carbMap = new Map<string, import('@/lib/types').Ingredient>()
          for (const m of meals) {
            for (const i of m.ingredients) {
              if (i.type === 'pro') proMap.set(i.id, i)
              if (i.type === 'carb') carbMap.set(i.id, i)
            }
          }
          return (
            <div style={{ marginTop: 16 }}>
              <CustomSizePanel
                proIngredients={[...proMap.values()]}
                carbIngredients={[...carbMap.values()]}
                customerSizes={customerSizes}
                onSizeCreated={handleCustomSizeCreated}
              />
            </div>
          )
        })()}

        {/* Descripción del size seleccionado */}
        {selectedSize?.description && (
          <p style={{ fontSize: 13, margin: '12px 0 0 0', color: colors.textMuted, fontStyle: 'italic' }}>
            {selectedSize.description}
          </p>
        )}

        {/* Toggle crudo/cocido — oculto por ahora, solo crudo */}
        {/* <div>Ver porciones en: [Crudo] [Cocido]</div> */}

        {/* Porciones del size */}
        {selectedSize && (
          <div style={{ marginTop: 16 }}>

            {/* Desglose por ingrediente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', border: `1px solid ${colors.grayLight}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Proteína */}
              <div style={{ padding: '10px 14px', borderRight: `1px solid ${colors.grayLight}` }}>
                <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Proteína</p>
                {(() => {
                  const proMap = new Map<string, import('@/lib/types').Ingredient>()
                  for (const m of meals) for (const i of m.ingredients) if (i.type === 'pro') proMap.set(i.id, i)
                  return [...proMap.values()].map(ing => {
                    const raw = selectedSize.protein_qty[ing.id] ?? 0
                    const grams = raw
                    return (
                      <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: colors.textSecondary, fontSize: 12 }}>{ing.public_name ?? ing.name}</span>
                        <span style={{ color: colors.white, fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{grams}g</span>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Carbo */}
              <div style={{ padding: '10px 14px', borderRight: `1px solid ${colors.grayLight}` }}>
                <p style={{ color: '#eab308', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Carbo</p>
                {(() => {
                  const carbMap = new Map<string, import('@/lib/types').Ingredient>()
                  for (const m of meals) for (const i of m.ingredients) if (i.type === 'carb') carbMap.set(i.id, i)
                  return [...carbMap.values()].map(ing => {
                    const raw = selectedSize.carb_qty[ing.id] ?? 0
                    const grams = raw
                    return (
                      <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: colors.textSecondary, fontSize: 12 }}>{ing.public_name ?? ing.name}</span>
                        <span style={{ color: colors.white, fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{grams}g</span>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Verdura */}
              <div style={{ padding: '10px 14px', minWidth: 100 }}>
                <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Verdura</p>
                {(() => {
                  const vegMap = new Map<string, import('@/lib/types').Ingredient>()
                  for (const m of meals) for (const i of m.ingredients) if (i.type === 'veg') vegMap.set(i.id, i)
                  if (vegMap.size === 0) {
                    return <span style={{ color: colors.textMuted, fontSize: 12 }}>0g</span>
                  }
                  return [...vegMap.values()].map(ing => (
                    <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ color: colors.textSecondary, fontSize: 12 }}>{ing.public_name ?? ing.name}</span>
                      <span style={{ color: colors.white, fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{selectedSize.veg_qty}g</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meals Selection */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: colors.orange, marginBottom: 8 }}>
          2. Elige tus platillos
        </h3>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 8,
            background: colors.grayLight,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(totalSelected / pkg.minMeals * 100, 100)}%`,
              background: colors.orange,
              borderRadius: 4,
              transition: 'width 0.2s'
            }} />
          </div>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
            {totalSelected < pkg.minMeals
              ? <><strong style={{ color: colors.white }}>{totalSelected} / {pkg.minMeals}</strong> mínimo · Agrega {pkg.minMeals - totalSelected} más para precio paquete</>
              : <><strong style={{ color: colors.orange }}>✓ Precio paquete activo</strong> · {totalSelected} platillos seleccionados</>
            }
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {meals.map(meal => {
            const qty = getQty(meal.id)
            const qtyCurrentSize = getQtyForCurrentSize(meal.id)
            const breakdown = getSizeBreakdown(meal.id)
            const isExpanded = expandedMealIds.has(meal.id)
            
            // Calcular macros para este meal con el size seleccionado
            let macros = null
            if (selectedSize) {
              const ingredientsMap = new Map(meal.ingredients.map(i => [i.id, i]))
              macros = calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, selectedSize)
            }

            // Precio por platillo (solo para custom sizes)
            const mealUnitPrice = selectedSize && !selectedSize.is_main
              ? calcMealCustomPrice(meal, selectedSize, fitSize ?? selectedSize)
              : selectedSize?.package_price ?? null
            
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
                    height={280}
                    style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 8, marginBottom: 12 }}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <h4 style={{ margin: '8px 0', color: colors.orange }}>{meal.name}</h4>
                  {mealUnitPrice !== null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.white, whiteSpace: 'nowrap' }}>
                      ${(mealUnitPrice / 100).toFixed(0)} MXN
                    </span>
                  )}
                </div>
                {meal.description && (
                  <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 8 }}>{meal.description}</p>
                )}
                
                {/* Macros nutricionales */}
                {macros && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[
                      { value: Math.round(macros.calories), unit: 'Calorías' },
                      { value: Math.round(macros.protein),  unit: 'Proteína' },
                      { value: Math.round(macros.carbs),    unit: 'Carbos'   },
                      { value: Math.round(macros.fats),     unit: 'Grasas'   },
                    ].map(({ value, unit }) => (
                      <div key={unit} style={{
                        flex: 1,
                        background: colors.black,
                        borderRadius: 8,
                        padding: '6px 4px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: colors.white, lineHeight: 1 }}>
                          {value}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 3 }}>
                          {unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Controls + Botón Ver Ingredientes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <button
                    onClick={() => handleRemove(meal.id)}
                    disabled={qtyCurrentSize === 0}
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 18,
                      border: `1px solid ${colors.grayLight}`,
                      borderRadius: 8,
                      background: colors.grayLight,
                      color: colors.white,
                      cursor: qtyCurrentSize === 0 ? 'not-allowed' : 'pointer',
                      opacity: qtyCurrentSize === 0 ? 0.5 : 1
                    }}
                  >
                    −
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                    <span style={{ fontWeight: 'bold', color: colors.white, lineHeight: 1 }}>
                      {qty > 0 ? qty : 0}
                    </span>
                    {breakdown.length > 1 && (
                      <span style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, whiteSpace: 'nowrap' }}>
                        {breakdown.map(i => `${i.sizeName} ×${i.qty}`).join(' · ')}
                      </span>
                    )}
                    {breakdown.length === 1 && breakdown[0].sizeId !== selectedSizeId && (
                      <span style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                        {breakdown[0].sizeName}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAdd(meal)}
                    disabled={!selectedSize}
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 18,
                      border: `1px solid ${colors.grayLight}`,
                      borderRadius: 8,
                      background: colors.grayLight,
                      color: colors.white,
                      cursor: !selectedSize ? 'not-allowed' : 'pointer',
                      opacity: !selectedSize ? 0.5 : 1
                    }}
                  >
                    +
                  </button>

                  <button
                    onClick={() => toggleIngredients(meal.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontFamily: 'Franchise, sans-serif',
                      fontSize: 14,
                      letterSpacing: 0,
                      lineHeight: 1,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: colors.orange,
                      border: `1px solid ${colors.orange}`,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{isExpanded ? '▲' : '▼'}</span>
                    <span>{isExpanded ? 'Ocultar' : 'Ingredientes'}</span>
                  </button>
                </div>

                {/* Lista de ingredientes (colapsable) */}
                {isExpanded && (
                  <div style={{
                    marginBottom: 12,
                    padding: 12,
                    background: colors.black,
                    borderRadius: 6,
                    fontSize: 12
                  }}>
                    <div style={{ marginBottom: 8 }}>
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: 16, color: colors.textSecondary }}>
                        {meal.mainRecipe.ingredients.map((ing, idx) => {
                          const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
                          if (!ingredient) return null
                          return (
                            <li key={idx} style={{ marginBottom: 2 }}>
                              {ingredient.public_name ?? ingredient.name}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    
                    {meal.subRecipes.length > 0 && meal.subRecipes.map((subRecipe, subIdx) => (
                      <div key={subIdx} style={{ marginTop: 8 }}>
                        <strong style={{ color: colors.white, fontSize: 13 }}>{subRecipe.name}</strong>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: 16, color: colors.textSecondary }}>
                          {subRecipe.ingredients.map((ing, idx) => {
                            const ingredient = meal.ingredients.find(i => i.id === ing.ingredient_id)
                            if (!ingredient) return null
                            return (
                              <li key={idx} style={{ marginBottom: 2 }}>
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
            )
          })}
        </div>
      </div>

      </div>
      {/* Summary & Submit */}
      <style>{`
        .pkg-footer { padding: 20px 24px; }
        .pkg-footer-inner { display: flex; align-items: center; gap: 16px; }
        .pkg-footer-price { font-size: 26px; }
        .pkg-footer-btn { }
        @media (max-width: 640px) {
          .pkg-footer { padding: 12px 16px; }
          .pkg-footer-inner { flex-direction: column; align-items: stretch; gap: 10px; }
          .pkg-footer-price { font-size: 22px; }
          .pkg-footer-btn { width: 100%; text-align: center; }
        }
      `}</style>
      <div className="pkg-footer" style={{
        position: 'sticky',
        bottom: 0,
        background: colors.grayDark,
        borderTop: `2px solid ${colors.grayLight}`
      }}>
        <div className="pkg-footer-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {totalSelected > 0 && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {totalSelected} platillo{totalSelected !== 1 ? 's' : ''}{(() => {
                  const uniqueSizes = [...new Map(selection.map(i => [i.sizeId, i.sizeName])).values()]
                  return uniqueSizes.length === 1 ? ` · ${uniqueSizes[0]}` : ` · ${uniqueSizes.join(', ')}`
                })()}
              </div>
              <div className="pkg-footer-price" style={{ fontWeight: 'bold', color: colors.orange, lineHeight: 1 }}>
                ${(totalPrice / 100).toFixed(0)} MXN
              </div>
            </div>
          )}
          <button
            className={`pkg-footer-btn franchise-stroke`}
            onClick={handleAddToCart}
            disabled={!canSubmit}
            style={{
              flex: totalSelected > 0 ? 'none' : 1,
              padding: '14px 24px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              background: canSubmit ? colors.orange : colors.grayLight,
              color: canSubmit ? colors.white : colors.textMuted,
              border: 'none',
              borderRadius: 8,
              fontFamily: 'Franchise, sans-serif',
              fontSize: 20,
              letterSpacing: 0,
              lineHeight: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {totalSelected < pkg.minMeals
              ? `Agrega ${pkg.minMeals - totalSelected} más` : editInstanceId ? 'Actualizar paquete'
              : 'Agregar al carrito'
            }
          </button>
        </div>
      </div>
    </main>
  )
}
