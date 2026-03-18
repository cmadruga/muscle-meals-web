import Link from 'next/link'
import { colors } from '@/lib/theme'
import { getMainSizes } from '@/lib/db/sizes'
import { getMealsBasic } from '@/lib/db/meals'

const fmt = (centavos: number) =>
  (centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default async function Home() {
  const [sizes, meals] = await Promise.all([getMainSizes(), getMealsBasic()])

  return (
    <main style={{ 
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      {/* Hero Section */}
      <section style={{
        background: colors.black,
        padding: '80px 24px',
        textAlign: 'center',
        borderBottom: `4px solid ${colors.orange}`
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Logo placeholder - aquí iría tu imagen del logo */}
          <div style={{
            width: 120,
            height: 120,
            margin: '0 auto 24px',
            background: colors.orange,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48
          }}>
            💪
          </div>
          
          <h1 style={{ 
            fontSize: 56, 
            fontWeight: 'bold',
            marginBottom: 8,
            lineHeight: 1.1,
            letterSpacing: 2
          }}>
            <span style={{ color: colors.orange }}>MUSCLE</span> MEALS
          </h1>
          
          <p style={{ 
            fontSize: 20,
            marginBottom: 40,
            color: colors.textSecondary,
            maxWidth: 600,
            margin: '0 auto 40px'
          }}>
            Comida preparada con los macros exactos para alcanzar tus metas fitness
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#info"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 40px',
                fontSize: 18,
                fontWeight: 'bold',
                background: 'transparent',
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 1,
                border: `2px solid ${colors.white}`,
                opacity: 0.85,
              }}
            >
              ¿Cómo funciona? ↓
            </a>
            
            <Link
              href="/menu"
              style={{
                display: 'inline-block',
                padding: '18px 60px',
                fontSize: 20,
                fontWeight: 'bold',
                background: colors.orange,
                color: colors.black,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              Ordenar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section id="info" style={{
        padding: '60px 24px',
        background: colors.grayDark
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 36,
            textAlign: 'center',
            marginBottom: 48,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            <span style={{ color: colors.orange }}>Cómo</span> Funciona
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            textAlign: 'center'
          }}>
            {/* Paso 1 */}
            <div>
              <div style={{
                width: 60,
                height: 60,
                background: colors.orange,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.black
              }}>
                1
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: colors.orange }}>
                Elige tu Paquete
              </h3>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>
                Low Calorie, Fit, Protein+ o Personalizado
              </p>
            </div>
            
            {/* Paso 2 */}
            <div>
              <div style={{
                width: 60,
                height: 60,
                background: colors.orange,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.black
              }}>
                2
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: colors.orange }}>
                Selecciona Platillos
              </h3>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>
                Elige las opciones que quieras de las comidas del menú semanal
              </p>
            </div>
            
            {/* Paso 3 */}
            <div>
              <div style={{
                width: 60,
                height: 60,
                background: colors.orange,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.black
              }}>
                3
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: colors.orange }}>
                Recibe en Casa
              </h3>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>
                Domingos de 9am a 4pm
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="#paquetes" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
              background: 'transparent', color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
            }}>
              Nuestros Paquetes ↓
            </a>
          </div>
        </div>
      </section>

      {/* Paquetes Preview */}
      <section id="paquetes" style={{
        padding: '60px 24px',
        background: colors.black
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 36,
            textAlign: 'center',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            Nuestros <span style={{ color: colors.orange }}>Paquetes</span>
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: colors.textSecondary, 
            marginBottom: 48,
            fontSize: 16
          }}>
            Elige el perfil de macros que mejor se adapte a tus objetivos
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24
          }}>
            {sizes.map(size => (
              <div key={size.id} style={{
                background: colors.grayDark,
                borderRadius: 12,
                padding: 32,
                border: `2px solid ${colors.orange}`,
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: 28,
                  marginBottom: 16,
                  color: colors.orange,
                  textTransform: 'uppercase'
                }}>
                  {size.name}
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  marginBottom: 24,
                  fontSize: 14
                }}>
                  <span>{size.protein_qty}g Proteína</span>
                  <span>{size.carb_qty}g Carbs</span>
                  <span>{size.veg_qty}g Vegetal</span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: colors.textSecondary }}>Individual</span>
                  <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>
                    ${fmt(size.price)}
                  </span>
                  <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: colors.textSecondary }}>En paquete</span>
                  <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>
                    ${fmt(size.package_price)}
                  </span>
                  <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link
              href="/menu"
              style={{
                display: 'inline-block',
                padding: '16px 48px',
                fontSize: 18,
                fontWeight: 'bold',
                background: colors.orange,
                color: colors.black,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase'
              }}
            >
              Ver Menú Completo
            </Link>
            <a href="#calendario" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
              background: 'transparent', color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
            }}>
              ¿Cuándo llega? ↓
            </a>
          </div>
        </div>
      </section>

      {/* Calendario Semanal */}
      <section id="calendario" style={{
        padding: '60px 24px',
        background: colors.grayDark,
        borderTop: `4px solid ${colors.orange}`
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 40,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            Semana <span style={{ color: colors.orange }}>Muscle Meals</span>
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            marginBottom: 32
          }}>
            {/* Pedidos */}
            <div style={{
              background: colors.black,
              borderRadius: 12,
              padding: 24,
              border: `2px solid ${colors.orange}`,
              textAlign: 'center'
            }}>
              <h3 style={{ color: colors.orange, marginBottom: 12, fontSize: 18 }}>
                📝 TOMA DE PEDIDOS
              </h3>
              <p style={{ fontSize: 20, fontWeight: 'bold' }}>
                Lunes a Jueves
              </p>
            </div>
            
            {/* Entregas */}
            <div style={{
              background: colors.black,
              borderRadius: 12,
              padding: 24,
              border: `2px solid ${colors.orange}`,
              textAlign: 'center'
            }}>
              <h3 style={{ color: colors.orange, marginBottom: 12, fontSize: 18 }}>
                🚚 ENTREGAS
              </h3>
              <p style={{ fontSize: 20, fontWeight: 'bold' }}>
                Domingos 9am - 4pm
              </p>
            </div>
          </div>
          
          <p style={{
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: 14
          }}>
            Viernes y Sábado: En producción 🍳
          </p>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#menu" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
              background: 'transparent', color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
            }}>
              Ver el Menú ↓
            </a>
          </div>
        </div>
      </section>

      {/* Platillos Destacados - Placeholder */}
      <section id="menu" style={{
        padding: '60px 24px',
        background: colors.black
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            Menú de la <span style={{ color: colors.orange }}>Semana</span>
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: colors.textSecondary, 
            marginBottom: 40 
          }}>
            Platillos preparados con ingredientes frescos y macros calculados
          </p>
          
          {/* Grid de platillos - placeholder */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20
          }}>
            {meals.map(meal => (
              <div
                key={meal.id}
                style={{
                  background: colors.grayDark,
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                {meal.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meal.img}
                    alt={meal.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    height: 160,
                    background: `linear-gradient(45deg, ${colors.grayLight}, ${colors.grayDark})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textTertiary, fontSize: 14
                  }}>
                    [Foto próximamente]
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 18, marginBottom: 8, color: colors.orange }}>
                    {meal.name}
                  </h3>
                  {meal.description && (
                    <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0 }}>
                      {meal.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link
              href="/menu"
              style={{
                display: 'inline-block',
                padding: '14px 40px',
                fontSize: 16,
                fontWeight: 'bold',
                background: 'transparent',
                color: colors.orange,
                borderRadius: 8,
                textDecoration: 'none',
                border: `2px solid ${colors.orange}`,
                textTransform: 'uppercase'
              }}
            >
              Ver Todos los Platillos
            </Link>
            <a href="#envios" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
              background: 'transparent', color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
            }}>
              Costos de Envío ↓
            </a>
          </div>
        </div>
      </section>

      {/* Envíos - Placeholder para después */}
      <section id="envios" style={{
        padding: '60px 24px',
        background: colors.grayDark,
        borderTop: `4px solid ${colors.orange}`
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 40,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            Costo de <span style={{ color: colors.orange }}>Envío</span>
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24
          }}>
            <div style={{
              background: colors.black, borderRadius: 12, padding: 32,
              textAlign: 'center', border: `2px solid ${colors.grayLight}`
            }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>ENVÍO ESTÁNDAR</p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: colors.orange }}>$49</p>
              <p style={{ fontSize: 12, color: colors.textTertiary }}>MX</p>
            </div>

            <div style={{
              background: colors.black, borderRadius: 12, padding: 32,
              textAlign: 'center', border: `2px solid ${colors.orange}`
            }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>ENVÍO PRIORITARIO</p>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange, lineHeight: 1.2 }}>A cotizar</p>
              <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>Según zona y horario</p>
            </div>

            <div style={{
              background: colors.black, borderRadius: 12, padding: 32,
              textAlign: 'center', border: `2px solid ${colors.grayLight}`
            }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>RECOGER EN LOCAL</p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: colors.orange }}>Gratis</p>
              <p style={{ fontSize: 12, color: colors.textTertiary }}>Puntos de entrega disponibles</p>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            color: colors.textTertiary,
            marginTop: 24,
            fontSize: 13
          }}>
            Entregas los domingos de 9am a 4pm.
          </p>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#membership" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
              background: 'transparent', color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
            }}>
              Membership ↓
            </a>
          </div>
        </div>
      </section>

      {/* Membership Preview - Placeholder para futuro */}
      <section id="membership" style={{
        padding: '60px 24px',
        background: colors.black
      }}>
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto',
          background: colors.grayDark,
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: `3px solid ${colors.orange}`
        }}>
          <h2 style={{ 
            fontSize: 28,
            marginBottom: 24,
            textTransform: 'uppercase'
          }}>
            The <span style={{ color: colors.orange }}>Muscle Meal</span> Membership
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            flexWrap: 'wrap',
            marginBottom: 32
          }}>
            <div>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: colors.orange }}>4 Semanas</p>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>de platillos</p>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: colors.orange }}>10%</p>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>descuento</p>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: colors.orange }}>Gratis</p>
              <p style={{ fontSize: 14, color: colors.textSecondary }}>envíos</p>
            </div>
          </div>
          
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
            Próximamente disponible
          </p>

          <a href="#cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', fontSize: 15, fontWeight: 'bold',
            background: 'transparent', color: colors.white,
            borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
            letterSpacing: 1, border: `2px solid ${colors.white}`, opacity: 0.7,
          }}>
            ¡Ordenar ahora! ↓
          </a>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta" style={{
        padding: '80px 24px',
        background: colors.orange,
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: 36,
          color: colors.black,
          marginBottom: 16,
          textTransform: 'uppercase',
          letterSpacing: 2
        }}>
          ¿Listo para empezar?
        </h2>
        <p style={{
          fontSize: 18,
          color: colors.black,
          opacity: 0.8,
          marginBottom: 32
        }}>
          Ordena ahora y recibe tus comidas este domingo
        </p>
        <Link
          href="/menu"
          style={{
            display: 'inline-block',
            padding: '18px 60px',
            fontSize: 20,
            fontWeight: 'bold',
            background: colors.black,
            color: colors.white,
            borderRadius: 8,
            textDecoration: 'none',
            textTransform: 'uppercase'
          }}
        >
          Ordenar Ahora
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: colors.black,
        borderTop: `2px solid ${colors.grayLight}`,
        textAlign: 'center'
      }}>
        <p style={{ 
          fontSize: 20, 
          marginBottom: 16,
          fontWeight: 'bold'
        }}>
          <span style={{ color: colors.orange }}>MUSCLE</span> MEALS
        </p>
        
        {/* Espacio para redes sociales */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginBottom: 24
        }}>
          <span style={{ color: colors.textTertiary, fontSize: 14 }}>[Instagram]</span>
          <span style={{ color: colors.textTertiary, fontSize: 14 }}>[Facebook]</span>
          <span style={{ color: colors.textTertiary, fontSize: 14 }}>[WhatsApp]</span>
        </div>
        
        {/* Espacio para info de contacto */}
        <p style={{ color: colors.textTertiary, fontSize: 13, marginBottom: 8 }}>
          [Teléfono de contacto]
        </p>
        <p style={{ color: colors.textTertiary, fontSize: 13, marginBottom: 24 }}>
          [Email de contacto]
        </p>
        
        <p style={{ color: colors.textDisabled, fontSize: 12 }}>
          © 2026 Muscle Meals. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
