'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useCartGroups } from '@/hooks/useCartGroups'
import { upsertCustomer } from '@/lib/db/customers'
import { createOrder } from '@/lib/db/orders'
import { createConektaOrder } from '@/app/actions/payment'
import type { PackageGroup } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'

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
    <div>
      {/* Order Summary */}
      <div style={{ marginBottom: 32 }}>
        <h1>Checkout</h1>
        <h2>Detalle de la orden</h2>
        
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
  )
}

// Componentes de presentación
function EmptyCheckoutView() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2>El carrito está vacío</h2>
      <p style={{ color: '#666' }}>Agrega items para continuar</p>
    </div>
  )
}

function OrderSummary({ packageGroups, individualItems, total }: {
  packageGroups: PackageGroup[]
  individualItems: CartItem[]
  total: number
}) {
  return (
    <>
      <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
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
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>Total:</span>
        <span style={{ fontSize: 24, fontWeight: 'bold' }}>
          ${(total / 100).toFixed(0)} MXN
        </span>
      </div>
    </>
  )
}

function PackageSummaryCard({ package: pkg }: { package: PackageGroup }) {
  return (
    <div style={{ background: '#f9f9f9' }}>
      {/* Package header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>{pkg.packageName}</strong>
          <span style={{ marginLeft: 8, color: '#666' }}>· {pkg.sizeName}</span>
        </div>
        <strong>${(pkg.totalPrice / 100).toFixed(0)} MXN</strong>
      </div>
      
      {/* Package items */}
      {pkg.items.map((item) => (
        <div
          key={`${item.mealId}-${item.sizeId}`}
          style={{
            padding: '12px 16px 12px 32px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            color: '#666'
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
        borderBottom: showBorder ? '1px solid #eee' : 'none',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>
          {item.mealName}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
          {item.sizeName} · x{item.qty}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#666' }}>
          ${(item.unitPrice / 100).toFixed(0)} MXN c/u
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
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
      <h2>Información de contacto</h2>
      
      {error && (
        <div style={{
          color: 'white',
          background: '#ef4444',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
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
              padding: 12,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
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
              padding: 12,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
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
              padding: 12,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #ccc'
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
        padding: '16px 24px',
        fontSize: 18,
        fontWeight: 'bold',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        opacity: isProcessing ? 0.5 : 1,
        background: '#333',
        color: 'white',
        border: 'none',
        borderRadius: 8
      }}
    >
      {isProcessing ? 'Procesando...' : '💳 Proceder al pago'}
    </button>
  )
}
