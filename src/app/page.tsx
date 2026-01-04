import { getActiveProducts } from '@/lib/db/products'

/**
 * Página principal - Lista de productos/paquetes
 * 
 * Server Component que carga datos directamente de Supabase.
 * No necesita Client Component porque no hay interactividad compleja.
 */
export default async function Home() {
  const products = await getActiveProducts()

  return (
    <main style={{ padding: 40 }}>
      <h1>Muscle Meals</h1>
      <p>Paquetes de comida preparada para tu semana fitness</p>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
        {products.map(product => (
          <li 
            key={product.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}
          >
            <h2>{product.name}</h2>
            {product.description && <p>{product.description}</p>}
            <p>
              <strong>${(product.price / 100).toFixed(2)}</strong>
              {product.meals_included && (
                <span> · {product.meals_included} comidas</span>
              )}
            </p>
            {product.meals_included && (
              <a 
                href={`/package/${product.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '8px 16px',
                  background: '#333',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 4
                }}
              >
                Armar paquete
              </a>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
