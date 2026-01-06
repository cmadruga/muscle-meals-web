import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderDetailed } from '@/lib/db/orders-server'

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const orderData = await getOrderDetailed(id)

  if (!orderData) {
    notFound()
  }

  const { order, items } = orderData

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          padding: '8px 16px',
          fontSize: 14,
          border: '1px solid #ccc',
          borderRadius: 8,
          background: 'white',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        ← Regresar
      </Link>

      <h1>Checkout</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Orden: <code>{order.id}</code>
      </p>

      {/* Order Items */}
      <div style={{ marginBottom: 32 }}>
        <h2>Detalle de la orden</h2>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                padding: 16,
                borderBottom: idx < items.length - 1 ? '1px solid #eee' : 'none',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>
                  {item.meal.name}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                  {item.size.name} · x{item.qty}
                  {item.package_id && <span style={{ marginLeft: 8 }}>(Paquete)</span>}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#666' }}>
                  ${(item.unit_price / 100).toFixed(0)} MXN c/u
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
                  ${(item.subtotal / 100).toFixed(0)} MXN
                </p>
              </div>
            </div>
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
            ${(order.total_amount / 100).toFixed(0)} MXN
          </span>
        </div>
      </div>

      {/* Payment */}
      <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <p>🚧 Aquí irá el formulario de pago con Conekta</p>
      </div>
    </main>
  )
}
