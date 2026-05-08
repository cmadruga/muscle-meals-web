'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Size, MealWithRecipes, Ingredient } from '@/lib/types'
import type { CriticalPeriodConfig } from '@/lib/utils/delivery'
import { useCartStore } from '@/lib/store/cart'
import { calculateMealMacros } from '@/lib/utils/macros'
// import { toCocido } from '@/lib/utils/conversions' // reservado para toggle crudo/cocido
import { calculateCustomSizePrice, CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'
import { colors } from '@/lib/theme'

function calcMinPackagePrice(size: Size, fitSize: Size | undefined): number {
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
  return calculateCustomSizePrice(proMin, carbMin, size.veg_qty).packagePrice
}
import AddToCartModal from '@/components/AddToCartModal'
import CustomSizePanel from '@/components/CustomSizePanel'
import type { ExtraStockItem } from '@/lib/db/extra-stock'

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
  proIngredients?: Ingredient[]
  carbIngredients?: Ingredient[]
  isAuthenticated?: boolean
  salesEnabled?: boolean
  inCriticalPeriod?: boolean
  extraStock?: ExtraStockItem[]
  criticalConfig?: CriticalPeriodConfig
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
export default function PackageClient({ meals, sizes, customerSizes = [], editInstanceId, proIngredients = [], carbIngredients = [], isAuthenticated, salesEnabled = true, inCriticalPeriod = false, extraStock = [], criticalConfig }: PackageClientProps) {
  const router = useRouter()
  const { addItem: addToCart, removePackage } = useCartStore()
  const fitSize = sizes.find(s => s.name.toLowerCase() === 'fit')
  const customerDefault = customerSizes.find(s => s.is_main)

  // Mapa de stock extra: `meal_id|size_id` → qty disponible
  const extraStockMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of extraStock) m.set(`${s.meal_id}|${s.size_id}`, s.qty)
    return m
  }, [extraStock])

  const visibleMeals = meals

  const [selectedSizeId, setSelectedSizeId] = useState(customerDefault?.id || fitSize?.id || sizes[0]?.id || '')
  const [selection, setSelection] = useState<SelectionItem[]>(() => {
    if (editInstanceId) return []
    const defaultSizeId = customerDefault?.id || fitSize?.id || sizes[0]?.id || ''
    const defaultSize = [...sizes, ...customerSizes].find(s => s.id === defaultSizeId)
    if (!defaultSize) return []
    const mealsToSelect = inCriticalPeriod
      ? meals.filter(meal => (extraStockMap.get(`${meal.id}|${defaultSize.id}`) ?? 0) > 0)
      : meals
    return mealsToSelect.map(meal => ({
      mealId: meal.id,
      mealName: meal.name,
      sizeId: defaultSize.id,
      sizeName: defaultSize.name,
      unitPrice: defaultSize.customer_id
        ? calcMealCustomPrice(meal, defaultSize, fitSize ?? defaultSize)
        : defaultSize.package_price,
      qty: 1,
    }))
  })

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection(cartItems)
  }, [editInstanceId])
  const [showModal, setShowModal] = useState(false)
  const [expandedMealIds, setExpandedMealIds] = useState<Set<string>>(new Set())
  const [sessionSizes, setSessionSizes] = useState<Size[]>([])
  // const [portionMode, setPortionMode] = useState<'crudo' | 'cocido'>('crudo')

  // Sin sesión: limitar ingredientes del panel a los que usan los platillos activos
  const activeMealIngIds = new Set(meals.flatMap(m => m.ingredients.map(i => i.id)))
  const panelProIngredients = isAuthenticated ? proIngredients : proIngredients.filter(i => activeMealIngIds.has(i.id))
  const panelCarbIngredients = isAuthenticated ? carbIngredients : carbIngredients.filter(i => activeMealIngIds.has(i.id))

  // Convertir meals a formato MealBasic para sugerencias
  const suggestedMeals = meals.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    img: m.img
  }))

  // sessionSizes tiene prioridad sobre customerSizes (puede ser versión editada)
  const sessionIds = new Set(sessionSizes.map(s => s.id))
  const allSizes = [...sizes, ...customerSizes.filter(s => !sessionIds.has(s.id)), ...sessionSizes]
  const selectedSize = allSizes.find(s => s.id === selectedSizeId)

  const [customInitialSize, setCustomInitialSize] = useState<Size | undefined>()
  const [isTouched, setIsTouched] = useState(false)

  const handleCustomSizeCreated = (size: Size) => {
    setSessionSizes(prev => [...prev.filter(s => s.id !== size.id), size])
    setCustomInitialSize(undefined)
    setIsTouched(false) // nuevo tamaño creado → volver a modo sincronizado
    setSelectedSizeId(size.id)
  }

  const handleEditCustomSize = (size: Size) => {
    setCustomInitialSize(size)
    setSelectedSizeId('__custom__')
  }

  // Mientras no se haya tocado nada, cambiar de tamaño actualiza toda la selección
  useEffect(() => {
    if (isTouched || selectedSizeId === '__custom__') return
    const newSize = allSizes.find(s => s.id === selectedSizeId)
    if (!newSize) return
    const mealsForSize = inCriticalPeriod
      ? meals.filter(meal => (extraStockMap.get(`${meal.id}|${newSize.id}`) ?? 0) > 0)
      : meals
    setSelection(mealsForSize.map(meal => ({
      mealId: meal.id,
      mealName: meal.name,
      sizeId: newSize.id,
      sizeName: newSize.name,
      unitPrice: newSize.customer_id
        ? calcMealCustomPrice(meal, newSize, fitSize ?? newSize)
        : newSize.package_price,
      qty: 1,
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSizeId])

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

  const selectionHasStock = !inCriticalPeriod || selection.every(item =>
    (extraStockMap.get(`${item.mealId}|${item.sizeId}`) ?? 0) >= item.qty
  )
  const canSubmit = totalSelected >= pkg.minMeals && selection.length > 0
    && selectionHasStock

  // Agregar meal con el size activo
  const handleAdd = (meal: MealWithRecipes) => {
    if (!selectedSize) return
    setIsTouched(true)
    const unitPrice = selectedSize.customer_id
      ? calcMealCustomPrice(meal, selectedSize, fitSize ?? selectedSize)
      : selectedSize.package_price
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
    setIsTouched(true)
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
                  ${(size.package_price / 100).toFixed(0)}/platillo
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
                    {active ? `$${(calcMinPackagePrice(active, fitSize) / 100).toFixed(0)}/platillo` : 'personalizado'}
                  </div>
                </div>
                <select
                  value={isSelected ? selectedSizeId : ''}
                  onChange={e => { if (e.target.value) setSelectedSizeId(e.target.value) }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                >
                  <option value="">Personalizado...</option>
                  {myList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — ${(calcMinPackagePrice(s, fitSize) / 100).toFixed(0)}/platillo</option>
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
              proIngredients={panelProIngredients}
              carbIngredients={panelCarbIngredients}
              fitSize={fitSize}
              initialSize={customInitialSize}
              isAuthenticated={isAuthenticated}
              onSizeCreated={handleCustomSizeCreated}
            />
          </div>
        )}

        {/* Descripción del size seleccionado (solo main) / Editar (solo custom guardado) */}
        {selectedSize && !!selectedSize.customer_id && selectedSizeId !== '__custom__' ? (
          <div style={{ display: 'flex', marginTop: 6 }}>
            <button
              onClick={() => handleEditCustomSize(selectedSize)}
              style={{
                marginLeft: 'auto',
                width: 'calc((100% - 30px) / 4)',
                padding: '5px 8px',
                borderRadius: 8,
                border: `1px solid ${colors.grayLight}`,
                background: 'transparent',
                color: colors.textMuted,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'sans-serif',
              }}
            >
              Editar
            </button>
          </div>
        ) : selectedSize?.description ? (
          <p style={{ fontSize: 13, margin: '12px 0 0 0', color: colors.textMuted, fontStyle: 'italic' }}>
            {selectedSize.description}
          </p>
        ) : null}

        {/* Toggle crudo/cocido — oculto por ahora, solo crudo */}
        {/* <div>Ver porciones en: [Crudo] [Cocido]</div> */}

        {/* Porciones del size */}
        {selectedSize && (
          <div style={{ marginTop: 16 }}>

            {/* Porciones estilo cards */}
            {(() => {
              type Section = { names: string[]; qty: number }

              const buildSections = (ings: Ingredient[], qtyMap: Record<string, number>): Section[] => {
                const nameGroups = new Map<string, string[]>()
                for (const ing of ings) {
                  const key = ing.public_name ?? ing.name
                  const arr = nameGroups.get(key) ?? []; arr.push(ing.id); nameGroups.set(key, arr)
                }
                const qtyGroups = new Map<number, string[]>()
                for (const [displayName, ids] of nameGroups) {
                  const qty = qtyMap[ids[0]] ?? 0
                  const arr = qtyGroups.get(qty) ?? []; arr.push(displayName); qtyGroups.set(qty, arr)
                }
                return [...qtyGroups.entries()].sort((a, b) => b[0] - a[0]).map(([qty, names]) => ({ names, qty })).slice(0, 3)
              }

              const renderCard = (label: string, color: string, sections: Section[]) => {
                if (sections.length === 0) return null
                if (sections.length === 1) return (
                  <div style={{ flex: 1, background: colors.black, borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: `1px solid ${colors.grayLight}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>({sections[0].names.join(', ')})</div>
                    <div style={{ fontSize: 22, fontWeight: 'bold', color: colors.orange }}>{sections[0].qty}g</div>
                  </div>
                )
                return (
                  <div style={{ flex: 1, background: colors.black, borderRadius: 8, border: `1px solid ${colors.grayLight}`, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, padding: '10px 8px 4px', textAlign: 'center' }}>{label}</div>
                    <div style={{ display: 'flex' }}>
                      {sections.map((sec, i) => (
                        <div key={i} style={{ flex: 1, padding: '4px 6px 12px', textAlign: 'center', borderLeft: i > 0 ? `1px solid ${colors.grayLight}` : undefined }}>
                          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>({sec.names.join(', ')})</div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: colors.orange }}>{sec.qty}g</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              // Only show main-recipe ingredients in the display (sub-recipe ingredients are excluded)
              const proIngsFromMeals: Ingredient[] = []
              const proSeen = new Set<string>()
              const carbIngsFromMeals: Ingredient[] = []
              const carbSeen = new Set<string>()
              const vegNameSet = new Set<string>()

              for (const m of meals) {
                const mainIngIds = new Set(m.mainRecipe.ingredients.map(ri => ri.ingredient_id))
                for (const i of m.ingredients) {
                  if (!mainIngIds.has(i.id)) continue
                  if (i.type === 'pro' && !proSeen.has(i.id)) { proSeen.add(i.id); proIngsFromMeals.push(i) }
                  else if (i.type === 'carb' && !carbSeen.has(i.id)) { carbSeen.add(i.id); carbIngsFromMeals.push(i) }
                  else if (i.type === 'veg') vegNameSet.add(i.public_name ?? i.name)
                }
              }

              const proSections = buildSections(proIngsFromMeals, selectedSize.protein_qty)
              const carbSections = buildSections(carbIngsFromMeals, selectedSize.carb_qty)
              const vegNames = [...vegNameSet]

              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  {renderCard('Proteína', '#ef4444', proSections)}
                  {renderCard('Carbo', '#eab308', carbSections)}
                  <div style={{ flex: 1, background: colors.black, borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: `1px solid ${colors.grayLight}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 4 }}>Verdura</div>
                    {vegNames.length > 0 && <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>({vegNames.join(', ')})</div>}
                    <div style={{ fontSize: 22, fontWeight: 'bold', color: colors.orange }}>{selectedSize.veg_qty}g</div>
                  </div>
                </div>
              )
            })()}
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

        {inCriticalPeriod && extraStock.length === 0 && criticalConfig && (() => {
          const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
          const cutoffDay = DAYS[criticalConfig.cutoff_day]
          const reopenDay = DAYS[(criticalConfig.end_day + 1) % 7]
          return (
            <div style={{
              margin: '8px 0 20px',
              padding: '16px 20px',
              background: '#ef444411',
              border: '1px solid #ef4444',
              borderRadius: 10,
              color: '#ef4444',
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              <strong>Ya no hay stock disponible.</strong> Cierran sobrepedidos el {cutoffDay} — regresa el {reopenDay} para pedir.
            </div>
          )
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {visibleMeals.map(meal => {
            const qty = getQty(meal.id)
            const qtyCurrentSize = getQtyForCurrentSize(meal.id)
            const breakdown = getSizeBreakdown(meal.id)
            const isExpanded = expandedMealIds.has(meal.id)
            const extraQtyAvailable = selectedSize ? (extraStockMap.get(`${meal.id}|${selectedSize.id}`) ?? 0) : 0
            const canAdd = inCriticalPeriod ? qtyCurrentSize < extraQtyAvailable : true
            
            // Calcular macros para este meal con el size seleccionado
            let macros = null
            if (selectedSize) {
              const ingredientsMap = new Map(meal.ingredients.map(i => [i.id, i]))
              macros = calculateMealMacros(meal.mainRecipe, meal.subRecipes, ingredientsMap, selectedSize)
            }

            // Precio por platillo: custom sizes calculan por ingrediente del platillo
            const mealUnitPrice = selectedSize && !!selectedSize.customer_id
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
                {inCriticalPeriod && selectedSize && (
                  <div style={{
                    display: 'inline-block', marginBottom: 8,
                    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: extraQtyAvailable > 0 ? '#f97316' + '22' : '#ef444422',
                    border: `1px solid ${extraQtyAvailable > 0 ? '#f97316' : '#ef4444'}`,
                    color: extraQtyAvailable > 0 ? '#f97316' : '#ef4444',
                  }}>
                    {extraQtyAvailable > 0 ? `Stock limitado · ${extraQtyAvailable} disponibles` : 'Sin stock'}
                  </div>
                )}
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
                    disabled={!selectedSize || !canAdd}
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 18,
                      border: `1px solid ${colors.grayLight}`,
                      borderRadius: 8,
                      background: colors.grayLight,
                      color: colors.white,
                      cursor: (!selectedSize || !canAdd) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedSize || !canAdd) ? 0.5 : 1
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
          {!salesEnabled ? (
            <div style={{
              flex: 1, padding: '14px 20px', borderRadius: 8, textAlign: 'center',
              background: '#ef444422', border: '1px solid #ef4444',
              color: '#ef4444', fontSize: 14, fontWeight: 600,
            }}>
              Ventas temporalmente pausadas
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </main>
  )
}
