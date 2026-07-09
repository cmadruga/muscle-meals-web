'use client'

import { useState, useMemo } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartGroups } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup } from '@/hooks/useCartGroups'
import { colors } from '@/lib/theme'
import LoginBanner from '@/components/LoginBanner'
import { getUpcomingSunday, formatDeliveryDate } from '@/lib/utils/delivery'
import { validateCart } from '@/app/actions/checkout'
import type { PickupSpot } from '@/lib/db/pickup-spots'
import { MembershipConfirmModal, type PrefillInfo, type MembershipInfo } from '@/components/MembershipConfirmModal'
import type { Meal } from '@/lib/types'

type PendingDelete =
  | { type: 'item'; mealId: string; sizeId: string; name: string }
  | { type: 'package'; instanceId: string; name: string }

export default function CartClient({
  inCutoff,
  prefill,
  membership,
  pickupSpots,
  usedMembershipThisWeek,
  activeMeals,
}: {
  inCutoff: boolean
  prefill: PrefillInfo | null
  membership: MembershipInfo | null
  pickupSpots: PickupSpot[]
  usedMembershipThisWeek: boolean
  activeMeals: Meal[]
}) {
  const router = useRouter()
  const { removeItem, removePackage, updateQty, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [editingPkg, setEditingPkg] = useState<PackageGroup | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [membershipModalOpen, setMembershipModalOpen] = useState(false)
  const items = useCartStore(state => state.items)

  const totalQty = items.reduce((n, i) => n + i.qty, 0)
  const isMembershipMatch = Boolean(
    !usedMembershipThisWeek &&
    membership?.is_member &&
    (membership.membership_weeks_left ?? 0) > 0 &&
    membership.membership_qty !== null &&
    membership.membership_size_id !== null &&
    totalQty === membership.membership_qty &&
    items.every(i => i.sizeId === membership!.membership_size_id)
  )

  const handleCheckout = async () => {
    if (isEmpty) return
    setValidating(true)
    setValidationError(null)
    const result = await validateCart(items.map(item => ({
      mealId: item.mealId,
      mealName: item.mealName,
      sizeId: item.sizeId,
      sizeName: item.sizeName,
      qty: item.qty,
      unitPrice: item.unitPrice,
      packageInstanceId: item.packageInstanceId,
    })))
    setValidating(false)
    if (!result.valid) {
      setValidationError(result.errors[0].message)
      return
    }
    router.push('/checkout')
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'item') removeItem(pendingDelete.mealId, pendingDelete.sizeId)
    else removePackage(pendingDelete.instanceId)
    setPendingDelete(null)
  }

  if (isEmpty) {
    return <EmptyCartView />
  }

  return (
    <>
    <style>{`
      .cart-item { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 16px; }
      .cart-item-price { text-align: right; min-width: 100px; }
      .cart-item-name { grid-column: 1; }
      .cart-item-delete { grid-column: 4; }
      @media (max-width: 560px) {
        .cart-item { grid-template-columns: 1fr auto; grid-template-rows: auto auto; }
        .cart-item-name { grid-column: 1; grid-row: 1; }
        .cart-item-delete { grid-column: 2; grid-row: 1; align-self: start; }
        .cart-item-qty { grid-column: 1; grid-row: 2; }
        .cart-item-price { grid-column: 2; grid-row: 2; min-width: unset; }
      }
    `}</style>

    {pendingDelete && (
      <div
        onClick={() => setPendingDelete(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: colors.grayDark,
            border: `2px solid ${colors.grayLight}`,
            borderRadius: 16,
            padding: 28,
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.white }}>
            ¿Eliminar del carrito?
          </p>
          <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
            {pendingDelete.name}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setPendingDelete(null)}
              style={{
                flex: 1, padding: '12px 0',
                background: 'transparent',
                border: `1px solid ${colors.grayLight}`,
                borderRadius: 8, color: colors.white,
                cursor: 'pointer', fontSize: 15,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              style={{
                flex: 1, padding: '12px 0',
                background: colors.error,
                border: 'none',
                borderRadius: 8, color: colors.white,
                cursor: 'pointer', fontSize: 15, fontWeight: 'bold',
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    )}

    <main style={{
      padding: '40px 24px 100px',
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{
        fontSize: 32,
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 2
      }}>
        <span style={{ color: colors.orange }}>Tu</span> Carrito
      </h1>

      <DeliveryBanner inCutoff={inCutoff} />

      <div style={{ marginBottom: 24 }}>
        {packageGroups.map((pkg) => (
          <PackageCard
            key={pkg.packageInstanceId}
            package={pkg}
            onEdit={() => setEditingPkg(pkg)}
            onRemove={() => setPendingDelete({ type: 'package', instanceId: pkg.packageInstanceId, name: `${pkg.packageName} · ${pkg.sizeName}` })}
          />
        ))}

        {individualItems.map((item) => (
          <IndividualItemCard
            key={`${item.mealId}-${item.sizeId}`}
            item={item}
            onUpdateQty={(qty) => updateQty(item.mealId, item.sizeId, qty)}
            onRemove={() => setPendingDelete({ type: 'item', mealId: item.mealId, sizeId: item.sizeId, name: `${item.mealName} · ${item.sizeName}` })}
          />
        ))}
      </div>

      {membership?.is_member && (membership.membership_weeks_left ?? 0) > 0 && (
        <div style={{
          padding: '16px 20px',
          marginBottom: 16,
          background: isMembershipMatch ? `${colors.orange}18` : colors.grayDark,
          border: `2px solid ${isMembershipMatch ? colors.orange : colors.grayLight}`,
          borderRadius: 10,
        }}>
          {isMembershipMatch ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.orange }}>
              Tu pedido está cubierto por tu Membresía Muscle Meals
            </div>
          ) : usedMembershipThisWeek ? (
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              Ya usaste tu membresía esta semana — paga normalmente para este pedido
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              Tu carrito actual no coincide con tu Membresía Muscle Meals, verifica tu pedido o paga normalmente
            </div>
          )}
        </div>
      )}

      <CartSummary total={getTotal()} isMembershipMatch={isMembershipMatch} />

      <CartActions
        onCheckout={handleCheckout}
        validating={validating}
        validationError={validationError}
        isMembershipMatch={isMembershipMatch}
        onMembershipConfirm={() => setMembershipModalOpen(true)}
      />
      </div>
    </main>

    {editingPkg && (
      <PackageEditModal
        pkg={editingPkg}
        activeMeals={activeMeals}
        onClose={() => setEditingPkg(null)}
      />
    )}

    {membershipModalOpen && prefill && membership && (
      <MembershipConfirmModal
        prefill={prefill}
        pickupSpots={pickupSpots}
        items={items}
        subtotal={getTotal()}
        onClose={() => setMembershipModalOpen(false)}
      />
    )}

    <LoginBanner />
    </>
  )
}

function EmptyCartView() {
  return (
    <main style={{
      padding: '40px 24px',
      textAlign: 'center',
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FE9739" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 24 }}>
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <h1 style={{
        fontSize: 32,
        marginBottom: 12,
        textTransform: 'uppercase'
      }}>
        Carrito <span style={{ color: colors.orange }}>vacío</span>
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: 32, fontSize: 16 }}>
        Agrega comidas o paquetes para comenzar tu orden
      </p>
      <Link
        href="/menu"
        className="franchise-stroke"
        style={{
          display: 'inline-block',
          padding: '16px 32px',
          background: colors.orange,
          color: colors.white,
          borderRadius: 8,
          textDecoration: 'none',
          fontFamily: 'Franchise, sans-serif',
          fontSize: 22,
          letterSpacing: 0,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        Ver menú →
      </Link>
    </main>
  )
}

function PackageCard({ package: pkg, onRemove, onEdit }: {
  package: PackageGroup
  onRemove: () => void
  onEdit: () => void
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: colors.grayDark
      }}
    >
      <div style={{
        padding: 16,
        background: colors.grayLight,
        borderBottom: `1px solid ${colors.grayLight}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold', color: colors.orange }}>
          {pkg.packageName} · x{pkg.totalMeals}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 'bold', color: colors.white }}>
            ${(pkg.totalPrice / 100).toFixed(0)} MXN
          </span>
          <button
            onClick={onEdit}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.orange}`,
              borderRadius: 8,
              background: 'transparent',
              color: colors.orange,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Editar
          </button>
          <button
            onClick={onRemove}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.error}`,
              borderRadius: 8,
              background: 'transparent',
              color: colors.error,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div>
        {pkg.items.map((item, idx) => (
          <div
            key={`${item.mealId}-${item.sizeId}`}
            style={{
              padding: '12px 16px',
              borderBottom: idx < pkg.items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 15, color: colors.white }}>{item.mealName}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{item.sizeName}</span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                ×{item.qty} · ${(item.unitPrice / 100).toFixed(0)} c/u
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginLeft: 10 }}>
                ${(item.unitPrice * item.qty / 100).toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function IndividualItemCard({ item, onUpdateQty, onRemove }: {
  item: CartItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}) {
  return (
    <div
      className="cart-item"
      style={{
        padding: 16,
        marginBottom: 12,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 12,
        background: colors.grayDark,
      }}
    >
      <div className="cart-item-name">
        <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: colors.orange }}>
          {item.mealName}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
          {item.sizeName}
        </p>
      </div>

      <div className="cart-item-price">
        <p style={{ margin: '0 0 4px 0', fontSize: 14, color: colors.textMuted }}>
          ${(item.unitPrice / 100).toFixed(0)} MXN c/u
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: colors.white }}>
          ${((item.unitPrice * item.qty) / 100).toFixed(0)} MXN
        </p>
      </div>

      <div className="cart-item-qty">
        <QuantityControls value={item.qty} onChange={onUpdateQty} />
      </div>

      <button
        className="cart-item-delete"
        onClick={onRemove}
        style={{
          padding: '8px 12px',
          border: `1px solid ${colors.error}`,
          borderRadius: 8,
          background: 'transparent',
          color: colors.error,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function QuantityControls({ value, onChange }: {
  value: number
  onChange: (qty: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={() => onChange(value - 1)}
        style={{
          width: 32, height: 32, fontSize: 18,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, background: colors.grayLight,
          color: colors.white, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        −
      </button>
      <span style={{ fontWeight: 'bold', minWidth: 24, textAlign: 'center', color: colors.white }}>
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 32, height: 32, fontSize: 18,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, background: colors.grayLight,
          color: colors.white, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        +
      </button>
    </div>
  )
}

function CartSummary({ total, isMembershipMatch }: { total: number; isMembershipMatch: boolean }) {
  return (
    <div style={{
      padding: 20,
      background: colors.grayDark,
      border: `2px solid ${colors.orange}`,
      borderRadius: 12,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>Total:</span>
        {isMembershipMatch ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, color: colors.textMuted, textDecoration: 'line-through' }}>
              ${(total / 100).toFixed(0)} MXN
            </span>
            <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
              $0 MXN
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
            ${(total / 100).toFixed(0)} MXN
          </span>
        )}
      </div>
    </div>
  )
}

function DeliveryBanner({ inCutoff }: { inCutoff: boolean }) {
  const deliveryDate = getUpcomingSunday()

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '14px 18px',
        background: '#10b98112',
        border: '2px solid #10b981',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>📅</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#10b981', fontSize: 15 }}>
            Entrega estimada: {formatDeliveryDate(deliveryDate)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textMuted }}>
            Entregamos cada domingo · Pedidos cortados el viernes a mediodía
          </p>
        </div>
      </div>

      {inCutoff && (
        <div style={{
          padding: '14px 18px',
          background: '#f59e0b15',
          border: `2px solid ${colors.orange}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>⚠️</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: colors.orange, fontSize: 15 }}>
              Stock limitado · Disponibilidad sujeta al momento del pago
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textSecondary }}>
              Tener productos en el carrito no garantiza su disponibilidad. Completa tu orden para asegurarlos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function PackageEditModal({ pkg, activeMeals, onClose }: {
  pkg: PackageGroup
  activeMeals: Meal[]
  onClose: () => void
}) {
  const { addItem, removePackage } = useCartStore()

  // One section per unique size in the package
  const sizeSections = useMemo(() => {
    const map = new Map<string, { sizeId: string; sizeName: string; unitPrice: number }>()
    for (const item of pkg.items) {
      if (!map.has(item.sizeId)) {
        map.set(item.sizeId, { sizeId: item.sizeId, sizeName: item.sizeName, unitPrice: item.unitPrice })
      }
    }
    return [...map.values()]
  }, [pkg.items])

  // qty keyed by `${mealId}__${sizeId}`
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const item of pkg.items) {
      const k = `${item.mealId}__${item.sizeId}`
      init[k] = (init[k] ?? 0) + item.qty
    }
    return init
  })

  // collapsed state per sizeId — only first section open by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    sizeSections.forEach((s, i) => { if (i > 0) init[s.sizeId] = true })
    return init
  })

  const isMixed = pkg.isMixedSizes
  const minMeals = 5
  const totalMeals = Object.values(qty).reduce((s, n) => s + n, 0)
  const belowMin = totalMeals < minMeals

  const change = (mealId: string, sizeId: string, delta: number) => {
    const k = `${mealId}__${sizeId}`
    setQty(prev => ({ ...prev, [k]: Math.max(0, (prev[k] ?? 0) + delta) }))
  }

  const sectionTotal = (sizeId: string) =>
    activeMeals.reduce((s, m) => s + (qty[`${m.id}__${sizeId}`] ?? 0), 0)

  const handleSave = () => {
    removePackage(pkg.packageInstanceId)
    const newInstanceId = `pkg_${crypto.randomUUID()}`
    for (const section of sizeSections) {
      for (const meal of activeMeals) {
        const q = qty[`${meal.id}__${section.sizeId}`] ?? 0
        if (q > 0) {
          addItem({
            mealId: meal.id,
            mealName: meal.name,
            sizeId: section.sizeId,
            sizeName: section.sizeName,
            qty: q,
            unitPrice: section.unitPrice,
            packageName: pkg.packageName,
            packageInstanceId: newInstanceId,
          })
        }
      }
    }
    onClose()
  }

  const renderMealRow = (meal: Meal, sizeId: string) => {
    const k = `${meal.id}__${sizeId}`
    const q = qty[k] ?? 0
    return (
      <div
        key={k}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px',
          borderRadius: 10,
          background: q > 0 ? `${colors.orange}18` : colors.black,
          border: `1px solid ${q > 0 ? colors.orange : colors.grayLight}`,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {meal.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.img} alt={meal.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 6, background: colors.grayLight, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, fontSize: 14, color: colors.white, fontWeight: q > 0 ? 600 : 400 }}>
          {meal.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => change(meal.id, sizeId, -1)}
            disabled={q === 0}
            style={{
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${colors.grayLight}`,
              background: colors.grayLight, color: colors.white, cursor: q === 0 ? 'not-allowed' : 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: q === 0 ? 0.3 : 1,
            }}
          >−</button>
          <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: q > 0 ? colors.orange : colors.textMuted, fontSize: 15 }}>
            {q}
          </span>
          <button
            onClick={() => change(meal.id, sizeId, 1)}
            style={{
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${colors.grayLight}`,
              background: colors.grayLight, color: colors.white, cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.grayDark,
          border: `2px solid ${colors.orange}`,
          borderRadius: 16,
          padding: 24,
          maxWidth: 440,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.white, textTransform: 'uppercase', letterSpacing: 1 }}>
              <span style={{ color: colors.orange }}>Editar</span> {pkg.packageName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: belowMin ? '#ef4444' : colors.textMuted }}>
              {totalMeals} comida{totalMeals !== 1 ? 's' : ''} · mínimo {minMeals}
              {belowMin && <span style={{ marginLeft: 6, fontWeight: 700 }}>⚠ faltan {minMeals - totalMeals}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0, marginLeft: 12 }}
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: colors.grayLight, margin: '12px 0', flexShrink: 0 }} />

        {/* Size sections */}
        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sizeSections.map(section => {
            const isCollapsed = isMixed && !!collapsed[section.sizeId]
            const secTotal = sectionTotal(section.sizeId)
            return (
              <div
                key={section.sizeId}
                style={{
                  border: `1px solid ${colors.grayLight}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {/* Section header — shown for mixed packages as collapse trigger, or plain label for single */}
                {isMixed ? (
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [section.sizeId]: !prev[section.sizeId] }))}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      background: isCollapsed ? colors.black : '#1a1a1a',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.orange }}>
                        {section.sizeName}
                      </span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        · {secTotal} comida{secTotal !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, color: colors.textMuted,
                      display: 'inline-block',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s',
                    }}>
                      ▾
                    </span>
                  </button>
                ) : (
                  <div style={{ padding: '8px 14px', background: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.orange }}>
                      Talla
                    </span>
                    <span style={{ fontSize: 12, color: colors.white, fontWeight: 600 }}>{section.sizeName}</span>
                  </div>
                )}

                {/* Meal list */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: colors.black }}>
                    {activeMeals.map(meal => renderMealRow(meal, section.sizeId))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0',
              background: 'transparent', border: `1px solid ${colors.grayLight}`,
              borderRadius: 8, color: colors.white, cursor: 'pointer', fontSize: 15,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={belowMin}
            style={{
              flex: 2, padding: '12px 0',
              background: belowMin ? colors.grayLight : colors.orange,
              border: 'none', borderRadius: 8, color: colors.white,
              cursor: belowMin ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700,
              opacity: belowMin ? 0.5 : 1,
            }}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

function CartActions({ onCheckout, validating, validationError, isMembershipMatch, onMembershipConfirm }: {
  onCheckout: () => void
  validating: boolean
  validationError: string | null
  isMembershipMatch: boolean
  onMembershipConfirm: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {validationError && (
        <div style={{
          padding: '12px 16px',
          background: '#ef444422',
          border: '1px solid #ef4444',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          {validationError}
        </div>
      )}
      {isMembershipMatch ? (
        <button
          onClick={onMembershipConfirm}
          className="franchise-stroke"
          style={{
            width: '100%',
            padding: '16px 24px',
            background: colors.orange,
            color: colors.white,
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Franchise, sans-serif',
            fontSize: 22,
            letterSpacing: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Confirmar con membresía
        </button>
      ) : (
        <button
          onClick={onCheckout}
          disabled={validating}
          className="franchise-stroke"
          style={{
            width: '100%',
            padding: '16px 24px',
            cursor: validating ? 'not-allowed' : 'pointer',
            opacity: validating ? 0.7 : 1,
            background: colors.orange,
            color: colors.white,
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Franchise, sans-serif',
            fontSize: 22,
            letterSpacing: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {validating ? 'Verificando...' : 'Continuar al pago →'}
        </button>
      )}
    </div>
  )
}

