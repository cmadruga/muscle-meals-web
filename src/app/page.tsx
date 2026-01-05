import Link from 'next/link'
import { getActivePackages } from '@/lib/db/packages'
import { getActiveMeals } from '@/lib/db/meals'
import { getMainSizes } from '@/lib/db/sizes'

/**
 * Página principal - Lista de paquetes y meals disponibles
 */
export default async function Home() {
  const [packages, meals, sizes] = await Promise.all([
    getActivePackages(),
    getActiveMeals(),
    getMainSizes()
  ])

  // Precio más bajo para mostrar "desde $X"
  const lowestPrice = sizes.length > 0 ? Math.min(...sizes.map(s => s.price)) : 0
  const lowestPackagePrice = sizes.length > 0 ? Math.min(...sizes.map(s => s.package_price)) : 0

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Muscle Meals</h1>
      <p>Comida preparada para tu semana fitness</p>

      {/* PAQUETES */}
      <section style={{ marginTop: 40 }}>
        <h2>📦 Paquetes</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Arma tu paquete semanal y ahorra
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {packages.map(pkg => (
            <Link 
              key={pkg.id}
              href={`/package/${pkg.id}`}
              style={{
                display: 'block',
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 16,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s'
              }}
            >
              {pkg.img && (
                <img 
                  src={pkg.img} 
                  alt={pkg.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                />
              )}
              <h3 style={{ margin: '8px 0' }}>{pkg.name}</h3>
              {pkg.description && <p style={{ color: '#666', fontSize: 14 }}>{pkg.description}</p>}
              <p style={{ marginTop: 8 }}>
                <strong>Desde ${((lowestPackagePrice * pkg.meals_included) / 100).toFixed(0)} MXN</strong>
                <span style={{ color: '#666' }}> · {pkg.meals_included} comidas</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* MEALS INDIVIDUALES */}
      <section style={{ marginTop: 48 }}>
        <h2>🍽️ Comidas Individuales</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Ordena platillos sueltos
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {meals.map(meal => (
            <Link 
              key={meal.id}
              href={`/meal/${meal.id}`}
              style={{
                display: 'block',
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 16,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s'
              }}
            >
              {meal.img && (
                <img 
                  src={meal.img} 
                  alt={meal.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                />
              )}
              <h3 style={{ margin: '8px 0' }}>{meal.name}</h3>
              {meal.description && <p style={{ color: '#666', fontSize: 14 }}>{meal.description}</p>}
              <p style={{ marginTop: 8 }}>
                <strong>Desde ${(lowestPrice / 100).toFixed(0)} MXN</strong>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
