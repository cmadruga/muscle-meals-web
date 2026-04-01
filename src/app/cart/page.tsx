'use client'

import { useCartStore } from '@/lib/store/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartGroups } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup } from '@/hooks/useCartGroups'
import { colors } from '@/lib/theme'
import LoginBanner from '@/components/LoginBanner'
import { getDeliveryDate, isInCutoffWindow, formatDeliveryDate } from '@/lib/utils/delivery'

export default function CartPage() {
  const router = useRouter()
  const { removeItem, removePackage, updateQty, clearCart, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()

  const handleCheckout = () => {
    if (isEmpty) return
    router.push('/checkout')
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

      {/* Delivery date banner */}
      <DeliveryBanner />

      {/* Items */}
      <div style={{ marginBottom: 24 }}>
        {/* Paquetes */}
        {packageGroups.map((pkg) => (
          <PackageCard
            key={pkg.packageInstanceId}
            package={pkg}
            onRemove={() => removePackage(pkg.packageInstanceId)}
          />
        ))}

        {/* Items individuales */}
        {individualItems.map((item) => (
          <IndividualItemCard
            key={`${item.mealId}-${item.sizeId}`}
            item={item}
            onUpdateQty={(qty) => updateQty(item.mealId, item.sizeId, qty)}
            onRemove={() => removeItem(item.mealId, item.sizeId)}
          />
        ))}
      </div>

      <CartSummary total={getTotal()} />
      
      <CartActions
        onCheckout={handleCheckout}
      />
      </div>
    </main>
    <LoginBanner />
    </>
  )
}

// Componentes de presentación
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

function PackageCard({ package: pkg, onRemove }: { 
  package: PackageGroup
  onRemove: () => void 
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
      {/* Package Header */}
      <div style={{
        padding: 16,
        background: colors.grayLight,
        borderBottom: `1px solid ${colors.grayLight}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold', color: colors.orange }}>
          {pkg.packageName} · x{pkg.totalMeals} · {pkg.sizeName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 'bold', color: colors.white }}>
            ${(pkg.totalPrice / 100).toFixed(0)} MXN
          </span>
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

      {/* Package Items */}
      <div>
        {pkg.items.map((item, idx) => (
          <div
            key={`${item.mealId}-${item.sizeId}`}
            style={{
              padding: 16,
              borderBottom: idx < pkg.items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: 16, color: colors.white }}>{item.mealName}</span>
            <span style={{ fontSize: 14, color: colors.textMuted }}>
              x{item.qty}
            </span>
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
          width: 32,
          height: 32,
          fontSize: 18,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          background: colors.grayLight,
          color: colors.white,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
          width: 32,
          height: 32,
          fontSize: 18,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          background: colors.grayLight,
          color: colors.white,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        +
      </button>
    </div>
  )
}

function CartSummary({ total }: { total: number }) {
  return (
    <div style={{
      padding: 20,
      background: colors.grayDark,
      border: `2px solid ${colors.orange}`,
      borderRadius: 12,
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>Total:</span>
        <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
          ${(total / 100).toFixed(0)} MXN
        </span>
      </div>
    </div>
  )
}

function DeliveryBanner() {
  const deliveryDate = getDeliveryDate()
  const inCutoff = isInCutoffWindow()

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Always-visible delivery date */}
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

      {/* Cutoff warning (only Fri 12pm – Sun) */}
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
              Pedidos de esta semana ya cerraron
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textSecondary }}>
              Tu orden se procesará para el <strong style={{ color: colors.white }}>próximo domingo</strong>. Confirmarás en el checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function CartActions({ onCheckout }: {
  onCheckout: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <button
        onClick={onCheckout}
        className="franchise-stroke"
        style={{
          flex: 2,
          padding: '16px 24px',
          cursor: 'pointer',
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
        Continuar al pago →
      </button>
    </div>
  )
}