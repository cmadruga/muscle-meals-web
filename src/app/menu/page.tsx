import Link from 'next/link'
import Image from 'next/image'
import { getActiveMeals } from '@/lib/db/meals'
import { getMainSizes } from '@/lib/db/sizes'
import { colors } from '@/lib/theme'

/**
 * Página de menú - Lista de paquetes y meals disponibles
 */
export default async function MenuPage() {
  const [meals, sizes] = await Promise.all([
    getActiveMeals(),
    getMainSizes()
  ])

  // Precio más bajo para mostrar "desde $X"
  const lowestPrice = sizes.length > 0 ? Math.min(...sizes.map(s => s.price)) : 0
  const lowestPackagePrice = sizes.length > 0 ? Math.min(...sizes.map(s => s.package_price)) : 0

  return (
    <main style={{
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      <style>{`
        .pkg-card { flex-direction: row; align-items: center; }
        .pkg-img { width: 220px; height: 140px; flex-shrink: 0; border-radius: 10px; overflow: hidden; }
        .pkg-img img { width: 100%; height: 100%; object-fit: cover; }
        @media (max-width: 640px) {
          .pkg-card { flex-direction: column; align-items: stretch; gap: 16px; padding: 20px !important; }
          .pkg-card-btn { text-align: center; }
          .pkg-img { width: 100%; height: 180px; }
        }
      `}</style>
      {/* Header */}
      <section style={{
        padding: '40px 24px 60px',
        textAlign: 'center',
        borderBottom: `4px solid ${colors.orange}`
      }}>
        <h1 style={{ 
          fontSize: 42,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 3
        }}>
          <span style={{ color: colors.orange }}>Menú</span> de la Semana
        </h1>
        <p style={{ fontSize: 18, color: colors.textSecondary, maxWidth: 600, margin: '0 auto' }}>
          Elige entre nuestros paquetes o selecciona comidas individuales
        </p>
      </section>

      {/* PAQUETES */}
      <section style={{ 
        padding: '60px 24px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 12,
          borderLeft: `5px solid ${colors.orange}`,
          paddingLeft: 20
        }}>
          <h2 style={{
            fontSize: 38,
            textTransform: 'uppercase',
            letterSpacing: 3,
            margin: 0,
            lineHeight: 1
          }}>
            <span style={{ color: colors.orange }}>Nuestros</span> Paquetes
          </h2>
        </div>
        <p style={{ color: colors.textMuted, marginBottom: 32, fontSize: 16 }}>
          Arma tu paquete semanal y ahorra · Desde ${(lowestPackagePrice / 100).toFixed(0)} MXN por comida
        </p>
        
        <Link
          href="/package/default"
          className="pkg-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            width: '100%',
            background: colors.grayDark,
            border: `2px solid ${colors.orange}`,
            borderRadius: 16,
            padding: '28px 32px',
            textDecoration: 'none',
            color: 'inherit',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="pkg-img">
              <Image
                src="/paquete.png"
                alt="Paquete Muscle Meals"
                width={220}
                height={140}
              />
            </div>

            <div>
              <h3 style={{
                fontSize: 26,
                color: colors.orange,
                margin: '0 0 6px 0',
                textTransform: 'uppercase',
                letterSpacing: 2,
                lineHeight: 1
              }}>
                Crea tu paquete
              </h3>
              <p style={{ color: colors.textSecondary, fontSize: 15, margin: '0 0 4px 0' }}>
                Mínimo 5 platillos · <strong style={{ color: colors.white }}>${(lowestPackagePrice / 100).toFixed(0)} MXN</strong> por platillo
              </p>
              <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
                Agrega los que quieras — precio paquete en todos
              </p>
            </div>
          </div>
          <span
            className="pkg-card-btn"
            style={{
              flexShrink: 0,
              padding: '12px 24px',
              background: colors.orange,
              color: colors.black,
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Armar mi paquete
          </span>
        </Link>
      </section>

      {/* Separator */}
      <div style={{
        height: 4,
        background: colors.orange,
        maxWidth: 200,
        margin: '0 auto'
      }} />

      {/* MEALS INDIVIDUALES */}
      <section style={{ 
        padding: '60px 24px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 12,
          borderLeft: `5px solid ${colors.orange}`,
          paddingLeft: 20
        }}>
          <h2 style={{
            fontSize: 38,
            textTransform: 'uppercase',
            letterSpacing: 3,
            margin: 0,
            lineHeight: 1
          }}>
            <span style={{ color: colors.orange }}>Comidas</span> Individuales
          </h2>
        </div>
        <p style={{ color: colors.textMuted, marginBottom: 32, fontSize: 16 }}>
          Selecciona tus comidas favoritas · Desde ${(lowestPrice / 100).toFixed(0)} MXN
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 24 
        }}>
          {meals.map(meal => (
            <Link 
              key={meal.id}
              href={`/meal/${meal.id}`}
              style={{
                display: 'block',
                background: colors.grayDark,
                border: `2px solid ${colors.grayLight}`,
                borderRadius: 16,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.2s'
              }}
            >
              {meal.img ? (
                <Image 
                  src={meal.img} 
                  alt={meal.name}
                  width={280}
                  height={180}
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  height: 180,
                  background: `linear-gradient(135deg, ${colors.grayLight}, ${colors.grayDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48
                }}>
                  🍽️
                </div>
              )}
              <div style={{ padding: 20 }}>
                <h3 style={{ 
                  fontSize: 20, 
                  color: colors.orange,
                  marginBottom: 8
                }}>
                  {meal.name}
                </h3>
                {meal.description && (
                  <p style={{ 
                    color: colors.textMuted, 
                    fontSize: 14, 
                    marginBottom: 12,
                    lineHeight: 1.4
                  }}>
                    {meal.description}
                  </p>
                )}
                
                <div style={{
                  padding: '8px 12px',
                  background: colors.black,
                  borderRadius: 6,
                  fontSize: 12,
                  color: colors.textTertiary,
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Macros calculados según tamaño
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    color: colors.white 
                  }}>
                    Desde ${(lowestPrice / 100).toFixed(0)} MXN
                  </span>
                  <span style={{
                    padding: '6px 12px',
                    background: colors.orange,
                    color: colors.black,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    Ver →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {meals.length === 0 && (
          <div style={{
            padding: 40,
            textAlign: 'center',
            background: colors.grayDark,
            borderRadius: 12,
            color: colors.textTertiary
          }}>
            No hay comidas disponibles en este momento
          </div>
        )}
      </section>

      {/* Footer Mini */}
      <footer style={{
        padding: '40px 24px',
        background: colors.grayDark,
        borderTop: `2px solid ${colors.grayLight}`,
        textAlign: 'center'
      }}>
        <p style={{ color: colors.textTertiary, fontSize: 14 }}>
          ¿Dudas? Contáctanos por WhatsApp
        </p>
      </footer>
    </main>
  )
}
