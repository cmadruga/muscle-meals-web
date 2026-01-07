'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useCartGroups } from '@/hooks/useCartGroups'
import { upsertCustomer } from '@/lib/db/customers'
import { createOrder } from '@/lib/db/orders'
import { createConektaOrder } from '@/app/actions/payment'
import type { PackageGroup } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'
import { colors } from '@/lib/theme'

export default function CheckoutClient() {
  const { items, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Datos del cliente
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const handleCheckout = async () => {
    if (!customerName || !customerEmail || !customerPhone) {
      setError('Por favor completa todos los campos')
      return
    }

    if (isEmpty) {
      setError('El carrito está vacío')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // 1. Crear o actualizar cliente
      const customer = await upsertCustomer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      })

      if (!customer) {
        throw new Error('Error al guardar información del cliente')
      }

      // 2. Crear orden en Supabase con status 'pending'
      const order = await createOrder(
        {
          customer_id: customer.id,
          total_amount: getTotal(),
          status: 'pending'
        },
        items.map(item => ({
          meal_id: item.mealId,
          size_id: item.sizeId,
          qty: item.qty,
          unit_price: item.unitPrice,
          package_id: item.packageId
        }))
      )

      // 3. Crear orden en Conekta
      const result = await createConektaOrder({
        orderId: order.id,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount: order.total_amount,
        items: items.map(item => ({
          name: `${item.mealName} (${item.sizeName})`,
          unit_price: item.unitPrice,
          quantity: item.qty
        }))
      })

      if (result.success && result.checkoutUrl) {
        // Redirigir a Conekta Checkout
        window.location.href = result.checkoutUrl
      } else {
        setError(result.error || 'Error al procesar el pago')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al procesar el pago')
      setIsProcessing(false)
    }
  }

  if (isEmpty) {
    return <EmptyCheckoutView />
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Order Summary */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 32, 
            marginBottom: 24,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            💳 <span style={{ color: colors.orange }}>Checkout</span>
          </h1>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16,
            color: colors.textSecondary,
            fontWeight: 'normal'
          }}>
            Detalle de la orden
          </h2>
          
          <OrderSummary 
            packageGroups={packageGroups}
            individualItems={individualItems}
            total={getTotal()}
          />
        </div>

        <CustomerForm 
          name={customerName}
          email={customerEmail}
          phone={customerPhone}
          onNameChange={setCustomerName}
          onEmailChange={setCustomerEmail}
          onPhoneChange={setCustomerPhone}
          disabled={isProcessing}
          error={error}
        />

        <PaymentButton 
          onClick={handleCheckout}
          disabled={isProcessing}
          isProcessing={isProcessing}
        />
      </div>
    </main>
  )
}

// Componentes de presentación
function EmptyCheckoutView() {
  return (
    <main style={{ 
      textAlign: 'center', 
      padding: '60px 24px',
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
      <h2 style={{ fontSize: 28, marginBottom: 12 }}>
        El carrito está <span style={{ color: colors.orange }}>vacío</span>
      </h2>
      <p style={{ color: colors.textMuted }}>Agrega items para continuar</p>
    </main>
  )
}

function OrderSummary({ packageGroups, individualItems, total }: {
  packageGroups: PackageGroup[]
  individualItems: CartItem[]
  total: number
}) {
  return (
    <>
      <div style={{ 
        border: `2px solid ${colors.grayLight}`, 
        borderRadius: 12, 
        overflow: 'hidden',
        background: colors.grayDark
      }}>
        {/* Paquetes */}
        {packageGroups.map((pkg) => (
          <PackageSummaryCard key={pkg.packageInstanceId} package={pkg} />
        ))}
        
        {/* Items individuales */}
        {individualItems.map((item, idx) => (
          <IndividualItemSummary 
            key={`${item.mealId}-${item.sizeId}`}
            item={item}
            showBorder={idx < individualItems.length - 1 || packageGroups.length > 0}
          />
        ))}
      </div>

      {/* Total */}
      <div style={{
        marginTop: 16,
        padding: 20,
        background: colors.grayDark,
        border: `2px solid ${colors.orange}`,
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>Total:</span>
        <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
          ${(total / 100).toFixed(0)} MXN
        </span>
      </div>
    </>
  )
}

function PackageSummaryCard({ package: pkg }: { package: PackageGroup }) {
  return (
    <div style={{ background: colors.grayLight }}>
      {/* Package header */}
      <div style={{
        padding: 16,
        borderBottom: `1px solid ${colors.black}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ color: colors.orange }}>📦 {pkg.packageName}</strong>
          <span style={{ marginLeft: 8, color: colors.textMuted }}>· {pkg.sizeName}</span>
        </div>
        <strong style={{ color: colors.white }}>${(pkg.totalPrice / 100).toFixed(0)} MXN</strong>
      </div>
      
      {/* Package items */}
      {pkg.items.map((item) => (
        <div
          key={`${item.mealId}-${item.sizeId}`}
          style={{
            padding: '12px 16px 12px 32px',
            borderBottom: `1px solid ${colors.grayDark}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            color: colors.textMuted
          }}
        >
          <span>{item.mealName}</span>
          <span>x{item.qty}</span>
        </div>
      ))}
    </div>
  )
}

function IndividualItemSummary({ item, showBorder }: {
  item: CartItem
  showBorder: boolean
}) {
  return (
    <div
      style={{
        padding: 16,
        borderBottom: showBorder ? `1px solid ${colors.grayLight}` : 'none',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: colors.orange }}>
          {item.mealName}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
          {item.sizeName} · x{item.qty}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: 14, color: colors.textMuted }}>
          ${(item.unitPrice / 100).toFixed(0)} MXN c/u
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: colors.white }}>
          ${(item.unitPrice * item.qty / 100).toFixed(0)} MXN
        </p>
      </div>
    </div>
  )
}

function CustomerForm({ 
  name, 
  email, 
  phone, 
  onNameChange, 
  onEmailChange, 
  onPhoneChange, 
  disabled,
  error
}: {
  name: string
  email: string
  phone: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  disabled: boolean
  error: string | null
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ 
        fontSize: 20, 
        marginBottom: 20,
        color: colors.textSecondary,
        fontWeight: 'normal'
      }}>
        Información de contacto
      </h2>
      
      {error && (
        <div style={{
          color: 'white',
          background: colors.error,
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: colors.white }}>
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Juan Pérez"
            disabled={disabled}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              borderRadius: 8,
              border: `2px solid ${colors.grayLight}`,
              background: colors.grayDark,
              color: colors.white,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: colors.white }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="juan@ejemplo.com"
            disabled={disabled}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              borderRadius: 8,
              border: `2px solid ${colors.grayLight}`,
              background: colors.grayDark,
              color: colors.white,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: colors.white }}>
            Teléfono
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="5512345678"
            disabled={disabled}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              borderRadius: 8,
              border: `2px solid ${colors.grayLight}`,
              background: colors.grayDark,
              color: colors.white,
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function PaymentButton({ onClick, disabled, isProcessing }: {
  onClick: () => void
  disabled: boolean
  isProcessing: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '18px 24px',
        fontSize: 18,
        fontWeight: 'bold',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        opacity: isProcessing ? 0.5 : 1,
        background: colors.orange,
        color: colors.black,
        border: 'none',
        borderRadius: 8,
        textTransform: 'uppercase'
      }}
    >
      {isProcessing ? 'Procesando...' : '💳 Proceder al pago'}
    </button>
  )
}
