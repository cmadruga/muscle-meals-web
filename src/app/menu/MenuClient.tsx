'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import { createCustomSize, deleteCustomSize } from '@/app/actions/sizes'
import { calculateCustomSizePrice, PROTEIN_BASE, CARB_BASE } from '@/lib/utils/pricing'
import type { Size, Ingredient } from '@/lib/types'
import type { MealMenuData } from './page'

// ─── Modal de info "Que son las porciones" — copy editable ────────
const PORCIONES_MODAL = {
  title: 'Que son las porciones',
  intro: 'Cada platillo se arma con tres porciones: proteína, carbohidratos y verdura. El tamaño que eliges define cuantos gramos lleva cada una — el platillo es el mismo, lo que cambia es la cantidad.',
  sections: [
    {
      key: 'protein' as const,
      label: 'Proteína',
      color: '#F79138' as string,
      note: 'Se pesa en crudo',
      description: 'La base del platillo. Es la porcion que mas cambia entre tamaños y la que define la proteína total del dia.',
    },
    {
      key: 'carb' as const,
      label: 'Carbohidratos',
      color: '#e8c07d' as string,
      note: 'Se pesa en crudo',
      description: 'El acompañamiento que da la energia. Se pesa antes de cocerse o hidratarse, asi que en el plato se ve mas volumen del que dice el gramaje.',
    },
    {
      key: 'veggie' as const,
      label: 'Verdura',
      color: '#7ac77a' as string,
      note: 'Se pesa en crudo',
      description: 'La porcion de verdura, siempre fresca. Va en todos los tamaños y aporta volumen y fibra sin subir mucho las calorias.',
    },
  ],
  cta: 'Entendido',
}

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  bg:      '#151412',
  card:    '#1f1d1b',
  navbar:  '#0c0a09',
  orange:  '#F79138',
  green:   '#7ac77a',
  yellow:  '#e8c07d',
  text:    '#F5F1EC',
  muted:   'rgba(245,241,236,.55)',
  faint:   'rgba(245,241,236,.42)',
  ghost:   'rgba(255,255,255,.04)',
  border:  'rgba(255,255,255,.09)',
  border2: 'rgba(255,255,255,.12)',
}
const F = {
  display: `'Franchise','Big Shoulders Display',sans-serif`,
  body:    `Barlow,system-ui,sans-serif`,
  cond:    `'Franchise','Barlow Condensed',sans-serif`,
}

// ─── Types ────────────────────────────────────────────────────────
// ids: uno o más ingredient_id que comparten el mismo nombre público (ej. todas las variantes de "Pasta")
// El slider representa a todos; al guardar el mismo valor se escribe para cada id del grupo
type IngRow = { ids: string[]; name: string; value: number; fitRef: number }
type CategoryFilter = 'all' | 'pollo' | 'res' | 'pescado'

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all:     'Todos',
  pollo:   'Pollo',
  res:     'Res',
  pescado: 'Pescado',
}

// ─── Props ───────────────────────────────────────────────────────
interface Props {
  meals:           MealMenuData[]
  sizes:           Size[]
  soldOut:         string[]
  stockLimits:     Record<string, number>   // mealId → qty (vacío fuera de período crítico)
  salesEnabled:    boolean
  isAuthenticated: boolean
  deliveryDate:    string
  fitSize:         Size | null
  proIngredients:  Ingredient[]
  carbIngredients: Ingredient[]
  vegIngredients:  Ingredient[]
  customerSizes:   Size[]                   // tamaños personalizados guardados
  proIdsByName:    Record<string, string[]> // todos los ids de pro por nombre (incluyendo inactivos)
  carbIdsByName:   Record<string, string[]> // todos los ids de carb por nombre (incluyendo inactivos)
}

// ─── Helpers ────────────────────────────────────────────────────
function sizeProteinQty(size: Size): number {
  if (!size.protein_qty) return 0
  return Number(Object.values(size.protein_qty)[0] ?? 0)
}
function sizeCarbQty(size: Size): number {
  if (!size.carb_qty) return 0
  return Number(Object.values(size.carb_qty)[0] ?? 0)
}
function sizeVegQty(size: Size): number {
  if (!size.veg_qty) return 0
  return Number(size.veg_qty)
}
/** Calcula rango min–max de precio de un tamaño con ingredientes múltiples, usando FIT como referencia */
function computeSizePriceRange(size: Size, fitSize: Size | null) {
  if (!size.protein_qty || !size.carb_qty || !fitSize?.protein_qty || !fitSize?.carb_qty) return null
  const fitPro = fitSize.protein_qty as Record<string, number>
  const fitCarb = fitSize.carb_qty as Record<string, number>
  const proNorm = Object.entries(size.protein_qty as Record<string, number>)
    .map(([id, qty]) => {
      const ref = fitPro[id] ?? Number(Object.values(fitPro)[0] ?? 0)
      return ref > 0 ? Number(qty) * PROTEIN_BASE.FIT / ref : Number(qty)
    }).filter(v => v > 0)
  const carbNorm = Object.entries(size.carb_qty as Record<string, number>)
    .map(([id, qty]) => {
      const ref = fitCarb[id] ?? Number(Object.values(fitCarb)[0] ?? 0)
      return ref > 0 ? Number(qty) * CARB_BASE.FIT / ref : Number(qty)
    }).filter(v => v > 0)
  if (proNorm.length === 0 || carbNorm.length === 0) return null
  const proMin = Math.min(...proNorm), proMax = Math.max(...proNorm)
  const carbMin = Math.min(...carbNorm), carbMax = Math.max(...carbNorm)
  const rMin = calculateCustomSizePrice(proMin, carbMin, size.veg_qty ?? 0)
  const rMax = calculateCustomSizePrice(proMax, carbMax, size.veg_qty ?? 0)
  return {
    rMin, rMax,
    isRange: rMin.price !== rMax.price || rMin.packagePrice !== rMax.packagePrice,
  }
}

/** Gramos de un ingrediente en un tamaño: busca por ID, cae a 'default' si no hay clave específica */
function getSizeIngQty(size: Size, dict: 'protein_qty' | 'carb_qty', ingredientId: string): number {
  const qtys = size[dict]
  if (!qtys) return 0
  return Number(qtys[ingredientId] ?? qtys['default'] ?? 0)
}

// ─── Package banner — sidebar card version ───────────────────────
function PackageBannerCard({ savings }: { savings: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 11, background: 'rgba(122,199,122,.1)', border: '1px solid rgba(122,199,122,.3)' }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: C.green, color: '#0f0d0c', font: `700 12px/22px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>✓</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.16em', textTransform: 'uppercase', color: C.green }}>Precio de paquete</div>
        <div style={{ marginTop: 3, font: `400 12px/1.3 ${F.body}`, color: 'rgba(122,199,122,.75)' }}>Cada meal bajó al precio de paquete.</div>
      </div>
      {savings > 0 && (
        <span style={{ flexShrink: 0, font: `700 14px/1 ${F.body}`, color: C.green }}>Ahorras ${(savings / 100).toFixed(0)}</span>
      )}
    </div>
  )
}

// ─── Package banner — left panel bar version (full-width, thin) ──
function PackageBannerBar({ savings }: { savings: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 10, background: 'rgba(122,199,122,.1)', border: '1px solid rgba(122,199,122,.3)' }}>
      <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', background: C.green, color: '#0f0d0c', font: `700 11px/20px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>✓</span>
      <span style={{ flex: 1, font: `500 13px/1.2 ${F.body}`, color: C.green }}>
        Precio de paquete activo — cada meal bajó al precio con descuento.
      </span>
      {savings > 0 && (
        <span style={{ flexShrink: 0, font: `700 14px/1 ${F.body}`, color: C.green }}>Ahorras ${(savings / 100).toFixed(0)}</span>
      )}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────
export default function MenuClient({
  meals, sizes, soldOut, stockLimits, salesEnabled,
  isAuthenticated, deliveryDate, fitSize,
  proIngredients, carbIngredients, vegIngredients, customerSizes,
  proIdsByName, carbIdsByName,
}: Props) {
  const router = useRouter()
  const cart = useCartStore()

  // Active size (which size pill is selected for NEW items)
  const [activeSizeId, setActiveSizeId] = useState<string>(
    fitSize?.id ?? sizes[0]?.id ?? ''
  )
  // Custom size created during this session
  const [customSizeData, setCustomSizeData] = useState<Size | null>(null)

  // Custom size panel (independent from active size)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customUnit, setCustomUnit] = useState<'crudo' | 'cocido'>('crudo')
  const [customPro, setCustomPro] = useState<IngRow[]>([])
  const [customCarb, setCustomCarb] = useState<IngRow[]>([])
  const [customVeg, setCustomVeg] = useState(fitSize ? sizeVegQty(fitSize) : 70)
  const [savingCustom, setSavingCustom] = useState(false)

  // Category filter
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

  // Info modal "Que son las porciones"
  const [showInfoModal, setShowInfoModal] = useState(false)
  // Editar tamaño personalizado
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null)
  // Confirmación inline de Eliminar
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingSize, setDeletingSize] = useState(false)

  // Toast para avisos de carrito (persistente — cierre manual)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  // Hint de corta duración (tap en disabled en móvil)
  const [hintMsg, setHintMsg] = useState<string | null>(null)
  function showHint(msg: string) {
    setHintMsg(msg)
    setTimeout(() => setHintMsg(null), 2800)
  }
  function onCritDisabledClick() {
    showHint('Con stock limitado solo están disponibles los tamaños default')
  }

  // Sticky bar visibility
  const [showStickyBar, setShowStickyBar] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  // Mobile bottom drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Portals solo después de hidratación (evita SSR mismatch)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // All sizes: globales + guardadas del cliente + nueva creada en esta sesión
  // Período crítico: stockLimits tiene datos solo cuando se está en cutoff
  const inCriticalPeriod = Object.keys(stockLimits).length > 0

  const allSizes = [
    ...sizes,
    ...customerSizes.filter(cs => !sizes.some(s => s.id === cs.id)),
    ...(customSizeData ? [customSizeData] : []),
  ]
  const activeSize = allSizes.find(s => s.id === activeSizeId) ?? sizes[0]
  // Un size personalizado está activo cuando es de un cliente O es el recién creado
  const isCustomActive = !!activeSize?.customer_id || (!!customSizeData && activeSizeId === customSizeData.id)
  // Rango de precio para el tamaño activo (solo custom, usando FIT como referencia)
  const activeSizePriceRange = (!showCustom && isCustomActive && activeSize)
    ? computeSizePriceRange(activeSize, fitSize)
    : null
  // Si showCustom está abierto, ningún tamaño default muestra como activo
  const activeSizeForUI = (showCustom && !editingSizeId) ? '' : activeSizeId

  // Cart computed
  const individualItems = cart.items.filter(i => !i.packageInstanceId)
  const totalQty = individualItems.reduce((s, i) => s + i.qty, 0)
  const isPackage = totalQty >= 5
  const toDiscount = Math.max(0, 5 - totalQty)
  const progressPct = Math.min(100, (totalQty / 5) * 100)

  const savings = isPackage
    ? individualItems.reduce((s, i) => s + (i.unitPrice - (i.packagePrice ?? i.unitPrice)) * i.qty, 0)
    : 0

  const sidebarTotal = individualItems.reduce((s, i) => {
    const price = isPackage && i.packagePrice ? i.packagePrice : i.unitPrice
    return s + price * i.qty
  }, 0)

  // Filtered meals
  const filteredMeals = activeCategory === 'all'
    ? meals
    : meals.filter(m => m.category === activeCategory)

  // Available categories (only show chips for categories that have meals)
  const availableCategories = (['all', 'pollo', 'res', 'pescado'] as CategoryFilter[]).filter(cat => {
    if (cat === 'all') return true
    return meals.some(m => m.category === cat)
  })

  // Custom size live price preview — replica la lógica del CustomSizePanel viejo:
  // normaliza cada ingrediente por su fitRef, luego toma min y max para mostrar rango.
  // normQty = qty * BASE.FIT / fitRef  (idéntico a: qty * PROTEIN_BASE.FIT / fitSize.protein_qty[id])
  const proNormValues = customPro
    .filter(r => r.value > 0)
    .map(r => r.fitRef > 0 ? r.value * PROTEIN_BASE.FIT / r.fitRef : r.value)
  const carbNormValues = customCarb
    .filter(r => r.value > 0)
    .map(r => r.fitRef > 0 ? r.value * CARB_BASE.FIT / r.fitRef : r.value)

  const proMin = proNormValues.length > 0 ? Math.min(...proNormValues) : 0
  const proMax = proNormValues.length > 0 ? Math.max(...proNormValues) : 0
  const carbMin = carbNormValues.length > 0 ? Math.min(...carbNormValues) : 0
  const carbMax = carbNormValues.length > 0 ? Math.max(...carbNormValues) : 0

  const customPriceMin = proMin > 0 ? calculateCustomSizePrice(proMin, carbMin, customVeg) : null
  const customPriceMax = proMax > 0 ? calculateCustomSizePrice(proMax, carbMax, customVeg) : null
  // Alias para compat con código existente (si no hay rango, min === max)
  const customPreviewPrice = customPriceMin
  const customPriceIsRange = !!(customPriceMin && customPriceMax &&
    (customPriceMin.price !== customPriceMax.price || customPriceMin.packagePrice !== customPriceMax.packagePrice))

  // ── Scroll observer for sticky bar ──────────────────────────────
  useEffect(() => {
    const el = selectorRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Init custom size rows from ingredients ───────────────────────
  // Ingredientes con el mismo nombre público se agrupan en un solo slider.
  // Ej: "Pasta Pluma" + "Pasta Penne" ambos con public_name="Pasta" → un IngRow con ids=[id1, id2].
  // Al guardar el tamaño, el mismo valor se escribe para TODOS los ids del grupo.
  function groupIngredientsByName(
    ingredients: Ingredient[],
    defaultValue: number,
    fitRef: number,
  ): IngRow[] {
    const seen = new Map<string, IngRow>()
    for (const i of ingredients) {
      const name = i.public_name ?? i.name
      if (seen.has(name)) {
        seen.get(name)!.ids.push(i.id)
      } else {
        seen.set(name, { ids: [i.id], name, value: defaultValue, fitRef })
      }
    }
    return Array.from(seen.values())
  }

  useEffect(() => {
    const fitPro = fitSize ? sizeProteinQty(fitSize) : 180
    const fitCarb = fitSize ? sizeCarbQty(fitSize) : 55
    setCustomPro(groupIngredientsByName(proIngredients, fitPro, fitPro))
    setCustomCarb(groupIngredientsByName(carbIngredients, fitCarb, fitCarb))
  }, [proIngredients, carbIngredients, fitSize])

  // ── Limpiar carrito al montar: agotados + personalizados en período crítico ──
  // Se ejecuta una sola vez. Ambos tipos de eliminación se combinan en un toast.
  useEffect(() => {
    const { items, updateQty } = useCartStore.getState()
    const soldOutNames: string[] = []
    const mainSizeIds = new Set(sizes.map(s => s.id))
    let customRemoved = 0

    for (const item of items) {
      if (item.packageInstanceId) continue
      const isSoldOutItem = soldOut.includes(item.mealId)
      const isCustomSize = inCriticalPeriod && !mainSizeIds.has(item.sizeId)

      if (isSoldOutItem || isCustomSize) {
        updateQty(item.mealId, item.sizeId, 0)
        if (isSoldOutItem) {
          const meal = meals.find(m => m.id === item.mealId)
          if (meal && !soldOutNames.includes(meal.name)) soldOutNames.push(meal.name)
        }
        if (isCustomSize) customRemoved++
      }
    }

    // Clamp stock si superan el límite (no genera toast)
    if (Object.keys(stockLimits).length > 0) {
      const { items: updatedItems, updateQty: updateQty2 } = useCartStore.getState()
      const totalByMeal = new Map<string, { sizeId: string; qty: number }[]>()
      for (const item of updatedItems) {
        if (item.packageInstanceId) continue
        const arr = totalByMeal.get(item.mealId) ?? []
        arr.push({ sizeId: item.sizeId, qty: item.qty })
        totalByMeal.set(item.mealId, arr)
      }
      for (const [mealId, sizeItems] of totalByMeal) {
        const limit = stockLimits[mealId]
        if (limit === undefined) continue
        const total = sizeItems.reduce((s, i) => s + i.qty, 0)
        if (total <= limit) continue
        let excess = total - limit
        for (let i = sizeItems.length - 1; i >= 0 && excess > 0; i--) {
          const cut = Math.min(sizeItems[i].qty, excess)
          updateQty2(mealId, sizeItems[i].sizeId, sizeItems[i].qty - cut)
          excess -= cut
        }
      }
    }

    // Construir toast combinado si hay algo que reportar
    const parts: string[] = []
    if (soldOutNames.length > 0) {
      parts.push(`${soldOutNames.join(', ')} ${soldOutNames.length !== 1 ? 'están agotados.' : 'está agotado.'}`)
    }
    if (customRemoved > 0) {
      parts.push(`${customRemoved} ${customRemoved !== 1 ? 'platillos tenían tamaño personalizado' : 'platillo tenía tamaño personalizado'} (no disponible en período de stock limitado)`)
    }
    if (parts.length > 0) {
      setToastMsg(`Se eliminaron del carrito: ${parts.join('\n ')}.`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cart helpers ─────────────────────────────────────────────────
  function getQty(mealId: string, sizeId: string) {
    return cart.items.find(i => i.mealId === mealId && i.sizeId === sizeId && !i.packageInstanceId)?.qty ?? 0
  }

  /** Qty total del meal en carrito (sumando todos sus tamaños) */
  function getMealTotalQty(mealId: string) {
    return cart.items
      .filter(i => i.mealId === mealId && !i.packageInstanceId)
      .reduce((s, i) => s + i.qty, 0)
  }

  function addMeal(meal: MealMenuData) {
    if (!activeSize) return
    const limit = stockLimits[meal.id]
    if (limit !== undefined && getMealTotalQty(meal.id) >= limit) return
    cart.addItem({
      mealId: meal.id,
      mealName: meal.name,
      sizeId: activeSize.id,
      sizeName: activeSize.name,
      qty: 1,
      unitPrice: activeSize.price,
      packagePrice: activeSize.package_price,
    })
  }

  function setMealQty(meal: MealMenuData, sizeId: string, qty: number) {
    const size = allSizes.find(s => s.id === sizeId)
    // Calcular qty máxima permitida para este size
    const limit = stockLimits[meal.id]
    let cappedQty = qty
    if (limit !== undefined && qty > 0) {
      const currentForThisSize = getQty(meal.id, sizeId)
      const otherSizesQty = getMealTotalQty(meal.id) - currentForThisSize
      cappedQty = Math.min(qty, limit - otherSizesQty)
    }

    if (cappedQty <= 0) {
      cart.updateQty(meal.id, sizeId, 0)
    } else {
      if (getQty(meal.id, sizeId) === 0) {
        if (!size) return
        cart.addItem({
          mealId: meal.id,
          mealName: meal.name,
          sizeId: size.id,
          sizeName: size.name,
          qty: cappedQty,
          unitPrice: size.price,
          packagePrice: size.package_price,
        })
      } else {
        cart.updateQty(meal.id, sizeId, cappedQty)
      }
    }
  }

  // Items grouped by size for sidebar
  const sidebarGroups: { size: Size | null; sizeName: string; sizeId: string; items: typeof cart.items }[] = []
  const bySize = new Map<string, typeof cart.items[0][]>()
  for (const item of individualItems) {
    const arr = bySize.get(item.sizeId) ?? []
    arr.push(item)
    bySize.set(item.sizeId, arr)
  }
  for (const [sizeId, items] of bySize) {
    const size = allSizes.find(s => s.id === sizeId) ?? null
    sidebarGroups.push({ size, sizeName: items[0].sizeName, sizeId, items })
  }

  // ── Custom size helpers ───────────────────────────────────────────
  async function handleCreateCustomSize() {
    if (!customName.trim()) return
    setSavingCustom(true)
    try {
      const proQty: Record<string, number> = {}
      // Usa proIdsByName para incluir variantes inactivas del mismo grupo (ej. proteínas no en meals activos).
      // Si no hay entrada en el mapa, cae al grupo conocido (row.ids).
      customPro.forEach(r => {
        if (r.value > 0) {
          const allIds = proIdsByName[r.name] ?? r.ids
          allIds.forEach(id => { proQty[id] = r.value })
        }
      })
      const carbQty: Record<string, number> = {}
      // Ídem para carbo: guarda el mismo valor para todas las pastas/arroces aunque no estén activos
      customCarb.forEach(r => {
        if (r.value > 0) {
          const allIds = carbIdsByName[r.name] ?? r.ids
          allIds.forEach(id => { carbQty[id] = r.value })
        }
      })

      const res = await createCustomSize({
        name: customName,
        protein_qty: proQty,
        carb_qty: carbQty,
        veg_qty: customVeg,
        sizeId: editingSizeId ?? undefined,
      })
      if (res?.size?.id) {
        setCustomSizeData(res.size)
        setActiveSizeId(res.size.id)
        setShowCustom(false)
        setEditingSizeId(null)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingCustom(false)
    }
  }

  /** Abre el panel de custom precargado con los valores del tamaño a editar */
  function handleEditCustomSize(size: Size) {
    const fitPro = fitSize ? sizeProteinQty(fitSize) : PROTEIN_BASE.FIT
    const fitCarb = fitSize ? sizeCarbQty(fitSize) : CARB_BASE.FIT
    setCustomName(size.name)
    setCustomPro(groupIngredientsByName(proIngredients, fitPro, fitPro).map(row => ({
      ...row,
      // Toma el valor del primer id del grupo que tenga valor guardado
      value: row.ids.reduce((v, id) => v || getSizeIngQty(size, 'protein_qty', id), 0),
    })))
    setCustomCarb(groupIngredientsByName(carbIngredients, fitCarb, fitCarb).map(row => ({
      ...row,
      value: row.ids.reduce((v, id) => v || getSizeIngQty(size, 'carb_qty', id), 0),
    })))
    setCustomVeg(size.veg_qty)
    setEditingSizeId(size.id)
    setShowCustom(true)
    setConfirmDeleteId(null)
  }

  /** Elimina el tamaño personalizado; si era el activo cae a FIT */
  async function handleDeleteCustomSize(sizeId: string) {
    setDeletingSize(true)
    try {
      const res = await deleteCustomSize(sizeId)
      if (!res.error) {
        if (activeSizeId === sizeId) {
          setActiveSizeId(fitSize?.id ?? sizes[0]?.id ?? '')
        }
        setConfirmDeleteId(null)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingSize(false)
    }
  }

  function useAsFitBase() {
    if (!fitSize) return
    setCustomPro(r => r.map(row => ({ ...row, value: sizeProteinQty(fitSize) })))
    setCustomCarb(r => r.map(row => ({ ...row, value: sizeCarbQty(fitSize) })))
    setCustomVeg(sizeVegQty(fitSize))
  }

  // ── Sidebar group header label ────────────────────────────────────
  function sidebarGroupLabel(group: typeof sidebarGroups[0]) {
    const size = group.size
    const itemCount = group.items.reduce((s, i) => s + i.qty, 0)
    if (!size) return `${group.sizeName} · ${itemCount} meal${itemCount !== 1 ? 's' : ''}`
    return `${size.name} · ${itemCount} meal${itemCount !== 1 ? 's' : ''}`
  }

  // ── Sidebar content (shared between desktop aside and mobile drawer)
  function renderSidebar() {
    const subtotalNoDiscount = individualItems.reduce((s, i) => s + i.unitPrice * i.qty, 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

        {/* ── Header (always visible — never scrolls) ─────────────────── */}
        <div style={{ padding: '14px 20px 14px', flexShrink: 0, borderBottom: totalQty > 0 ? `1px solid rgba(255,255,255,.07)` : 'none', background: '#0c0a09' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: totalQty === 0 ? 0 : 12 }}>
            <span style={{ font: `700 26px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>Tu semana</span>
            <span style={{ font: `700 23px/1 ${F.display}`, color: 'rgba(245,241,236,.7)' }}>{totalQty} meal{totalQty !== 1 ? 's' : ''}</span>
          </div>

          {/* Package banner or progress — only when there are items */}
          {isPackage ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, background: 'rgba(122,199,122,.1)', border: '1px solid rgba(122,199,122,.3)' }}>
              <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', background: C.green, color: '#0f0d0c', font: `700 11px/20px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>✓</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `700 14px/1 ${F.cond}`, letterSpacing: '.1em', textTransform: 'uppercase', color: C.green }}>Precio de paquete activo</div>
              </div>
            </div>
          ) : totalQty > 0 ? (
            <div style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(247,145,56,.08)', border: '1px solid rgba(247,145,56,.22)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ font: `600 13px/1.3 ${F.body}`, color: C.text }}>
                  Te falt{toDiscount === 1 ? 'a' : 'an'} {toDiscount} para paquete
                </span>
                <span style={{ font: `700 13px/1 ${F.body}`, color: C.orange }}>{totalQty}/5</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: C.orange, width: `${progressPct}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Items area (only this section scrolls) ──────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', minHeight: 0 }}>
          {/* fondo.jpg texture overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/media/Fondo.jpg)', backgroundSize: '320px', backgroundRepeat: 'repeat', opacity: 0.25, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, padding: totalQty > 0 ? '18px 22px 18px' : '0' }}>

          {/* Empty state */}
          {totalQty === 0 && (
            <div style={{ padding: '32px 22px', textAlign: 'center' }}>
              <Image src="/media/mascota.png" alt="" width={104} height={104} style={{ width: 96, height: 'auto', display: 'block', margin: '0 auto 14px' }} />
              <div style={{ font: `700 20px/1.05 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Empieza a armar</div>
              <p style={{ margin: '8px 0 0', font: `400 13.5px/1.5 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>
                Toca un meal y aparecer&#225; aqu&#237;. Puedes repetirlo y mezclar tama&#241;os.
              </p>
              <div style={{ marginTop: 16, padding: 15, borderRadius: 11, background: 'rgba(247,145,56,.07)', border: '1px solid rgba(247,145,56,.18)', textAlign: 'left' }}>
                <div style={{ font: `700 15px/1 ${F.cond}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.orange }}>Mas meals, mas ahorro</div>
                <p style={{ margin: '7px 0 0', font: `400 13px/1.5 ${F.body}`, color: 'rgba(245,241,236,.65)' }}>Al llegar a 5 meals cada meal baja al precio de paquete. No necesitas hacer nada.</p>
              </div>
            </div>
          )}

          {sidebarGroups.map(group => (
            <div key={group.sizeId} style={{ marginBottom: isPackage ? 16 : 20 }}>
              {/* Group header */}
              <div style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)', marginBottom: 10 }}>
                {sidebarGroupLabel(group)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isPackage ? 8 : 9 }}>
                {group.items.map(item => {
                  const meal = meals.find(m => m.id === item.mealId)
                  const displayPrice = isPackage && item.packagePrice ? item.packagePrice : item.unitPrice
                  const thumbSize = isPackage ? 38 : 42
                  return (
                    <div key={`${item.mealId}-${item.sizeId}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: isPackage ? '9px 10px' : '10px', borderRadius: 10, background: 'rgba(255,255,255,.035)' }}>
                      {/* Thumbnail */}
                      {meal?.img ? (
                        <div style={{ width: thumbSize, height: thumbSize, flexShrink: 0, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                          <Image src={meal.img} alt={meal.name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: thumbSize, height: thumbSize, flexShrink: 0, borderRadius: 8, border: '1px dashed rgba(245,241,236,.2)', background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 6px,transparent 6px 12px)' }} />
                      )}
                      {/* Name + price */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: `600 14px/1.25 ${F.body}`, color: C.text }}>{item.mealName}</div>
                        {isPackage ? (
                          <div style={{ marginTop: 2, font: `400 12.5px/1.3 ${F.body}`, color: C.green }}>
                            ${(displayPrice / 100).toFixed(0)} c/u
                          </div>
                        ) : (
                          <div style={{ marginTop: 2, font: `400 12.5px/1.3 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>
                            ${(displayPrice / 100).toFixed(0)} c/u
                          </div>
                        )}
                      </div>
                      {/* Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: isPackage ? 7 : 8 }}>
                        <button onClick={() => setMealQty(meal!, item.sizeId, item.qty - 1)}
                          style={{ width: isPackage ? 23 : 24, height: isPackage ? 23 : 24, borderRadius: 6, background: 'rgba(255,255,255,.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,241,236,.7)', font: `600 14px/1 ${F.body}`, cursor: 'pointer' }}>−</button>
                        <span style={{ font: `700 14px/1 ${F.body}`, color: C.text }}>{item.qty}</span>
                        <button onClick={() => setMealQty(meal!, item.sizeId, item.qty + 1)}
                          style={{ width: isPackage ? 23 : 24, height: isPackage ? 23 : 24, borderRadius: 6, background: 'rgba(255,255,255,.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,241,236,.7)', font: `600 14px/1 ${F.body}`, cursor: 'pointer' }}>+</button>
                      </div>
                      {/* Line total */}
                      <span style={{ minWidth: isPackage ? 48 : 52, textAlign: 'right', font: `600 14px/1 ${F.body}`, color: C.text }}>
                        ${(displayPrice * item.qty / 100).toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          </div>{/* end inner zIndex wrapper */}
        </div>{/* end scrollable items area */}

        {/* ── Totals + CTA (always visible at bottom, never scrolls) ─── */}
        <div style={{ flexShrink: 0, padding: '14px 20px 16px', borderTop: `1px solid rgba(255,255,255,.08)`, background: '#0c0a09' }}>
          {totalQty > 0 && (
            <div style={{ font: `400 13px/1.75 ${F.body}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(245,241,236,.5)' }}>Subtotal ({totalQty})</span>
                {isPackage ? (
                  <span style={{ color: 'rgba(245,241,236,.38)', textDecoration: 'line-through' }}>${(subtotalNoDiscount / 100).toFixed(0)}</span>
                ) : (
                  <span style={{ color: 'rgba(245,241,236,.5)' }}>${(subtotalNoDiscount / 100).toFixed(0)}</span>
                )}
              </div>
              {isPackage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.green }}>
                  <span>Descuento paquete</span>
                  <span>{savings > 0 ? `−$${(savings / 100).toFixed(0)}` : '—'}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ font: `500 13px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>Total</span>
            <span style={{ font: `700 ${totalQty > 0 ? (isPackage ? 30 : 28) : 26}px/1 ${F.display}`, color: totalQty > 0 ? C.text : 'rgba(245,241,236,.3)' }}>
              ${totalQty > 0 ? (sidebarTotal / 100).toFixed(0) : '0'}
            </span>
          </div>
          <div>
            <button
              onClick={() => { if (totalQty > 0) router.push('/checkout') }}
              disabled={totalQty === 0}
              style={{ width: '100%', padding: '15px 0', border: 0, borderRadius: 10, background: totalQty === 0 ? 'rgba(255,255,255,.07)' : C.orange, color: totalQty === 0 ? 'rgba(245,241,236,.3)' : '#17140f', font: `700 20px/1 ${F.display}`, letterSpacing: '.1em', textTransform: 'uppercase', cursor: totalQty === 0 ? 'not-allowed' : 'pointer', boxShadow: totalQty > 0 ? '0 8px 26px rgba(247,145,56,.24)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Ir a pagar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ─── Layout ───────────────────────────────────────────── */
        .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: start; }
        .main-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; min-height: calc(100vh - 64px); align-items: start; }
        .menu-sidebar { display: flex; flex-direction: column; }
        .mobile-bar { display: none !important; }
        /* ─── Left column — fondo.jpg texture ─────────────────── */
        .menu-main-col { position: relative; }
        .menu-main-col::before { content: ''; position: absolute; inset: 0; background-image: url('/media/Fondo.jpg'); background-size: cover; background-position: center top; background-repeat: no-repeat; opacity: 0.28; pointer-events: none; z-index: 0; }

        /* ─── Size selector cards ──────────────────────────────── */
        .size-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(158px, 1fr)); gap: 10px; margin-bottom: 16px; }
        .size-card { position: relative; padding: 16px 15px; border-radius: 11px; cursor: pointer; }
        .size-name { font: 700 26px/1 'Franchise','Big Shoulders Display',sans-serif; text-transform: uppercase; }
        .badge-featured-text { display: inline; }
        .badge-featured-star { display: none !important; }
        .info-btn-desktop { display: flex; }
        .info-btn-mobile { display: none !important; }
        .size-label-sub { display: inline; }
        .new-label-desktop { display: inline; }
        .new-label-mobile { display: none !important; }

        /* ─── Bloque de porciones ──────────────────────────────── */
        .portions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: start; }
        .portion-col { display: block; border: 1px solid rgba(255,255,255,.1); border-radius: 11px; background: rgba(255,255,255,.03); padding: 13px 15px 11px; }
        .portion-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 5px 0; }
        .portion-name { font: 400 12.5px/1.2 Barlow,sans-serif; color: rgba(245,241,236,.62); }
        .portion-grams { flex: none; font: 700 16px/1 Barlow,sans-serif; color: #F5F1EC; }
        .portion-label { font: 700 11.5px/1 'Franchise','Big Shoulders Display',sans-serif; letter-spacing: .16em; text-transform: uppercase; }

        /* ─── Custom panel sliders ─────────────────────────────── */
        .custom-grid { display: grid; grid-template-columns: 1fr 240px 132px; align-items: center; gap: 18px; }
        .ing-row { display: grid; grid-template-columns: 1fr 240px 132px; align-items: center; gap: 18px; }
        .sticky-bar-macros { display: block; }

        /* ─── Sticky bar — fixed via portal. El sidebar mide 320px pero
             zoom:1.1 en .public-content lo escala a 320×1.1=352px en viewport ─── */
        .sticky-bar { right: calc(320px * 1.1); }

        /* ─── 1100px: meal grid 2 cols ─────────────────────────── */
        @media (max-width: 1100px) {
          .menu-grid { grid-template-columns: repeat(2, 1fr); }
          .sticky-bar-macros { display: none !important; }
        }
        @media (max-width: 820px) {
          .menu-grid { grid-template-columns: 1fr; }
        }

        /* ─── 641-900px: iPad — panel personalizado usa layout apilado (igual que móvil) ─────── */
        @media (max-width: 900px) and (min-width: 641px) {
          .menu-main-col { overflow-x: clip; }
          .custom-grid { grid-template-columns: 1fr auto; row-gap: 10px; column-gap: 10px; align-items: center; }
          .custom-grid > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; }
          .custom-grid > *:nth-child(3) { grid-row: 1; grid-column: 2; }
          .ing-row { grid-template-columns: 1fr auto; row-gap: 10px; column-gap: 10px; align-items: center; }
          .ing-row > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; }
          .ing-row > *:nth-child(3) { grid-row: 1; grid-column: 2; }
        }

        /* ─── 640px: mobile layout ─────────────────────────────── */
        @media (max-width: 640px) {
          .menu-grid { grid-template-columns: 1fr; }
          /* clip no crea scroll container → preserva position:sticky */
          .main-layout { grid-template-columns: 1fr; overflow-x: clip; }
          .menu-main-col { overflow-x: clip; }
          .menu-sidebar { display: none !important; }
          .mobile-bar { display: flex !important; }
          /* Size cards — móvil */
          .size-grid { grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: 6px; margin-bottom: 12px; }
          .size-card { padding: 10px 8px !important; border-radius: 9px !important; }
          .size-name { font-size: 18px !important; }
          .new-label-desktop { display: none !important; }
          .new-label-mobile { display: inline !important; }
          .badge-featured-text { display: none !important; }
          .badge-featured-star { display: inline !important; }
          .info-btn-desktop { display: none !important; }
          .info-btn-mobile { display: flex !important; }
          .size-label-sub { display: none !important; }
          /* Porciones — móvil */
          .portions-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .portion-col { padding: 11px 12px 9px !important; border-radius: 10px !important; }
          .portion-label { font-size: 10.5px !important; letter-spacing: .14em !important; }
          .portion-row { display: block; padding: 3px 0; }
          .portion-name { display: block; font-size: 11px !important; color: rgba(245,241,236,.55); }
          .portion-grams { display: block; font-size: 15px !important; margin-top: 2px; }
          /* Custom panel sliders — móvil */
          .custom-grid { grid-template-columns: 1fr auto; row-gap: 10px; column-gap: 10px; align-items: center; }
          .custom-grid > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; }
          .custom-grid > *:nth-child(3) { grid-row: 1; grid-column: 2; }
          .ing-row { grid-template-columns: 1fr auto; row-gap: 10px; column-gap: 10px; align-items: center; }
          .ing-row > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; }
          .ing-row > *:nth-child(3) { grid-row: 1; grid-column: 2; }
          .sticky-bar { padding: 10px 14px !important; right: 0 !important; }
          /* Custom panel — precio y botones en móvil */
          .custom-price-preview { flex-direction: row; flex-wrap: wrap; gap: 10px 20px !important; }
          .custom-btns { grid-template-columns: 1fr auto !important; }
          .custom-btn-cancel { padding: 12px 18px !important; font-size: 13px !important; }
        }

        /* ─── Hover / interactivos ─────────────────────────────── */
        .size-card:hover { background: rgba(255,255,255,.06) !important; }
        .size-card-new:hover { border-color: #F79138 !important; }
        .info-btn-desktop:hover, .info-btn-mobile:hover { border-color: #F79138 !important; color: #F5F1EC !important; }
        .edit-btn:hover { border-color: #F79138 !important; color: #F5F1EC !important; }
        .del-btn:hover { border-color: rgba(255,120,120,.5) !important; color: #ff9b9b !important; }
        .meal-card:hover { border-color: rgba(255,255,255,.18) !important; }
        .add-btn:hover { background: #ffa252 !important; }

        /* ─── Modal de info (portal) ────────────────────────────── */
        .info-modal-portal { position: fixed; inset: 0; z-index: 9999; background: rgba(8,7,6,.78); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .info-modal { background: #14110f; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; width: 100%; max-width: 640px; max-height: 600px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
        .info-modal-handle { display: none; width: 38px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.18); }
        .info-modal-body { flex: 1; overflow-y: auto; padding: 6px 26px 0; }
        .info-modal-footer { display: flex; justify-content: flex-end; padding: 16px 26px 20px; border-top: 1px solid rgba(255,255,255,.07); flex-shrink: 0; }
        @media (max-width: 640px) {
          .info-modal-portal { align-items: flex-end; padding: 0; }
          .info-modal { border-radius: 18px 18px 0 0; max-height: 88vh; max-width: 100%; border-bottom: none; }
          .info-modal-handle { display: block; }
          .info-modal-body { padding: 4px 18px 0; }
          .info-modal-footer { justify-content: stretch; padding: 12px 18px 28px; }
          .info-modal-footer button { width: 100% !important; padding: 15px 0 !important; }
        }

        /* ─── Misc ─────────────────────────────────────────────── */
        summary::-webkit-details-marker { display: none; }
        summary { list-style: none; }
        details[open] summary [data-caret] { transform: rotate(180deg); }
        details[open] summary [data-lbl-closed] { display: none; }
        details:not([open]) summary [data-lbl-open] { display: none; }
        .stepper-btn:hover { background: rgba(255,255,255,.14) !important; }
        .bottom-drawer { transform: translateY(100%); transition: transform .28s cubic-bezier(.4,0,.2,1); }
        .bottom-drawer.open { transform: translateY(0); }
        .drawer-overlay { opacity: 0; transition: opacity .28s; pointer-events: none; }
        .drawer-overlay.open { opacity: 1; pointer-events: auto; }
        input[type=range] { -webkit-appearance: none; appearance: none; margin: 0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 0; height: 0; }
      `}</style>

      {/* ── Main two-column layout ────────────────────────────────────── */}
      <div className="main-layout" style={{ background: C.bg }}>

        {/* ── LEFT: size selector + meal grid ──────────────────────────── */}
        <div className="menu-main-col" style={{ borderRight: `1px solid ${C.border}` }}>

          <div style={{ padding: '30px 28px 80px' }}>

          {/* Hero headline */}
          <h1 style={{ margin: '0 0 6px', font: `700 54px/.88 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>
            Arma tu semana
          </h1>
          <p style={{ margin: '0 0 26px', font: `400 15px/1.5 ${F.body}`, color: C.muted, maxWidth: '56ch' }}>
            Elige tu tamaño, agrega los meals que quieras y mira el total en vivo. Desde 5 el precio baja a paquete automaticamente.
          </p>

          {/* ── 1 · Tamaño ──────────────────────────────────────────────── */}
          <div ref={selectorRef}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                <span style={{ font: `700 19px/1 ${F.display}`, letterSpacing: '.16em', textTransform: 'uppercase', color: C.text, flexShrink: 0 }}>1 · Tu tamaño</span>
              </div>
              {/* Desktop info button */}
              <button className="info-btn-desktop" onClick={() => setShowInfoModal(true)}
                style={{ alignItems: 'center', gap: 7, flexShrink: 0, padding: '7px 11px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.03)', color: 'rgba(245,241,236,.7)', font: `500 12.5px/1 ${F.body}`, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(245,241,236,.4)', font: `700 10px/1 ${F.body}`, flexShrink: 0 }}>i</span>
                Que son las porciones
              </button>
              {/* Mobile info button */}
              <button className="info-btn-mobile" onClick={() => setShowInfoModal(true)}
                style={{ alignItems: 'center', gap: 6, flexShrink: 0, padding: '9px 11px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.03)', color: 'rgba(245,241,236,.7)', font: `500 12px/1 ${F.body}`, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: '50%', border: '1px solid rgba(245,241,236,.4)', font: `700 9.5px/1 ${F.body}`, flexShrink: 0 }}>i</span>
                Porciones
              </button>
            </div>

            {/* Cards grid — auto-fit, mismo componente desktop + mobile */}
            <div className="size-grid">
              {/* Tamaños globales (LOW/FIT/PLUS) */}
              {sizes.map(s => {
                const isActive = s.id === activeSizeForUI
                const isFeatured = s.name.toLowerCase() === 'fit'
                return (
                  <div key={s.id} className="size-card"
                    onClick={() => { setActiveSizeId(s.id); setShowCustom(false); setEditingSizeId(null) }}
                    style={{ border: `1px solid ${isActive ? C.orange : C.border2}`, background: isActive ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)' }}>
                    {isFeatured && (
                      <span className="badge-featured" style={{ position: 'absolute', top: -8, right: 11, padding: '3px 8px', borderRadius: 4, background: C.orange, color: '#17140f', font: `700 10px/1 ${F.body}`, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        <span className="badge-featured-text">★ El mas pedido</span>
                        <span className="badge-featured-star">★</span>
                      </span>
                    )}
                    <div className="size-name" style={{ color: isActive ? C.orange : C.text }}>{s.name}</div>
                  </div>
                )
              })}

              {/* Tamaños personalizados (guardados + recién creado) */}
              {[...customerSizes, ...(customSizeData && !customerSizes.some(cs => cs.id === customSizeData.id) ? [customSizeData] : [])].map(cs => {
                const isActive = cs.id === activeSizeForUI
                const disabled = inCriticalPeriod
                return (
                  <div key={cs.id} className="size-card"
                    onClick={() => disabled ? onCritDisabledClick() : (setActiveSizeId(cs.id), setShowCustom(false), setEditingSizeId(null))}
                    style={{ border: `1px solid ${isActive ? C.orange : 'rgba(255,255,255,.12)'}`, background: isActive ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.38 : 1 }}>
                    <span style={{ position: 'absolute', top: -8, right: 11, padding: '3px 7px', borderRadius: 4, background: isActive ? 'rgba(247,145,56,.9)' : 'rgba(255,255,255,.14)', color: isActive ? '#17140f' : 'rgba(245,241,236,.75)', font: `700 9.5px/1 ${F.body}`, letterSpacing: '.1em', textTransform: 'uppercase' }}>Custom</span>
                    <div className="size-name" style={{ color: isActive ? C.orange : C.text }}>{cs.name}</div>
                  </div>
                )
              })}

              {/* + Personalizado / Nuevo */}
              <div className="size-card size-card-new"
                onClick={() => {
                  if (inCriticalPeriod) { onCritDisabledClick(); return }
                  const opening = !showCustom
                  setShowCustom(v => !v)
                  setEditingSizeId(null)
                  if (opening) {
                    // Reset to FIT defaults whenever opening for a new size
                    const fitPro = fitSize ? sizeProteinQty(fitSize) : 180
                    const fitCarb = fitSize ? sizeCarbQty(fitSize) : 55
                    setCustomName('')
                    setCustomPro(r => r.map(row => ({ ...row, value: fitPro })))
                    setCustomCarb(r => r.map(row => ({ ...row, value: fitCarb })))
                    setCustomVeg(fitSize ? sizeVegQty(fitSize) : 70)
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', border: `1px dashed ${inCriticalPeriod ? 'rgba(255,255,255,.1)' : showCustom && !editingSizeId ? C.orange : 'rgba(255,255,255,.22)'}`, background: showCustom && !editingSizeId ? 'rgba(247,145,56,.04)' : 'transparent', cursor: inCriticalPeriod ? 'default' : 'pointer', opacity: inCriticalPeriod ? 0.35 : 1 }}>
                <div style={{ font: `700 22px/1 ${F.display}`, textTransform: 'uppercase', color: inCriticalPeriod ? 'rgba(245,241,236,.4)' : showCustom && !editingSizeId ? C.orange : 'rgba(245,241,236,.8)' }}>
                  <span className="new-label-desktop">+ Personalizado</span>
                  <span className="new-label-mobile" style={{ fontSize: 18 }}>+ Nuevo</span>
                </div>
              </div>
            </div>

            {/* ── Bloque de porciones ──────────────────────────────────── */}
            {activeSize && !showCustom && (
              <div style={{ marginTop: 0 }}>
                {/* Encabezado: "Porciones de NAME" + Editar/Eliminar para custom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ font: `700 13px/1 ${F.display}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(245,241,236,.55)' }}>
                    Porciones de {activeSize.name}
                  </span>
                  {isCustomActive && !confirmDeleteId && (
                    <>
                      <button className="edit-btn" onClick={() => handleEditCustomSize(activeSize)}
                        style={{ padding: '6px 11px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, background: 'transparent', color: 'rgba(245,241,236,.75)', font: `500 12px/1 ${F.body}`, cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button className="del-btn" onClick={() => setConfirmDeleteId(activeSize.id)}
                        style={{ padding: '6px 11px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, background: 'transparent', color: 'rgba(245,241,236,.5)', font: `500 12px/1 ${F.body}`, cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    </>
                  )}
                  {confirmDeleteId === activeSize.id && (
                    <>
                      <span style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>¿Confirmar?</span>
                      <button onClick={() => handleDeleteCustomSize(activeSize.id)} disabled={deletingSize}
                        style={{ padding: '6px 11px', border: '1px solid rgba(255,120,120,.5)', borderRadius: 7, background: 'transparent', color: '#ff9b9b', font: `500 12px/1 ${F.body}`, cursor: 'pointer' }}>
                        {deletingSize ? '…' : 'Sí'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        style={{ padding: '6px 11px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, background: 'transparent', color: 'rgba(245,241,236,.5)', font: `500 12px/1 ${F.body}`, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </>
                  )}
                </div>

                {/* 3 columnas: Proteína · Carbo · Verdura */}
                <div className="portions-grid">
                  {/* Proteína — deduplica por nombre (varios ids pueden compartir public_name) */}
                  <div className="portion-col">
                    <div className="portion-label" style={{ font: `700 14px/1 ${F.display}`, color: C.orange }}>Proteína</div>
                    {(() => {
                      const seenNames = new Set<string>()
                      return proIngredients.flatMap((ing, idx) => {
                        const g = getSizeIngQty(activeSize, 'protein_qty', ing.id)
                        const name = ing.public_name ?? ing.name
                        if (g <= 0 || seenNames.has(name)) return []
                        seenNames.add(name)
                        return [(
                          <div key={ing.id} className="portion-row" style={{ marginTop: idx === 0 ? 10 : 0 }}>
                            <span className="portion-name">{name}</span>
                            <span className="portion-grams">{g}g</span>
                          </div>
                        )]
                      })
                    })()}
                  </div>

                  {/* Carbo — deduplica por nombre */}
                  <div className="portion-col">
                    <div className="portion-label" style={{ font: `700 14px/1 ${F.display}`, color: C.yellow }}>Carbohidratos</div>
                    {(() => {
                      const seenNames = new Set<string>()
                      return carbIngredients.flatMap((ing, idx) => {
                        const g = getSizeIngQty(activeSize, 'carb_qty', ing.id)
                        const name = ing.public_name ?? ing.name
                        if (g <= 0 || seenNames.has(name)) return []
                        seenNames.add(name)
                        return [(
                          <div key={ing.id} className="portion-row" style={{ marginTop: idx === 0 ? 10 : 0 }}>
                            <span className="portion-name">{name}</span>
                            <span className="portion-grams">{g}g</span>
                          </div>
                        )]
                      })
                    })()}
                  </div>

                  {/* Verdura — span completo en móvil, columna normal en desktop */}
                  <div className="portion-col portion-col-veggie">
                    <div className="portion-label" style={{ font: `700 14px/1 ${F.display}`, color: C.green }}>Verdura</div>
                    <div className="portion-veg-num" style={{ marginTop: 10, padding: '5px 0', font: `700 26px/1 ${F.display}`, color: C.text }}>
                      {activeSize.veg_qty}<span style={{ font: `600 13px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>g</span>
                    </div>
                  </div>
                </div>

                {/* Precio — paquete protagonista */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                    <span style={{ font: `700 30px/1 ${F.display}`, color: C.green }}>
                      ${(activeSizePriceRange?.isRange ? activeSizePriceRange.rMin.packagePrice : activeSize.package_price) / 100 | 0}
                      {activeSizePriceRange?.isRange && (
                        <span style={{ font: `700 22px/1 ${F.display}` }}> – ${activeSizePriceRange.rMax.packagePrice / 100 | 0}</span>
                      )}
                    </span>
                    <span style={{ font: `600 13px/1 ${F.body}`, color: C.green }}>
                      <span className="new-label-desktop">en paquete desde 5</span>
                      <span className="new-label-mobile">en paquete</span>
                    </span>
                  </div>
                  <span style={{ font: `400 13px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>
                    <span className="new-label-desktop">
                      ${(activeSizePriceRange?.isRange ? activeSizePriceRange.rMin.price : activeSize.price) / 100 | 0}
                      {activeSizePriceRange?.isRange && ` – $${activeSizePriceRange.rMax.price / 100 | 0}`} c/u si llevas menos
                    </span>
                    <span className="new-label-mobile">
                      ${(activeSizePriceRange?.isRange ? activeSizePriceRange.rMin.price : activeSize.price) / 100 | 0}
                      {activeSizePriceRange?.isRange && ` – $${activeSizePriceRange.rMax.price / 100 | 0}`} c/u menos de 5
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* ── Panel de tamaño personalizado (inline) ───────────────── */}
            {showCustom && (
              <div style={{ marginTop: 14, border: `1px solid rgba(247,145,56,.4)`, borderRadius: 12, background: 'rgba(247,145,56,.04)', padding: '24px 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ margin: 0, font: `700 26px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
                    {editingSizeId ? 'Editar tamaño' : 'Tamaño personalizado'}
                  </h2>
                  <button onClick={useAsFitBase} style={{ background: 'none', border: 'none', font: `500 13px/1 ${F.body}`, color: C.orange, cursor: 'pointer', padding: 0 }}>
                    Usar FIT como base
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  <label style={{ display: 'block', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 9, left: 14, font: `600 10px/1 ${F.body}`, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,241,236,.42)' }}>Nombre del tamaño</span>
                    <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder=""
                      style={{ width: '100%', boxSizing: 'border-box', padding: '25px 14px 9px', background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border2}`, borderRadius: 9, color: C.text, fontSize: 16, outline: 'none', fontFamily: F.body }} />
                  </label>
                </div>

                <p style={{ margin: '0 0 22px', font: `400 12.5px/1.5 ${F.body}`, color: C.faint }}>
                  La marca en cada barra es la cantidad del tamaño FIT como referencia. Los ajustes van de 5 en 5 gramos.
                </p>

                <CustomIngGroup label="Proteína" accent={C.orange} rows={customPro} maxG={400} onChange={setCustomPro} />
                <CustomIngGroup label="Carbohidratos" accent={C.yellow} rows={customCarb} maxG={200} onChange={setCustomCarb} />
                <div style={{ marginBottom: 22 }}>
                  <div style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: C.green }}>Verdura</div>
                  <div style={{ padding: '16px 0 13px', borderTop: `1px solid rgba(255,255,255,.06)` }}>
                    <div className="custom-grid">
                      <div>
                        <div style={{ font: `600 14.5px/1.2 ${F.body}`, color: C.text }}>Mezcla de vegetales</div>
                        <div style={{ marginTop: 3, font: `400 12px/1 ${F.body}`, color: C.faint }}>Referencia FIT: {fitSize ? sizeVegQty(fitSize) : 70}g</div>
                      </div>
                      <SliderWithRef value={customVeg} max={200} fitRef={fitSize ? sizeVegQty(fitSize) : 70} accent={C.green} onChange={v => setCustomVeg(v)} />
                      <StepperInput value={customVeg} onChange={setCustomVeg} step={5} />
                    </div>
                  </div>
                </div>

                {/* Price preview */}
                {customPreviewPrice ? (
                  <div className="custom-price-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '16px 18px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border2}`, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ font: `400 12px/1 ${F.body}`, color: C.faint }}>c/u</span>
                      <span style={{ font: `700 28px/1 ${F.display}`, color: C.text }}>
                        ${(customPreviewPrice.price / 100).toFixed(0)}
                        {customPriceIsRange && customPriceMax && <span style={{ font: `700 22px/1 ${F.display}` }}> – ${(customPriceMax.price / 100).toFixed(0)}</span>}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ font: `400 12px/1 ${F.body}`, color: C.faint }}>paq</span>
                      <span style={{ font: `700 22px/1 ${F.display}`, color: C.green }}>
                        ${(customPreviewPrice.packagePrice / 100).toFixed(0)}
                        {customPriceIsRange && customPriceMax && <span> – ${(customPriceMax.packagePrice / 100).toFixed(0)}</span>}
                      </span>
                      <span style={{ font: `400 11px/1 ${F.body}`, color: C.faint }}>desde 5</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border}`, marginBottom: 14, font: `400 13px/1 ${F.body}`, color: C.faint, textAlign: 'center' }}>
                    Mueve los sliders para ver el precio
                  </div>
                )}

                <div className="custom-btns" style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 10 }}>
                  <button className="custom-btn-primary" onClick={handleCreateCustomSize} disabled={savingCustom || !customName.trim()}
                    style={{ padding: '17px 0', border: 0, borderRadius: 10, background: (!customName.trim() || savingCustom) ? 'rgba(247,145,56,.4)' : C.orange, color: '#17140f', font: `700 18px/1 ${F.cond}`, letterSpacing: '.09em', textTransform: 'uppercase', cursor: (!customName.trim() || savingCustom) ? 'not-allowed' : 'pointer' }}>
                    {savingCustom ? 'Guardando…' : editingSizeId ? 'Guardar cambios' : 'Crear y usar este tamaño'}
                  </button>
                  <button className="custom-btn-cancel" onClick={() => { setShowCustom(false); setEditingSizeId(null) }}
                    style={{ padding: '17px 0', border: `1px solid rgba(255,255,255,.16)`, borderRadius: 10, background: 'transparent', color: C.muted, font: `600 14px/1 ${F.body}`, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── 2 · Platillos ────────────────────────────────────────────── */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ font: `700 19px/1 ${F.display}`, letterSpacing: '.16em', textTransform: 'uppercase', color: C.text }}>2 · Tus meals</span>
            </div>

            {/* Filter chips */}
            {/* {availableCategories.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {availableCategories.map(cat => {
                  const isActive = cat === activeCategory
                  return (
                    <span key={cat} className="filter-chip"
                      onClick={() => setActiveCategory(cat)}
                      style={{ padding: '7px 14px', borderRadius: 20, background: isActive ? C.text : 'rgba(255,255,255,.06)', color: isActive ? '#17140f' : C.muted, font: `600 13px/1 ${F.body}`, cursor: 'pointer', userSelect: 'none', transition: 'background .15s, color .15s' }}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  )
                })}
              </div>
            )} */}

            {/* Package banner above grid (when package active) — 1c state */}
            {/* {isPackage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderRadius: 11, background: 'rgba(122,199,122,.08)', border: '1px solid rgba(122,199,122,.28)', marginBottom: 18 }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: C.green, color: '#0f0d0c', font: `700 12px/22px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>✓</span>
                <span style={{ flex: 1, font: `600 14px/1.35 ${F.body}`, color: C.text }}>Precio de paquete activo — cada meal bajó al precio con descuento.</span>
                {savings > 0 && <span style={{ marginLeft: 'auto', flexShrink: 0, font: `700 13.5px/1 ${F.body}`, color: C.green }}>Ahorras ${(savings / 100).toFixed(0)}</span>}
              </div>
            )} */}

            {/* Sales paused */}
            {!salesEnabled && (
              <div style={{ padding: '24px 20px', borderRadius: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ font: `700 22px/1 ${F.display}`, textTransform: 'uppercase', color: '#ef4444', marginBottom: 8 }}>Ventas pausadas</div>
                <div style={{ font: `400 14px/1.5 ${F.body}`, color: C.muted }}>Volvemos pronto. Gracias por tu paciencia.</div>
              </div>
            )}

            <div className="menu-grid">
              {filteredMeals.map(meal => {
                // Si está creando un tamaño nuevo (panel abierto, sin editar), las cards
                // muestran qty=0 visualmente — no hay tamaño activo asignado aún
                const qty = (showCustom && !editingSizeId) ? 0 : getQty(meal.id, activeSizeId)
                const isSoldOut = soldOut.includes(meal.id)
                const macros = activeSize ? meal.macros[activeSize.id] ?? null : null
                const stockLimit = stockLimits[meal.id]   // undefined = sin límite
                const mealTotalQty = getMealTotalQty(meal.id)
                const atStockLimit = stockLimit !== undefined && mealTotalQty >= stockLimit
                return (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    qty={qty}
                    isSoldOut={isSoldOut}
                    atStockLimit={atStockLimit}
                    stockLimit={stockLimit}
                    macros={macros}
                    displayPrice={activeSize ? (isPackage ? activeSize.package_price : activeSize.price) : 0}
                    unitPrice={activeSize?.price ?? 0}
                    isPackage={isPackage}
                    onAdd={() => addMeal(meal)}
                    onQtyChange={q => setMealQty(meal, activeSizeId, q)}
                    salesEnabled={salesEnabled}
                    addLocked={showCustom && !editingSizeId}
                  />
                )
              })}
              {filteredMeals.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', font: `400 14px/1.5 ${F.body}`, color: C.faint }}>
                  No hay meals en esta categoría por ahora.
                </div>
              )}
            </div>
          </div>
          </div>{/* end padding wrapper */}
        </div>{/* end left col */}

        {/* ── RIGHT: cart sidebar (desktop) ───────────────────────────── */}
        {/* height ÷ 1.1 compensates for the zoom:1.1 on .public-content so the
            aside's visual bottom lands exactly at the viewport bottom */}
        <aside className="menu-sidebar" style={{ position: 'sticky', top: 64, height: 'calc((100vh - 64px) / 1.1)', background: C.bg, overflow: 'hidden' }}>
          {renderSidebar()}
        </aside>
      </div>

      {/* ── Mobile: overlay + bottom drawer + bar + toasts — portales para bypass zoom:1.1 ── */}
      {mounted && createPortal(
        <>
          {/* ── Sticky compact size bar — position:fixed evita layout shift ── */}
          {showStickyBar && (
            <div className="sticky-bar" style={{ position: 'fixed', top: 64, left: 0, zIndex: 40, background: '#0c0a09', borderBottom: `1px solid rgba(255,255,255,.08)`, padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', minWidth: 0 }}>
                <span style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,241,236,.5)', flexShrink: 0 }}>Agregando en</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {sizes.map(s => (
                    <button key={s.id} onClick={() => { setActiveSizeId(s.id); setShowCustom(false) }}
                      style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: s.id === activeSizeForUI ? C.orange : 'rgba(255,255,255,.05)', color: s.id === activeSizeForUI ? '#17140f' : 'rgba(245,241,236,.6)', font: `700 14px/1 ${F.cond}`, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}>
                      {s.name}
                    </button>
                  ))}
                  {[...customerSizes, ...(customSizeData && !customerSizes.some(cs => cs.id === customSizeData.id) ? [customSizeData] : [])].map(cs => (
                    <button key={cs.id}
                      onClick={() => !inCriticalPeriod && (setActiveSizeId(cs.id), setShowCustom(false))}
                      disabled={inCriticalPeriod}
                      style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: cs.id === activeSizeForUI ? C.orange : 'rgba(255,255,255,.05)', color: cs.id === activeSizeForUI ? '#17140f' : 'rgba(245,241,236,.6)', font: `700 14px/1 ${F.cond}`, letterSpacing: '.1em', textTransform: 'uppercase', cursor: inCriticalPeriod ? 'default' : 'pointer', flexShrink: 0, opacity: inCriticalPeriod ? 0.38 : 1 }}>
                      {cs.name}
                    </button>
                  ))}
                  {!inCriticalPeriod && (
                    <button onClick={() => setShowCustom(v => !v)}
                      style={{ padding: '7px 12px', borderRadius: 8, border: `1px dashed rgba(255,255,255,.2)`, background: showCustom ? 'rgba(247,145,56,.1)' : 'transparent', color: showCustom ? C.orange : 'rgba(245,241,236,.6)', font: `700 14px/1 ${F.cond}`, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}>
                      + Pers
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                {activeSize && (
                  <span className="sticky-bar-macros" style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.4)', whiteSpace: 'nowrap' }}>
                    {sizeProteinQty(activeSize) > 0 ? `${sizeProteinQty(activeSize)}g proteína` : ''}
                    {sizeCarbQty(activeSize) > 0 ? ` · ${sizeCarbQty(activeSize)}g carbs` : ''}
                    {sizeVegQty(activeSize) > 0 ? ` · ${sizeVegQty(activeSize)}g veg` : ''}
                  </span>
                )}
                <button onClick={() => setShowInfoModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(245,241,236,.25)', background: 'transparent', color: 'rgba(245,241,236,.6)', font: `700 12px/1 ${F.body}`, cursor: 'pointer', flexShrink: 0 }}
                  title="Que son las porciones">
                  i
                </button>
              </div>
            </div>
          )}

          {/* Overlay */}
          <div className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,.6)' }} />

          {/* Bottom drawer — slides up from bottom */}
          <div className={`bottom-drawer${drawerOpen ? ' open' : ''}`}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, height: '88dvh', maxHeight: '88dvh', background: C.card, borderRadius: '22px 22px 0 0', borderTop: `1px solid rgba(255,255,255,.1)`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 0 4px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {renderSidebar()}
            </div>
          </div>

          {/* Mobile floating bottom bar */}
          <div className="mobile-bar"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '12px 14px 16px', background: 'rgba(12,10,9,.97)', borderTop: `1px solid rgba(255,255,255,.1)`, backdropFilter: 'blur(8px)', flexDirection: 'column', gap: 0 }}>
            {totalQty > 0 && !isPackage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.1)' }}>
                  <span style={{ display: 'block', width: `${progressPct}%`, height: '100%', borderRadius: 3, background: C.orange, transition: 'width .3s' }} />
                </div>
                <span style={{ font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.6)', whiteSpace: 'nowrap' }}>
                  {toDiscount} más y baja a paquete
                </span>
              </div>
            )}
            <button
              onClick={() => { if (totalQty > 0) setDrawerOpen(true) }}
              disabled={totalQty === 0}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', border: 0, borderRadius: 12, background: totalQty === 0 ? 'rgba(247,145,56,.3)' : C.orange, cursor: totalQty === 0 ? 'not-allowed' : 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ minWidth: 24, height: 24, padding: '0 6px', borderRadius: 12, background: 'rgba(23,20,15,.22)', color: '#17140f', font: `700 13px/24px ${F.body}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{totalQty}</span>
                <span style={{ font: `700 20px/1 ${F.display}`, letterSpacing: '.1em', textTransform: 'uppercase', color: '#17140f' }}>Ver mi semana</span>
              </span>
              <span style={{ font: `700 20px/1 ${F.display}`, color: '#17140f' }}>
                {totalQty > 0 ? `$${(sidebarTotal / 100).toFixed(0)}` : '—'}
              </span>
            </button>
          </div>

          {/* Toast persistente */}
          {toastMsg && (
            <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 200, maxWidth: 440, width: 'calc(100% - 32px)', padding: '13px 18px', borderRadius: 11, background: '#2a2520', border: `1px solid rgba(247,145,56,.6)`, boxShadow: '0 8px 28px rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>⚠️</span>
              <span style={{ font: `400 13px/1.5 ${F.body}`, color: C.text }}>{toastMsg}</span>
              <button onClick={() => setToastMsg(null)}
                style={{ marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', font: `500 16px/1 ${F.body}`, padding: '0 2px' }}>✕</button>
            </div>
          )}

          {/* Hint de corta duración */}
          {hintMsg && (
            <div style={{ position: 'fixed', bottom: 108, left: '50%', transform: 'translateX(-50%)', zIndex: 201, maxWidth: 320, width: 'calc(100% - 48px)', padding: '10px 15px', borderRadius: 10, background: '#3c3530', border: `1px solid rgba(247,145,56,.4)`, boxShadow: '0 6px 20px rgba(0,0,0,.7)', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ font: `500 12.5px/1.4 ${F.body}`, color: C.text }}>{hintMsg}</span>
            </div>
          )}
        </>,
        document.body
      )}

      {/* ── Modal "Que son las porciones" — portal bypasses zoom:1.1 ── */}
      {showInfoModal && mounted && createPortal(
        <div className="info-modal-portal" onClick={() => setShowInfoModal(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            {/* Handle (móvil) */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0', flexShrink: 0 }}>
              <div className="info-modal-handle" />
            </div>
            {/* Header */}
            <div style={{ padding: '24px 26px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <h2 style={{ margin: 0, font: `700 34px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>{PORCIONES_MODAL.title}</h2>
                <button onClick={() => setShowInfoModal(false)} aria-label="Cerrar"
                  style={{ flexShrink: 0, width: 34, height: 34, border: 0, borderRadius: 9, background: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.7)', font: `400 17px/1 ${F.body}`, cursor: 'pointer' }}>×</button>
              </div>
              <p style={{ margin: '11px 0 0', font: `400 14px/1.55 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>{PORCIONES_MODAL.intro}</p>
            </div>
            {/* Body — scrollable */}
            <div className="info-modal-body">
              {PORCIONES_MODAL.sections.map(sec => {
                // Deduplicar por nombre — carbIngredients ahora tiene múltiples variantes
                // del mismo public_name (ej. Pasta Tornillo + Pasta Pluma → "Pasta" × 2)
                const rawChips = sec.key === 'protein'
                  ? proIngredients.map(i => i.public_name ?? i.name)
                  : sec.key === 'carb'
                    ? carbIngredients.map(i => i.public_name ?? i.name)
                    : vegIngredients.map(i => i.public_name ?? i.name)
                const chips: string[] = [...new Set(rawChips)]
                return (
                  <div key={sec.key} style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ font: `700 13px/1 ${F.display}`, letterSpacing: '.18em', textTransform: 'uppercase', color: sec.color }}>{sec.label}</span>
                      <span style={{ font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.42)' }}>{sec.note}</span>
                    </div>
                    <p style={{ margin: '7px 0 10px', font: `400 13.5px/1.5 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>{sec.description}</p>
                    {chips.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {chips.map(chip => (
                          <span key={chip} style={{ padding: '5px 9px', border: '1px solid rgba(255,255,255,.09)', borderRadius: 6, background: 'rgba(255,255,255,.04)', font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>{chip}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Orange "Todo se pesa en crudo" note */}
              <div style={{ margin: '4px 0 18px', padding: '14px 16px', border: '1px solid rgba(247,145,56,.18)', borderRadius: 11, background: 'rgba(247,145,56,.07)' }}>
                <div style={{ font: `700 13px/1 ${F.display}`, letterSpacing: '.16em', textTransform: 'uppercase', color: C.orange }}>Todo se pesa en crudo</div>
                <p style={{ margin: '8px 0 0', font: `400 13px/1.5 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>Los gramos que ves son el peso antes de cocinar. Al cocinarse el peso baja, pero las calorias y macros de cada platillo ya estan calculados sobre el platillo terminado. Los ingredientes de cada porcion rotan segun el menu de la semana.</p>
              </div>
            </div>
            {/* Footer */}
            <div className="info-modal-footer">
              <button onClick={() => setShowInfoModal(false)}
                style={{ padding: '15px 34px', border: 0, borderRadius: 10, background: C.orange, color: '#17140f', font: `700 20px/1 ${F.display}`, letterSpacing: '.09em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {PORCIONES_MODAL.cta}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Meal card ─────────────────────────────────────────────────────
function MealCard({
  meal, qty, isSoldOut, atStockLimit, stockLimit, macros,
  displayPrice, unitPrice, isPackage,
  onAdd, onQtyChange, salesEnabled, addLocked,
}: {
  meal: MealMenuData
  qty: number
  isSoldOut: boolean
  atStockLimit: boolean
  stockLimit: number | undefined
  macros: { calories: number; protein: number; carbs: number; fats: number } | null
  displayPrice: number
  unitPrice: number
  isPackage: boolean
  onAdd: () => void
  onQtyChange: (q: number) => void
  salesEnabled: boolean
  addLocked: boolean
}) {
  const hasQty = qty > 0
  const canAdd = salesEnabled && !isSoldOut && !atStockLimit && !addLocked

  function handlePhotoClick() {
    if (!canAdd) return
    if (qty === 0) onAdd()
    else onQtyChange(qty + 1)
  }

  return (
    <div className="meal-card" style={{ border: `1px solid ${hasQty ? C.orange : C.border}`, borderRadius: 12, background: C.card, overflow: 'hidden', opacity: isSoldOut ? 0.5 : 1, transition: 'border-color .15s, opacity .15s' }}>
      {/* Photo — entire area is clickable (adds/increments meal) */}
      <div
        onClick={handlePhotoClick}
        style={{
          position: 'relative', height: 132,
          borderBottom: `1px solid rgba(255,255,255,.07)`,
          backgroundImage: 'url(/media/Fondo.jpg)',
          backgroundSize: '320px', backgroundRepeat: 'repeat',
          cursor: canAdd ? 'pointer' : 'default',
        }}>
        {meal.img && (
          <Image src={meal.img} alt={meal.name} fill style={{ objectFit: 'cover' }} />
        )}
        {isSoldOut ? (
          <span style={{ position: 'absolute', top: 9, left: 9, padding: '5px 10px', borderRadius: 5, background: 'rgba(0,0,0,.65)', font: `700 10px/1 ${F.body}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.text }}>
            Agotado
          </span>
        ) : hasQty ? (
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 9, right: 9, display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 9, background: 'rgba(12,10,9,.86)', border: '1px solid rgba(247,145,56,.5)', zIndex: 1 }}>
            <button className="stepper-btn" onClick={e => { e.stopPropagation(); onQtyChange(qty - 1) }}
              style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, font: `600 15px/1 ${F.body}`, cursor: 'pointer' }}>−</button>
            <span style={{ minWidth: 20, textAlign: 'center', font: `700 14px/1 ${F.body}`, color: C.text }}>{qty}</span>
            <button className="stepper-btn"
              onClick={e => { e.stopPropagation(); if (!atStockLimit) onQtyChange(qty + 1) }}
              disabled={atStockLimit}
              style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: atStockLimit ? 'rgba(247,145,56,.3)' : C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#17140f', font: `600 15px/1 ${F.body}`, cursor: atStockLimit ? 'not-allowed' : 'pointer' }}>+</button>
          </div>
        ) : canAdd ? (
          <button className="add-btn" onClick={e => { e.stopPropagation(); onAdd() }}
            style={{ position: 'absolute', top: 9, right: 9, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 0, borderRadius: 9, background: C.orange, color: '#17140f', font: `700 14px/1 ${F.cond}`, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', zIndex: 1 }}>
            + Agregar
          </button>
        ) : null}
        {/* Stock limitado — badge al pie de la imagen cuando hay stock pero está al límite */}
        {!isSoldOut && stockLimit !== undefined && stockLimit > 0 && (
          <span style={{ position: 'absolute', bottom: 9, left: 9, padding: '4px 8px', borderRadius: 5, background: 'rgba(0,0,0,.65)', font: `500 10px/1 ${F.body}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.yellow }}>
            {stockLimit === 1 ? '1 disponible' : `${stockLimit} disponibles`}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '13px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: meal.description ? 7 : 11 }}>
          <div style={{ font: `700 21px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>{meal.name}</div>
          {isSoldOut ? (
            <span style={{ font: `500 11px/1 ${F.body}`, color: C.faint, flexShrink: 0 }}>Vuelve pronto</span>
          ) : isPackage ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
              <span style={{ font: `600 14.5px/1 ${F.body}`, color: C.green }}>${(displayPrice / 100).toFixed(0)}</span>
              <span style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.4)', textDecoration: 'line-through' }}>${(unitPrice / 100).toFixed(0)}</span>
            </div>
          ) : (
            <span style={{ font: `600 14.5px/1 ${F.body}`, color: C.text, flexShrink: 0 }}>${(displayPrice / 100).toFixed(0)}</span>
          )}
        </div>

        {meal.description && (
          <p style={{ margin: '0 0 11px', font: `400 12.5px/1.45 ${F.body}`, color: C.muted }}>{meal.description}</p>
        )}

        {/* Macro boxes — minmax(0,1fr) allows shrinking below content size */}
        {macros && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 5, marginBottom: meal.ingredientGroups.length > 0 ? 0 : undefined }}>
            {([
              { label: 'Cals',   val: Math.round(macros.calories) },
              { label: 'Proteína',   val: Math.round(macros.protein) },
              { label: 'Carbos', val: Math.round(macros.carbs) },
              { label: 'Grasas',  val: Math.round(macros.fats) },
            ]).map(({ label, val }) => (
              <div key={label} style={{ padding: '7px 2px 6px', border: `1px solid ${C.border}`, borderRadius: 8, background: 'rgba(255,255,255,.03)', textAlign: 'center', overflow: 'hidden' }}>
                <div style={{ font: `700 14px/1 ${F.body}`, color: C.text }}>{val}</div>
                <div style={{ marginTop: 3, font: `600 8px/1 ${F.body}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Ingredients dropdown */}
        {meal.ingredientGroups.length > 0 && (
          <details style={{ marginTop: 11, borderTop: `1px solid rgba(255,255,255,.08)` }}>
            <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0 2px', font: `700 13px/1 ${F.cond}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.orange, cursor: 'pointer' }}>
              <span data-caret style={{ display: 'inline-block', fontSize: 9, transition: 'transform .15s' }}>▼</span>
              <span data-lbl-closed>Ingredientes</span>
              <span data-lbl-open>Ocultar</span>
            </summary>
            <div style={{ margin: '8px 0 4px' }}>
              {meal.ingredientGroups.map((group, gi) => (
                <div key={gi}>
                  {/* Sub-recipe heading — full width between grids */}
                  {group.name && (
                    <div style={{ marginTop: 10, marginBottom: 4, font: `700 12px/1 ${F.body}`, color: 'rgba(245,241,236,.55)', letterSpacing: '.04em' }}>
                      {group.name}
                    </div>
                  )}
                  <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2px 14px', margin: gi === 0 ? '6px 0 4px' : '0 0 4px', padding: '0 0 0 15px' }}>
                    {group.ingredients.map(name => (
                      <li key={name} style={{ font: `400 12px/1.55 ${F.body}`, color: 'rgba(245,241,236,.62)' }}>{name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

// ── Custom ingredient group with sliders ──────────────────────────
function CustomIngGroup({ label, accent, rows, maxG, onChange }: {
  label: string
  accent: string
  rows: IngRow[]
  maxG: number
  onChange: (rows: IngRow[]) => void
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: accent }}>{label}</div>
      {rows.map((row, idx) => (
        <div key={row.name} className="ing-row" style={{ padding: '16px 0 13px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div>
            <div style={{ font: `600 14.5px/1.2 ${F.body}`, color: row.value > 0 ? C.text : 'rgba(245,241,236,.62)' }}>{row.name}</div>
            <div style={{ marginTop: 3, font: `400 12px/1 ${F.body}`, color: C.faint }}>Referencia FIT: {row.fitRef}g</div>
          </div>
          <SliderWithRef value={row.value} max={maxG} fitRef={row.fitRef} accent={accent}
            onChange={v => {
              const next = [...rows]; next[idx] = { ...next[idx], value: v }
              onChange(next)
            }} />
          <StepperInput value={row.value} step={5}
            onChange={v => {
              const next = [...rows]; next[idx] = { ...next[idx], value: v }
              onChange(next)
            }} />
        </div>
      ))}
    </div>
  )
}

// ── Slider with FIT reference mark ────────────────────────────────
function SliderWithRef({ value, max, fitRef, accent, onChange }: {
  value: number; max: number; fitRef: number; accent: string; onChange: (v: number) => void
}) {
  const pct = (value / max) * 100
  const fitPct = (fitRef / max) * 100
  return (
    <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
      <input type="range" min={0} max={max} step={5} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2, margin: 0 }} />
      {/* Track */}
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,.1)', position: 'relative' }}>
        {value > 0 && <div style={{ position: 'absolute', left: 0, height: '100%', width: `${pct}%`, borderRadius: 3, background: accent }} />}
      </div>
      {/* Knob */}
      <span style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: value > 0 ? C.text : 'rgba(245,241,236,.55)', boxShadow: '0 1px 5px rgba(0,0,0,.6)', pointerEvents: 'none' }} />
      {/* FIT mark */}
      <span style={{ position: 'absolute', left: `${fitPct}%`, top: -3, width: 1, height: 12, background: 'rgba(245,241,236,.4)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', left: `${fitPct}%`, top: -17, transform: 'translateX(-50%)', font: `600 9px/1 ${F.body}`, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>FIT</span>
    </div>
  )
}

// ── Stepper input ────────────────────────────────────────────────
function StepperInput({ value, step = 5, onChange }: {
  value: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 9, background: 'rgba(255,255,255,.05)', justifySelf: 'end' }}>
      <button type="button" onClick={() => onChange(Math.max(0, value - step))}
        style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,241,236,.7)', font: `600 15px/1 ${F.body}`, cursor: 'pointer' }}>−</button>
      <span style={{ minWidth: 52, textAlign: 'center', font: `700 15px/1 ${F.body}`, color: value > 0 ? C.text : 'rgba(245,241,236,.45)' }}>{value} g</span>
      <button type="button" onClick={() => onChange(value + step)}
        style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,241,236,.7)', font: `600 15px/1 ${F.body}`, cursor: 'pointer' }}>+</button>
    </div>
  )
}
