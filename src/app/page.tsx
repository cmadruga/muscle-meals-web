import Link from 'next/link'
import { colors } from '@/lib/theme'

export default function Home() {
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
      </section>

      {/* Cómo Funciona */}
      <section style={{
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
                5 o 10 comidas del menú semanal
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
        </div>
      </section>

      {/* Paquetes Preview */}
      <section style={{
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
            {/* Low Calorie */}
            <div style={{
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
                Low Calorie
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 16, 
                marginBottom: 24,
                fontSize: 14
              }}>
                <span>160g Proteína</span>
                <span>45g Carbs</span>
                <span>80g Vegetal</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>5 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$700</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>10 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$1,400</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted }}>
                +$145 MX platillo adicional
              </p>
            </div>

            {/* Fit */}
            <div style={{
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
                Fit
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 16, 
                marginBottom: 24,
                fontSize: 14
              }}>
                <span>180g Proteína</span>
                <span>55g Carbs</span>
                <span>70g Vegetal</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>5 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$750</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>10 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$1,550</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted }}>
                +$155 MX platillo adicional
              </p>
            </div>

            {/* Protein+ */}
            <div style={{
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
                Protein+
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 16, 
                marginBottom: 24,
                fontSize: 14
              }}>
                <span>220g Proteína</span>
                <span>70g Carbs</span>
                <span>70g Vegetal</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>5 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$800</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>10 platillos</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 12 }}>$1,600</span>
                <span style={{ fontSize: 14, color: colors.textSecondary }}> MX</span>
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted }}>
                +$165 MX platillo adicional
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
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
          </div>
        </div>
      </section>

      {/* Calendario Semanal */}
      <section style={{
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
        </div>
      </section>

      {/* Platillos Destacados - Placeholder */}
      <section style={{
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
            {['Pollo Ajo Parmesano', 'Pasta Boloñesa', 'Pollo Miel y Limón', 'Pollo a la Mostaza'].map((meal, i) => (
              <div 
                key={i}
                style={{
                  background: colors.grayDark,
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                {/* Imagen placeholder */}
                <div style={{
                  height: 160,
                  background: `linear-gradient(45deg, ${colors.grayLight}, ${colors.grayDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textTertiary,
                  fontSize: 14
                }}>
                  [Imagen del platillo]
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ 
                    fontSize: 18, 
                    marginBottom: 8,
                    color: colors.orange
                  }}>
                    {meal}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    fontSize: 12, 
                    color: colors.textSecondary 
                  }}>
                    <span>~500 cal</span>
                    <span>~50g prot</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
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
          </div>
        </div>
      </section>

      {/* Envíos - Placeholder para después */}
      <section style={{
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
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24
          }}>
            <div style={{
              background: colors.black,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              border: `2px solid ${colors.grayLight}`
            }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                ENVÍO ESTÁNDAR
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: colors.orange }}>
                $49
              </p>
              <p style={{ fontSize: 12, color: colors.textTertiary }}>MX</p>
            </div>
            
            <div style={{
              background: colors.black,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              border: `2px solid ${colors.orange}`
            }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                ENVÍO PRIORITARIO
              </p>
              <p style={{ fontSize: 40, fontWeight: 'bold', color: colors.orange }}>
                $60
              </p>
              <p style={{ fontSize: 12, color: colors.textTertiary }}>MX</p>
            </div>
          </div>
          
          <p style={{ 
            textAlign: 'center', 
            color: colors.textTertiary, 
            marginTop: 24,
            fontSize: 13
          }}>
            Costo adicional para entregas fuera de horario. Envíos fuera de zona: a cotizar.
          </p>
        </div>
      </section>

      {/* Membership Preview - Placeholder para futuro */}
      <section style={{
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
          
          <p style={{ color: colors.textMuted, fontSize: 14 }}>
            Próximamente disponible
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
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
