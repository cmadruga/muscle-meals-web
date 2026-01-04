import { supabase } from '@/lib/supabaseClient'

export default async function Home() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)

  if (error) {
    return <p>Error cargando productos</p>
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Muscle Meals</h1>

      <ul>
        {products?.map(product => (
          <li key={product.id}>
            <strong>{product.name}</strong><br />
            {product.description}<br />
            ${product.price / 100}
          </li>
        ))}
      </ul>
    </main>
  )
}