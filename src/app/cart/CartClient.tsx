'use client'

import { useState } from 'react'
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


type PendingDelete =
  | { type: 'item'; mealId: string; sizeId: string; name: string }
  | { type: 'package'; instanceId: string; name: string }

export default function CartClient({
  inCutoff,
  prefill,
  membership,
  pickupSpots,
  usedMembershipThisWeek,
}: {
  inCutoff: boolean
  prefill: PrefillInfo | null
  membership: MembershipInfo | null
  pickupSpots: PickupSpot[]
  usedMembershipThisWeek: boolean
}) {
  const router = useRouter()
  const { removeItem, removePackage, updateQty, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
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
            onEdit={() => router.push(`/package?edit=${pkg.packageInstanceId}`)}
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

