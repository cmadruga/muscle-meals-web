export default async function CheckoutPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Cargar orden de Supabase y mostrar resumen
  // TODO: Integrar Conekta para pagos

  return (
    <main style={{ padding: 40 }}>
      <h1>Checkout</h1>
      <p>Orden: <code>{id}</code></p>
      
      <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <p>🚧 Aquí irá el formulario de pago con Conekta</p>
      </div>
    </main>
  )
}
