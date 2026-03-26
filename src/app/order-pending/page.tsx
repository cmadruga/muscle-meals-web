import Link from 'next/link'
import { colors } from '@/lib/theme'
import { getOrderSummary } from '@/app/actions/orders'
import ClearCartOnMount from '@/components/ClearCartOnMount'

const SHIPPING_LABELS: Record<string, string> = {
  standard: 'Envío estándar',
  priority: 'Envío prioritario',
  pickup: 'Recoger en local',
}

export default async function OrderPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string }>
}) {
  const { our_order_id } = await searchParams
  const order = our_order_id ? await getOrderSummary(our_order_id) : null

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: colors.black,
    }}>
      <ClearCartOnMount />

      <div style={{
        maxWidth: 500,
        width: '100%',
        background: colors.grayDark,
        border: `2px solid #fbbf24`,
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
      }}>
        {/* Ícono */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#fbbf24',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 40, color: colors.black,
        }}>
          ⏳
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 12, color: '#fbbf24', textTransform: 'uppercase' }}>
          Pago pendiente
        </h1>

        <p style={{ fontSize: 15, color: colors.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
          Tu pedido fue creado. Revisa tu email para las instrucciones de pago que te envió MercadoPago y completa tu pago para que podamos empezar a preparar tus comidas.
        </p>

        {/* Resumen del pedido */}
        {order && (
          <div style={{
            background: colors.black,
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            {/* Referencia */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Pedido
              </span>
              <span style={{ fontSize: 14, fontWeight: 'bold', color: colors.white, fontFamily: 'monospace' }}>
                #{order.order_number}
              </span>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 14, color: colors.white }}>{item.meal_name}</span>
                    {item.size_name && (
                      <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>({item.size_name})</span>
                    )}
                    {item.qty > 1 && (
                      <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>×{item.qty}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: colors.white }}>
                    ${((item.unit_price * item.qty) / 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Separador */}
            <div style={{ borderTop: `1px solid ${colors.grayLight}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {order.shipping_cost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: colors.textMuted }}>
                    {SHIPPING_LABELS[order.shipping_type] ?? 'Envío'}
                  </span>
                  <span style={{ fontSize: 13, color: colors.textMuted }}>
                    ${(order.shipping_cost / 100).toFixed(0)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 'bold', color: colors.white }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 'bold', color: '#fbbf24' }}>
                  ${(order.total_amount / 100).toFixed(0)} MXN
                </span>
              </div>
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
          En cuanto confirmemos tu pago te avisamos por WhatsApp y comenzamos a preparar tus comidas. 💪
        </p>

        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <Link href="/" style={{
            display: 'block', padding: '14px 24px',
            background: '#fbbf24', color: colors.black,
            textDecoration: 'none', borderRadius: 8,
            fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase',
          }}>
            Volver al inicio
          </Link>
          <Link href="/menu" style={{
            display: 'block', padding: '14px 24px',
            background: 'transparent', color: '#fbbf24',
            textDecoration: 'none', borderRadius: 8,
            fontWeight: 'bold', fontSize: 16,
            border: `2px solid #fbbf24`,
          }}>
            Hacer otro pedido
          </Link>
        </div>
      </div>
    </main>
  )
}
