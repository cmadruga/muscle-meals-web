'use client'

import { useCartStore } from '@/lib/store/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartGroups } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup } from '@/hooks/useCartGroups'
import { colors } from '@/lib/theme'

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
    <main style={{ 
      padding: '40px 24px', 
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: 32, 
        marginBottom: 32,
        textTransform: 'uppercase',
        letterSpacing: 2
      }}>
        🛒 <span style={{ color: colors.orange }}>Tu</span> Carrito
      </h1>

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
        onClear={clearCart}
        onCheckout={handleCheckout}
      />
      </div>
    </main>
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
      <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
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
        style={{
          display: 'inline-block',
          padding: '16px 32px',
          background: colors.orange,
          color: colors.black,
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 16,
          textTransform: 'uppercase'
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
          {pkg.packageName} · {pkg.sizeName}
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
      style={{
        padding: 16,
        marginBottom: 12,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 12,
        background: colors.grayDark,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: colors.orange }}>
          {item.mealName}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
          {item.sizeName}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 100 }}>
        <p style={{ margin: '0 0 4px 0', fontSize: 14, color: colors.textMuted }}>
          ${(item.unitPrice / 100).toFixed(0)} MXN c/u
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: colors.white }}>
          ${((item.unitPrice * item.qty) / 100).toFixed(0)} MXN
        </p>
      </div>

      <QuantityControls 
        value={item.qty}
        onChange={onUpdateQty}
      />
      
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

function CartActions({ onClear, onCheckout }: {
  onClear: () => void
  onCheckout: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <button
        onClick={onClear}
        style={{
          flex: 1,
          padding: '16px 24px',
          fontSize: 16,
          border: `2px solid ${colors.grayLight}`,
          borderRadius: 8,
          background: 'transparent',
          color: colors.white,
          cursor: 'pointer'
        }}
      >
        Vaciar carrito
      </button>
      <button
        onClick={onCheckout}
        style={{
          flex: 2,
          padding: '16px 24px',
          fontSize: 18,
          fontWeight: 'bold',
          cursor: 'pointer',
          background: colors.orange,
          color: colors.black,
          border: 'none',
          borderRadius: 8,
          textTransform: 'uppercase'
        }}
      >
        Continuar al pago →
      </button>
    </div>
  )
}