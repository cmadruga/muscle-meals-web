'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Size, MealWithRecipes } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros } from '@/lib/utils/macros'
import { toCocido } from '@/lib/utils/conversions'
import { colors } from '@/lib/theme'
import AddToCartModal from '@/components/AddToCartModal'
import CustomSizePanel from '@/components/CustomSizePanel'
import SizeSelect from '@/components/SizeSelect'

interface PackageConfig {
  minMeals: number
  name: string
  description?: string | null
}

interface PackageClientProps {
  meals: MealWithRecipes[]
  sizes: Size[]
  customerSizes?: Size[]
}

interface SelectionItem {
  mealId: string
  mealName: string
  qty: number
}

const pkg: PackageConfig = {
  minMeals: 5,
  name: 'Arma tu paquete',
  description: 'Agrega mínimo 5 platillos. Precio especial activo al agregar 5 o más del mismo tamaño.'
}

/**
 * Client Component para armar un paquete
 * 1. Selecciona size
 * 2. Selecciona N meals
 * 3. Crea orden
 */
export default function PackageClient({ meals, sizes, customerSizes = [] }: PackageClientProps) {
  const router = useRouter()
  const addToCart = useCartStore(state => state.addItem)
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '')
  const [selection, setSelection] = useState<SelectionItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [expandedMealIds, setExpandedMealIds] = useState<Set<string>>(new Set())
  const [sessionSizes, setSessionSizes] = useState<Size[]>([])
  const [portionMode, setPortionMode] = useState<'crudo' | 'cocido'>('crudo')

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

  // Precio total del paquete (dinámico: price × totalSelected)
  const totalPrice = selectedSize ? selectedSize.package_price * totalSelected : 0

  const canSubmit = totalSelected >= pkg.minMeals && !!selectedSize

  // Agregar meal (sin límite superior)
  const handleAdd = (meal: MealWithRecipes) => {
    if (!selectedSize) return

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
    router.push('/menu')
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
        title="¡Agregado al carrito!"
        message={`Tu paquete ${pkg.name} (${totalSelected} platillos) ha sido agregado al carrito`}
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
        <div style={{ maxWidth: 400 }}>
          <SizeSelect
            mainSizes={sizes.filter(s => s.is_main)}
            customerSizes={customerSizes}
            sessionSizes={sessionSizes}
            selectedId={selectedSizeId}
            onChange={setSelectedSizeId}
            formatOption={size => `${size.name} — $${(size.package_price / 100).toFixed(0)} MXN/platillo`}
          />
        </div>

        {selectedSizeId === '__custom__' && (
          <CustomSizePanel onSizeCreated={handleCustomSizeCreated} />
        )}

        {/* Descripción del size seleccionado */}
        {selectedSize?.description && (
          <p style={{ fontSize: 13, margin: '12px 0 0 0', color: colors.textMuted, fontStyle: 'italic' }}>
            {selectedSize.description}
          </p>
        )}

        {/* Toggle crudo/cocido + porciones del size */}
        {selectedSize && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Ver porciones en:</span>
              <div style={{ display: 'flex', background: colors.black, borderRadius: 20, padding: 3, gap: 2, border: `1px solid ${colors.grayLight}` }}>
                <button
                  onClick={() => setPortionMode('crudo')}
                  style={{
                    padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer',
                    background: portionMode === 'crudo' ? colors.orange : 'transparent',
                    color: portionMode === 'crudo' ? colors.black : colors.textMuted,
                  }}
                >Crudo</button>
                <button
                  onClick={() => setPortionMode('cocido')}
                  style={{
                    padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer',
                    background: portionMode === 'cocido' ? colors.orange : 'transparent',
                    color: portionMode === 'cocido' ? colors.black : colors.textMuted,
                  }}
                >Cocido</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Proteína', raw: selectedSize.protein_qty, type: 'protein' as const },
                { label: 'Carbos',   raw: selectedSize.carb_qty,   type: 'carbs' as const },
                { label: 'Verduras', raw: selectedSize.veg_qty,    type: 'veg' as const },
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
            const isExpanded = expandedMealIds.has(meal.id)
            
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
                <h4 style={{ margin: '8px 0', color: colors.orange }}>{meal.name}</h4>
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
                      fontSize: 12,
                      fontWeight: 'bold',
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
                    <span style={{ fontSize: 11 }}>{isExpanded ? 'Ocultar' : 'Ingredientes'}</span>
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
                              {ingredient.name}
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
                {totalSelected} platillo{totalSelected !== 1 ? 's' : ''} · {selectedSize?.name || ''}
              </div>
              <div className="pkg-footer-price" style={{ fontWeight: 'bold', color: colors.orange, lineHeight: 1 }}>
                ${(totalPrice / 100).toFixed(0)} MXN
              </div>
            </div>
          )}
          <button
            className="pkg-footer-btn"
            onClick={handleAddToCart}
            disabled={!canSubmit}
            style={{
              flex: totalSelected > 0 ? 'none' : 1,
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              background: canSubmit ? colors.orange : colors.grayLight,
              color: canSubmit ? colors.black : colors.textMuted,
              border: 'none',
              borderRadius: 8,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {totalSelected < pkg.minMeals
              ? `Agrega ${pkg.minMeals - totalSelected} más`
              : '🛒 Agregar al carrito'
            }
          </button>
        </div>
      </div>
    </main>
  )
}
