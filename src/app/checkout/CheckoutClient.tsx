'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useCartGroups } from '@/hooks/useCartGroups'
import { upsertCustomer } from '@/lib/db/customers'
import { createOrder } from '@/lib/db/orders'
import { createConektaOrder } from '@/app/actions/payment'
import type { PackageGroup } from '@/hooks/useCartGroups'
import type { CartItem } from '@/lib/store/cart'
import type { PickupSpot } from '@/lib/db/pickup-spots'
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

// Tipos de envío
type ShippingType = 'standard' | 'priority' | 'pickup'

const SHIPPING_COSTS = {
  standard: 4900, // $49 MXN en centavos
  priority: 0,    // A cotizar ($100-200 según zona/horario)
  pickup: 0       // Gratis - recoger en local
}

export default function CheckoutClient({ pickupSpots }: { pickupSpots: PickupSpot[] }) {
  const { items, getTotal } = useCartStore()
  const { packageGroups, individualItems, isEmpty } = useCartGroups()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Tipo de envío
  const [shippingType, setShippingType] = useState<ShippingType>('standard')
  const [selectedPickupSpot, setSelectedPickupSpot] = useState<string>('')
  
  // Datos del cliente
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Dirección separada
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [ciudad, setCiudad] = useState('Monterrey')
  const [estado, setEstado] = useState('Nuevo León')
  
  // Validación automática
  const isAddressComplete = Boolean(
    calle.trim() && 
    numeroExterior.trim() && 
    colonia.trim() && 
    codigoPostal.trim() && 
    ciudad.trim() && 
    estado.trim()
  )
  
  const isPostalCodeValid = validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
  const addressValidated = isAddressComplete && isPostalCodeValid
  const zone = isPostalCodeValid ? getZoneByPostalCode(codigoPostal) : null
  
  // Calcular total con envío
  const subtotal = getTotal()
  const shippingCost = SHIPPING_COSTS[shippingType]
  const total = subtotal + shippingCost
  
  // Validar pickup spot si es necesario
  const isPickupSpotValid = shippingType !== 'pickup' || selectedPickupSpot !== ''

  const handleCheckout = async () => {
    // Validar teléfono
    if (!validatePhone(customerPhone)) {
      setError('Teléfono inválido (debe ser 10 dígitos)')
      return
    }
    
    // Validar email
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Por favor ingresa un email válido')
      return
    }

    // Validar campos básicos
    if (!customerName.trim()) {
      setError('Por favor ingresa tu nombre completo')
      return
    }
    
    if (!addressValidated) {
      setError('Por favor completa todos los campos de la dirección con un código postal válido')
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
        email: customerEmail,
        address: fullAddress
      })

      if (!customer) {
        throw new Error('Error al guardar información del cliente')
      }

      // 2. Crear orden en Supabase con status 'pending'
      const order = await createOrder(
        {
          customer_id: customer.id,
          total_amount: total,
          status: 'pending',
          shipping_type: shippingType,
          pickup_spot_id: shippingType === 'pickup' ? selectedPickupSpot : null,
          shipping_cost: shippingCost
        },
        items.map(item => ({
          meal_id: item.mealId,
          size_id: item.sizeId,
          qty: item.qty,
          unit_price: item.unitPrice,
          package_id: item.packageId
        }))
      )

      // 3. Crear orden en Conekta con email real del cliente
      const conektaItems = [
        ...items.map(item => ({
          name: `${item.mealName} (${item.sizeName})`,
          unit_price: item.unitPrice,
          quantity: item.qty
        }))
      ]
      
      // Agregar envío solo si tiene costo
      if (shippingCost > 0) {
        conektaItems.push({
          name: 'Envío Estándar',
          unit_price: shippingCost,
          quantity: 1
        })
      } else if (shippingType === 'priority') {
        // Nota: Envío prioritario se cotiza después
        conektaItems.push({
          name: 'Envío Prioritario (A cotizar: $100-200)',
          unit_price: 0,
          quantity: 1
        })
      } else if (shippingType === 'pickup') {
        const spot = pickupSpots.find(s => s.id === selectedPickupSpot)
        conektaItems.push({
          name: `Recoger en: ${spot?.name || 'Pickup Spot'}`,
          unit_price: 0,
          quantity: 1
        })
      }
      
      const result = await createConektaOrder({
        orderId: order.id,
        customerName,
        customerEmail,
        customerPhone: whatsappPhone,
        totalAmount: order.total_amount,
        items: conektaItems
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
            subtotal={subtotal}
            shippingCost={shippingCost}
            shippingType={shippingType}
            total={total}
          />
        </div>

        <CustomerForm 
          name={customerName}
          email={customerEmail}
          phone={customerPhone}
          calle={calle}
          numeroExterior={numeroExterior}
          numeroInterior={numeroInterior}
          colonia={colonia}
          codigoPostal={codigoPostal}
          ciudad={ciudad}
          estado={estado}
          onNameChange={setCustomerName}
          onEmailChange={setCustomerEmail}
          onPhoneChange={setCustomerPhone}
          onCalleChange={setCalle}
          onNumeroExteriorChange={setNumeroExterior}
          onNumeroInteriorChange={setNumeroInterior}
          onColoniaChange={setColonia}
          onCodigoPostalChange={setCodigoPostal}
          onCiudadChange={setCiudad}
          onEstadoChange={setEstado}
          addressValidated={addressValidated}
          zone={zone}
          disabled={isProcessing}
          error={error}
        />

        <ShippingSelector
          selectedType={shippingType}
          onTypeChange={setShippingType}
          selectedPickupSpot={selectedPickupSpot}
          onPickupSpotChange={setSelectedPickupSpot}
          pickupSpots={pickupSpots}
          disabled={isProcessing}
        />

        <PaymentButton 
          onClick={handleCheckout}
          disabled={isProcessing || !addressValidated || !customerName.trim() || !customerEmail.trim() || !validatePhone(customerPhone) || !isPickupSpotValid}
          isProcessing={isProcessing}
          addressValidated={addressValidated}
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

function OrderSummary({ packageGroups, individualItems, subtotal, shippingCost, shippingType, total }: {
  packageGroups: PackageGroup[]
  individualItems: CartItem[]
  subtotal: number
  shippingCost: number
  shippingType: 'standard' | 'priority' | 'pickup'
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

      {/* Desglose */}
      <div style={{
        marginTop: 16,
        padding: 20,
        background: colors.grayDark,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 12,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
          fontSize: 16,
          color: colors.textSecondary
        }}>
          <span>Subtotal:</span>
          <span>${(subtotal / 100).toFixed(0)} MXN</span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: `1px solid ${colors.grayLight}`,
          fontSize: 16,
          color: colors.textSecondary
        }}>
          <span>
            Envío {
              shippingType === 'standard' ? 'Estándar' : 
              shippingType === 'priority' ? 'Prioritario' : 
              'Pickup'
            }:
            {shippingType === 'pickup' && (
              <span style={{ fontSize: 12, display: 'block', color: colors.orange }}>
                (Sin costo)
              </span>
            )}
          </span>
          <span style={{ textAlign: 'right' }}>
            {shippingCost > 0 
              ? `$${(shippingCost / 100).toFixed(0)} MXN` 
              : shippingType === 'priority' 
                ? 'Pendiente' 
                : 'Gratis'
            }
            {shippingType === 'priority' && (
              <span style={{ fontSize: 12, display: 'block', color: colors.orange }}>
                (Estimado: $100-200)
              </span>
            )}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>Total:</span>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
            ${(total / 100).toFixed(0)} MXN
          </span>
        </div>
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
          <strong style={{ color: colors.orange }}>{pkg.packageName}</strong>
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
  calle,
  numeroExterior,
  numeroInterior,
  colonia,
  codigoPostal,
  ciudad,
  estado,
  onNameChange, 
  onEmailChange,
  onPhoneChange,
  onCalleChange,
  onNumeroExteriorChange,
  onNumeroInteriorChange,
  onColoniaChange,
  onCodigoPostalChange,
  onCiudadChange,
  onEstadoChange,
  addressValidated,
  zone,
  disabled,
  error
}: {
  name: string
  email: string
  phone: string
  calle: string
  numeroExterior: string
  numeroInterior: string
  colonia: string
  codigoPostal: string
  ciudad: string
  estado: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onCalleChange: (value: string) => void
  onNumeroExteriorChange: (value: string) => void
  onNumeroInteriorChange: (value: string) => void
  onColoniaChange: (value: string) => void
  onCodigoPostalChange: (value: string) => void
  onCiudadChange: (value: string) => void
  onEstadoChange: (value: string) => void
  addressValidated: boolean
  zone: string | null
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

        {/* Email */}
        <div>
          <label style={labelStyle}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="tu@email.com"
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
              style={{
                ...inputStyle,
                borderColor: codigoPostal.length === 5 
                  ? (validateCP(codigoPostal) && isValidPostalCode(codigoPostal) ? '#10b981' : '#ef4444')
                  : colors.grayLight
              }}
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

        {/* Mensaje de validación de CP */}
        {codigoPostal.length === 5 && (
          <div style={{
            background: validateCP(codigoPostal) && isValidPostalCode(codigoPostal) 
              ? '#10b98120' 
              : '#ef444420',
            border: validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
              ? '2px solid #10b981'
              : '2px solid #ef4444',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
              ? '#10b981'
              : '#ef4444',
            textAlign: 'center'
          }}>
            {validateCP(codigoPostal) && isValidPostalCode(codigoPostal)
              ? `✅ CP válido - Zona: ${zone}`
              : '❌ CP fuera del área de entrega (Solo Área Metropolitana de Monterrey)'}
          </div>
        )}

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
            disabled={true}
            style={{
              ...inputStyle,
              opacity: 0.6,
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* Indicador de dirección completa */}
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
            ✅ Dirección completa y validada - Listo para proceder al pago
          </div>
        )}
      </div>
    </div>
  )
}

function ShippingSelector({ selectedType, onTypeChange, selectedPickupSpot, onPickupSpotChange, pickupSpots, disabled }: {
  selectedType: 'standard' | 'priority' | 'pickup'
  onTypeChange: (type: 'standard' | 'priority' | 'pickup') => void
  selectedPickupSpot: string
  onPickupSpotChange: (spotId: string) => void
  pickupSpots: PickupSpot[]
  disabled: boolean
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ 
        fontSize: 20, 
        marginBottom: 20,
        color: colors.textSecondary,
        fontWeight: 'normal'
      }}>
        Tipo de envío
      </h2>



      {/* Opciones de envío */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Envío Estándar */}
        <button
          onClick={() => onTypeChange('standard')}
          disabled={disabled}
          style={{
            padding: 20,
            background: selectedType === 'standard' ? colors.grayLight : colors.grayDark,
            border: selectedType === 'standard' ? `3px solid ${colors.orange}` : `2px solid ${colors.grayLight}`,
            borderRadius: 12,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `2px solid ${selectedType === 'standard' ? colors.orange : colors.grayLight}`,
              background: selectedType === 'standard' ? colors.orange : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {selectedType === 'standard' && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.black
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.white,
                marginBottom: 4
              }}>
                Envío Estándar - $49 MXN
              </div>
              <div style={{ fontSize: 14, color: colors.textMuted }}>
                Entrega en horario regular (Domingo 9AM - 4PM)
              </div>

              {/* Mensaje expandido cuando está seleccionado */}
              {selectedType === 'standard' && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `2px solid ${colors.orange}`,
                }}>
                  <div style={{
                    background: colors.black,
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${colors.grayLight}`
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 22 }}>📅</div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: colors.orange,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Horario Específico Dependiendo de Tu Zona
                      </div>
                    </div>
                    
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: 14,
                      color: colors.white,
                      lineHeight: 1.6
                    }}>
                      Nos estaremos <strong style={{ color: colors.orange }}>comunicando el día Sábado</strong> para darte una hora estimada de entrega para el Domingo.
                    </p>
                    
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${colors.grayLight}`,
                      fontSize: 13,
                      color: colors.textMuted,
                      textAlign: 'center'
                    }}>
                      Entrega: <strong style={{ color: colors.orange }}>Domingo 9AM - 4PM</strong> · Horario específico según tu zona
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Recoger en Pickup Spot */}
        <button
          onClick={() => onTypeChange('pickup')}
          disabled={disabled}
          style={{
            padding: 20,
            background: selectedType === 'pickup' ? colors.grayLight : colors.grayDark,
            border: selectedType === 'pickup' ? `3px solid ${colors.orange}` : `2px solid ${colors.grayLight}`,
            borderRadius: 12,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `2px solid ${selectedType === 'pickup' ? colors.orange : colors.grayLight}`,
              background: selectedType === 'pickup' ? colors.orange : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {selectedType === 'pickup' && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.black
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.white,
                marginBottom: 4
              }}>
                Recoger en Pickup Spot - Gratis
              </div>
              <div style={{ fontSize: 14, color: colors.textMuted }}>
                Sin costo de envío, recoge tu pedido en el horario del local
              </div>

              {/* Selector de Pickup Spots expandido cuando está seleccionado */}
              {selectedType === 'pickup' && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `2px solid ${colors.orange}`,
                }}>
                  <h3 style={{
                    fontSize: 14,
                    color: colors.orange,
                    marginTop: 0,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 'bold'
                  }}>
                    📍 Selecciona tu Pickup Spot
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pickupSpots.map(spot => (
                      <div
                        key={spot.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onPickupSpotChange(spot.id)
                        }}
                        style={{
                          padding: 14,
                          background: selectedPickupSpot === spot.id ? colors.black : colors.grayDark,
                          border: selectedPickupSpot === spot.id ? `2px solid ${colors.orange}` : `1px solid ${colors.grayLight}`,
                          borderRadius: 8,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          opacity: disabled ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: `2px solid ${selectedPickupSpot === spot.id ? colors.orange : colors.grayLight}`,
                            background: selectedPickupSpot === spot.id ? colors.orange : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2
                          }}>
                            {selectedPickupSpot === spot.id && (
                              <div style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: colors.black
                              }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 'bold',
                              color: colors.white,
                              marginBottom: 4
                            }}>
                              {spot.name}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>
                              📍 {spot.address}
                            </div>
                            <div style={{ fontSize: 12, color: colors.orange }}>
                              🕐 {spot.schedule}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPickupSpot === '' && (
                    <div style={{
                      marginTop: 12,
                      padding: 10,
                      background: '#ef444420',
                      border: '1px solid #ef4444',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#ef4444',
                      textAlign: 'center'
                    }}>
                      ⚠️ Por favor selecciona un pickup spot para continuar
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Envío Prioritario */}
        <button
          onClick={() => onTypeChange('priority')}
          disabled={disabled}
          style={{
            padding: 20,
            background: selectedType === 'priority' ? colors.grayLight : colors.grayDark,
            border: selectedType === 'priority' ? `3px solid ${colors.orange}` : `2px solid ${colors.grayLight}`,
            borderRadius: 12,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `2px solid ${selectedType === 'priority' ? colors.orange : colors.grayLight}`,
              background: selectedType === 'priority' ? colors.orange : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {selectedType === 'priority' && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.black
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.white,
                marginBottom: 4
              }}>
                Envío Prioritario - Pago por Separado
              </div>
              <div style={{ fontSize: 14, color: colors.textMuted }}>
                Entrega en horario y zona específica
              </div>
              <div style={{ fontSize: 12, color: colors.orange, marginTop: 4 }}>
                Rango estimado: $100-200 dependiendo zona y horario
              </div>
              
              {/* Mensaje expandido cuando está seleccionado */}
              {selectedType === 'priority' && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `2px solid ${colors.orange}`,
                }}>
                  <div style={{
                    background: colors.black,
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${colors.grayLight}`
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 22 }}>📞</div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: colors.orange,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Importante
                      </div>
                    </div>
                    
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: 14,
                      color: colors.white,
                      lineHeight: 1.6
                    }}>
                      Después de completar tu orden, <strong style={{ color: colors.orange }}>nos contactaremos contigo</strong> para:
                    </p>
                    
                    <ul style={{
                      margin: '0 0 12px 0',
                      paddingLeft: 20,
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 1.7
                    }}>
                      <li>Acordar horario y zona de entrega específica</li>
                      <li>Confirmar el costo de envío según tu ubicación</li>
                      <li>Coordinar el <strong style={{ color: colors.white }}>pago por separado</strong> del envío</li>
                    </ul>
                    
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${colors.grayLight}`,
                      fontSize: 13,
                      color: colors.textMuted,
                      textAlign: 'center'
                    }}>
                      Costo estimado: <strong style={{ color: colors.orange }}>$100-200 MXN</strong> · Se paga por separado
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

function PaymentButton({ onClick, disabled, isProcessing, addressValidated }: {
  onClick: () => void
  disabled: boolean
  isProcessing: boolean
  addressValidated: boolean
}) {
  const getButtonText = () => {
    if (isProcessing) return 'Procesando...'
    if (!addressValidated) return '⚠️ Completa y valida la dirección primero'
    return '💳 Proceder al pago'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '18px 24px',
        fontSize: 18,
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: disabled ? colors.grayLight : colors.orange,
        color: disabled ? colors.textMuted : colors.black,
        border: disabled ? `2px solid ${colors.grayLight}` : 'none',
        borderRadius: 8,
        textTransform: 'uppercase',
        transition: 'all 0.2s'
      }}
    >
      {getButtonText()}
    </button>
  )
}
