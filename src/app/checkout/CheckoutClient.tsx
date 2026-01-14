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
import { 
  isValidPostalCode,
  getZoneByPostalCode,
  buildFullAddress,
  validateCP, 
  validatePhone,
  formatPhoneForWhatsApp,
  type Address 
} from '@/lib/address-validation'

export default function CheckoutClient() {
  const { items, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  
  // Datos del cliente
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Dirección separada
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [ciudad, setCiudad] = useState('Monterrey')
  const [estado, setEstado] = useState('Nuevo León')
  
  // Estado de validación
  const [addressValidated, setAddressValidated] = useState(false)

  const handleValidateAddress = () => {
    try {
      setIsValidatingAddress(true)
      setError(null)
      
      // 1. Validar formato de código postal
      if (!validateCP(codigoPostal)) {
        throw new Error('Código postal inválido (debe ser 5 dígitos)')
      }
      
      // 2. Verificar que el CP esté en la lista de permitidos
      if (!isValidPostalCode(codigoPostal)) {
        throw new Error(
          `Lo sentimos, no hacemos envíos a este código postal (${codigoPostal}). ` +
          `Solo entregamos en el Área Metropolitana de Monterrey.`
        )
      }
      
      const zone = getZoneByPostalCode(codigoPostal)
      setAddressValidated(true)
      alert(`✅ Dirección validada - Zona: ${zone}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar dirección')
      setAddressValidated(false)
    } finally {
      setIsValidatingAddress(false)
    }
  }

  const handleCheckout = async () => {
    // Validar teléfono
    if (!validatePhone(customerPhone)) {
      setError('Teléfono inválido (debe ser 10 dígitos)')
      return
    }

    // Validar campos básicos
    if (!customerName.trim() || !customerPhone.trim() || 
        !calle.trim() || !numeroExterior.trim() || !colonia.trim() || 
        !codigoPostal.trim() || !ciudad.trim() || !estado.trim()) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }
    
    // Verificar que la dirección haya sido validada
    if (!addressValidated) {
      setError('Por favor valida la dirección antes de continuar')
      return
    }

    if (!customerName || !customerPhone) {
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
      // 1. Crear o actualizar cliente con dirección completa y WhatsApp
      const address: Address = {
        calle,
        numeroExterior,
        numeroInterior,
        colonia,
        codigoPostal,
        ciudad,
        estado
      }
      const fullAddress = buildFullAddress(address)
      const whatsappPhone = formatPhoneForWhatsApp(customerPhone)
      
      const customer = await upsertCustomer({
        name: customerName,
        phone: whatsappPhone,
        address: fullAddress
      })

      if (!customer) {
        throw new Error('Error al guardar información del cliente')
      }

      // 2. Crear orden en Supabase con status 'pending'
      // TODO: Agregar delivery_address al schema de orders
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
        customerPhone: whatsappPhone,
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
          phone={customerPhone}
          calle={calle}
          numeroExterior={numeroExterior}
          numeroInterior={numeroInterior}
          colonia={colonia}
          codigoPostal={codigoPostal}
          ciudad={ciudad}
          estado={estado}
          onNameChange={setCustomerName}
          onPhoneChange={setCustomerPhone}
          onCalleChange={setCalle}
          onNumeroExteriorChange={setNumeroExterior}
          onNumeroInteriorChange={setNumeroInterior}
          onColoniaChange={setColonia}
          onCodigoPostalChange={setCodigoPostal}
          onCiudadChange={setCiudad}
          onEstadoChange={setEstado}
          onValidateAddress={handleValidateAddress}
          isValidatingAddress={isValidatingAddress}
          addressValidated={addressValidated}
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
  phone,
  calle,
  numeroExterior,
  numeroInterior,
  colonia,
  codigoPostal,
  ciudad,
  estado,
  onNameChange, 
  onPhoneChange,
  onCalleChange,
  onNumeroExteriorChange,
  onNumeroInteriorChange,
  onColoniaChange,
  onCodigoPostalChange,
  onCiudadChange,
  onEstadoChange,
  onValidateAddress,
  isValidatingAddress,
  addressValidated,
  disabled,
  error
}: {
  name: string
  phone: string
  calle: string
  numeroExterior: string
  numeroInterior: string
  colonia: string
  codigoPostal: string
  ciudad: string
  estado: string
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onCalleChange: (value: string) => void
  onNumeroExteriorChange: (value: string) => void
  onNumeroInteriorChange: (value: string) => void
  onColoniaChange: (value: string) => void
  onCodigoPostalChange: (value: string) => void
  onCiudadChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onValidateAddress: () => void
  isValidatingAddress: boolean
  addressValidated: boolean
  disabled: boolean
  error: string | null
}) {
  const inputStyle = {
    width: '100%',
    padding: 14,
    fontSize: 16,
    borderRadius: 8,
    border: `2px solid ${colors.grayLight}`,
    background: colors.grayDark,
    color: colors.white,
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 8,
    fontWeight: 'bold',
    color: colors.white,
    fontSize: 14
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ 
        fontSize: 20, 
        marginBottom: 20,
        color: colors.textSecondary,
        fontWeight: 'normal'
      }}>
        Información de contacto y envío
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
        {/* Nombre */}
        <div>
          <label style={labelStyle}>
            Nombre completo *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Juan Pérez García"
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label style={labelStyle}>
            WhatsApp (10 dígitos) *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              if (value.length <= 10) onPhoneChange(value)
            }}
            placeholder="8112345678"
            disabled={disabled}
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 0 }}>
            Recibirás confirmación de pago por WhatsApp
          </p>
        </div>

        {/* Separador visual */}
        <div style={{ 
          height: 1, 
          background: colors.grayLight, 
          margin: '8px 0' 
        }} />

        <h3 style={{ 
          fontSize: 16, 
          color: colors.orange, 
          marginBottom: 0,
          marginTop: 8,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          📍 Dirección de entrega
        </h3>

        {/* Calle */}
        <div>
          <label style={labelStyle}>
            Calle *
          </label>
          <input
            type="text"
            value={calle}
            onChange={(e) => onCalleChange(e.target.value)}
            placeholder="Av. Constitución"
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* Número exterior e interior */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>
              Núm. Exterior *
            </label>
            <input
              type="text"
              value={numeroExterior}
              onChange={(e) => onNumeroExteriorChange(e.target.value)}
              placeholder="123"
              disabled={disabled}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Núm. Interior
            </label>
            <input
              type="text"
              value={numeroInterior}
              onChange={(e) => onNumeroInteriorChange(e.target.value)}
              placeholder="Depto. 4B"
              disabled={disabled}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Colonia */}
        <div>
          <label style={labelStyle}>
            Colonia *
          </label>
          <input
            type="text"
            value={colonia}
            onChange={(e) => onColoniaChange(e.target.value)}
            placeholder="Centro"
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* CP y Ciudad */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>
              CP *
            </label>
            <input
              type="text"
              value={codigoPostal}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                if (value.length <= 5) onCodigoPostalChange(value)
              }}
              placeholder="64000"
              disabled={disabled}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Ciudad *
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => onCiudadChange(e.target.value)}
              placeholder="Monterrey"
              disabled={disabled}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label style={labelStyle}>
            Estado *
          </label>
          <input
            type="text"
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            placeholder="Nuevo León"
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* Botón de validación */}
        <button
          onClick={onValidateAddress}
          disabled={disabled || isValidatingAddress}
          style={{
            width: '100%',
            padding: '14px 20px',
            fontSize: 16,
            fontWeight: 'bold',
            borderRadius: 8,
            border: addressValidated 
              ? `2px solid #10b981` 
              : `2px solid ${colors.orange}`,
            background: addressValidated 
              ? '#10b981' 
              : colors.orange,
            color: colors.black,
            cursor: disabled || isValidatingAddress ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: disabled || isValidatingAddress ? 0.6 : 1
          }}
        >
          {isValidatingAddress 
            ? '⏳ Validando...' 
            : addressValidated 
              ? '✅ Dirección validada' 
              : '🔍 Validar dirección'}
        </button>

        {addressValidated && (
          <div style={{
            background: '#10b98120',
            border: '2px solid #10b981',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: '#10b981',
            textAlign: 'center'
          }}>
            ✅ Dirección confirmada dentro del área de entrega
          </div>
        )}
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
