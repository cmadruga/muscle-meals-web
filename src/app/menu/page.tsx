import Link from 'next/link'
import Image from 'next/image'
import { getActiveMeals } from '@/lib/db/meals'
import { getMainSizes } from '@/lib/db/sizes'
import { getSalesEnabled } from '@/lib/db/settings'
import { colors } from '@/lib/theme'

/**
 * Página de menú - Lista de paquetes y meals disponibles
 */
export default async function MenuPage() {
  const [meals, sizes, salesEnabled] = await Promise.all([
    getActiveMeals(),
    getMainSizes(),
    getSalesEnabled(),
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
        <Image
          src="/media/Título_Menu.png"
          alt="Menú de la Semana"
          width={600}
          height={100}
          style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: 500, height: 'auto' }}
        />
        <p style={{ fontSize: 18, color: colors.textSecondary, maxWidth: 600, margin: '0 auto' }}>
          Elige entre nuestros platillos de la semana y crea tu paquete personalizado.
        </p>
      </section>

      {/* Banner ventas cerradas */}
      {!salesEnabled && (
        <div style={{
          background: '#ef444422',
          border: `2px solid #ef4444`,
          borderRadius: 12,
          padding: '18px 28px',
          margin: '32px 24px 0',
          maxWidth: 1200,
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🚫</span>
          <div>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, margin: 0 }}>
              Ventas temporalmente cerradas
            </p>
            <p style={{ color: '#ef444499', fontSize: 14, margin: '4px 0 0' }}>
              Por el momento no estamos recibiendo pedidos. ¡Vuelve pronto!
            </p>
          </div>
        </div>
      )}

      {/* PAQUETES */}
      <section style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
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
        
        <style>{`
          .pkg-card { display: flex; align-items: center; justify-content: space-between; gap: 24; }
          .pkg-card-btn { display: inline-block; }
          @media (max-width: 640px) {
            .pkg-card { flex-direction: column; align-items: stretch; padding: 20px !important; }
            .pkg-inner { flex-direction: column; align-items: center; text-align: center; }
            .pkg-card-btn { display: block; text-align: center; margin-top: 16px; }
          }
        `}</style>
        <Link
          href="/package"
          className="pkg-card"
          style={{
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
          <div className="pkg-inner" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="pkg-img">
              <Image
                src="/media/paquete.png"
                alt="Paquete Muscle Meals"
                width={220}
                height={140}
              />
            </div>

            <div>
              <h3 style={{
                fontSize: 26,
                color: colors.orange,
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: 2,
                lineHeight: 1
              }}>
                Crea tu paquete
              </h3>
              {lowestPrice > lowestPackagePrice && (
                <span style={{
                  display: 'inline-block',
                  background: colors.orange,
                  color: colors.white,
                  fontSize: 20,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 20,
                  marginBottom: 8,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  Y Ahorra ${((lowestPrice - lowestPackagePrice) / 100).toFixed(0)} por platillo.
                </span>
              )}
              <p style={{ color: colors.textSecondary, fontSize: 18, margin: '0 0 4px 0' }}>
                Mínimo 5 platillos ·{' '}
                <strong style={{ color: colors.white }}>${(lowestPackagePrice / 100).toFixed(0)} MXN</strong>
                {' '}<span style={{ color: colors.textMuted, textDecoration: 'line-through', fontSize: 13 }}>${(lowestPrice / 100).toFixed(0)}</span>
                {' '}por platillo
              </p>
              <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
                Combina los platillos que quieras — precio de paquete en todos
              </p>
            </div>
          </div>
          <span
            className="pkg-card-btn franchise-stroke"
            style={{
              flexShrink: 0,
              padding: '12px 24px',
              background: colors.orange,
              color: colors.white,
              borderRadius: 8,
              fontFamily: 'Franchise, sans-serif',
              fontSize: 20,
              letterSpacing: 0,
              lineHeight: 1,
              textTransform: 'uppercase',
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
                  height={276}
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                />
              ) : (
                <div style={{
                  height: 276,
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
                  <span className="franchise-stroke" style={{
                    padding: '6px 12px',
                    background: colors.orange,
                    color: colors.white,
                    borderRadius: 6,
                    fontFamily: 'Franchise, sans-serif',
                    fontSize: 15,
                    letterSpacing: 0,
                    lineHeight: 1,
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
        background: colors.black,
        borderTop: `2px solid ${colors.grayLight}`,
        textAlign: 'center'
      }}>
        <p style={{ color: colors.white, fontFamily: 'Franchise, sans-serif', fontSize: 22, letterSpacing: 0, marginBottom: 24 }}>
          ¿Dudas? Contáctanos por WhatsApp
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
          <a href="https://www.instagram.com/musclemeals.mx" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textMuted, textDecoration: 'none',
              background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 16px',
              fontFamily: 'Franchise, sans-serif', fontSize: 18, letterSpacing: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE9739" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            Instagram
          </a>
          <a href="https://www.facebook.com/profile.php?id=61552292761945" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textMuted, textDecoration: 'none',
              background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 16px',
              fontFamily: 'Franchise, sans-serif', fontSize: 18, letterSpacing: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FE9739">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            Facebook
          </a>
          <a href="https://wa.me/8136069805" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textMuted, textDecoration: 'none',
              background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 16px',
              fontFamily: 'Franchise, sans-serif', fontSize: 18, letterSpacing: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FE9739">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L.057 23.57a.75.75 0 0 0 .93.909l5.878-1.557A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.1-1.404l-.36-.215-3.733.988.997-3.645-.235-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp
          </a>
        </div>

        <p style={{ color: colors.textDisabled, fontFamily: 'Franchise, sans-serif', fontSize: 16, letterSpacing: 0 }}>
          © 2026 Muscle Meals. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
