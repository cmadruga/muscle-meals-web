import Link from 'next/link'
import Image from 'next/image'
import { colors } from '@/lib/theme'
import { getMealsBasic } from '@/lib/db/meals'

export default async function Home() {
  const meals = await getMealsBasic()

  return (
    <main style={{ 
      minHeight: '100vh',
      background: colors.black,
      color: colors.white
    }}>
      {/* Hero Section */}
      <section style={{
        backgroundImage: 'url(/media/Fondo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '100px 24px 80px',
        textAlign: 'center',
        borderBottom: `10px solid ${colors.orange}`
      }}>
        <style>{`
          .hero-logo-full { display: block; }
          .hero-logo-short { display: none; }
          @media (max-width: 640px) {
            .hero-logo-full { display: none; }
            .hero-logo-short { display: block; }
          }
        `}</style>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Image
            src="/media/MuscleMeals_Logo_Horizontal_HomeColorBlanco.png"
            alt="Muscle Meals"
            width={720}
            height={160}
            className="hero-logo-full"
            style={{ margin: '0 auto 24px', objectFit: 'contain', width: '100%', maxWidth: 720, height: 'auto' }}
            priority
          />
          <Image
            src="/media/MuscleMeals_Logo_HomeColorBlanco.png"
            alt="Muscle Meals"
            width={300}
            height={300}
            className="hero-logo-short"
            style={{ margin: '0 auto 24px', objectFit: 'contain' }}
            priority
          />

          <Image
            src="/media/ComidaPreparada_Frase.png"
            alt="¡Comida preparada con los macros exactos para alcanzar tus metas fitness!"
            width={700}
            height={120}
            style={{ margin: '0 auto 40px', objectFit: 'contain', width: '100%', maxWidth: 700, height: 'auto' }}
          />

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* <a
              href="#info"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 44px',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 32,
                lineHeight: 1,
                background: colors.black,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0,
                border: `3px solid ${colors.white}`,
              }}
            >
              ¿Como Funciona?
            </a> */}

            <Link
              href="/menu"
              className="franchise-stroke"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 44px',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 32,
                lineHeight: 1,
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              Ordena Ahora
            </Link>
            <a
              href="#footer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 44px',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 32,
                lineHeight: 1,
                background: colors.black,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0,
                border: `3px solid ${colors.white}`,
              }}
            >
              Contacto ↓
            </a>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      {/* <section id="info" style={{
        padding: '60px 24px',
        background: colors.grayDark
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Image
            src="/media/Título_CómoFunciona.png"
            alt="¿Cómo Funciona?"
            width={600}
            height={100}
            style={{ display: 'block', margin: '0 auto 48px', width: '100%', maxWidth: 500, height: 'auto' }}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 32,
            textAlign: 'center'
          }}>
            {[
              { img: '/media/PrimerPaso.png',   alt: 'Primer Paso: Elige tu paquete' },
              { img: '/media/SegundoPaso.png',  alt: 'Segundo Paso: Selecciona platillos' },
              { img: '/media/TercerPaso.png',   alt: 'Tercer Paso: Recibe en casa' },
            ].map(step => (
              <div key={step.img}>
                <Image
                  src={step.img}
                  alt={step.alt}
                  width={300}
                  height={320}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="#paquetes" className="franchise-stroke" style={{
              display: 'inline-block',
              padding: '10px 44px',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 28,
              lineHeight: 1,
              background: colors.orange,
              color: colors.white,
              borderRadius: 8,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}>
              Nuestros Paquetes
            </a>
          </div>
        </div>
      </section> */}

      {/* Paquetes Preview */}
      {/* <section id="paquetes" style={{
        padding: '60px 24px',
        background: colors.black
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Image
            src="/media/Título_NuestrosPaquetes.png"
            alt="Nuestros Paquetes"
            width={600}
            height={100}
            style={{ display: 'block', margin: '0 auto 48px', width: '100%', maxWidth: 500, height: 'auto' }}
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20
          }}>
            {[
              { src: '/media/Low Calorie.png', alt: 'Paquete Low Calorie' },
              { src: '/media/Fit.png', alt: 'Paquete Fit' },
              { src: '/media/Protein.png', alt: 'Paquete Protein+' },
              { src: '/media/Personalización.png', alt: 'Paquete Personalización' },
            ].map(pkg => (
              <Image
                key={pkg.src}
                src={pkg.src}
                alt={pkg.alt}
                width={400}
                height={400}
                style={{ width: '100%', height: 'auto', borderRadius: 12 }}
              />
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <a
              href="#menu"
              className="franchise-stroke"
              style={{
                display: 'inline-block',
                padding: '10px 44px',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 28,
                lineHeight: 1,
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              Ver Menú Completo
            </a>
            <a href="#calendario" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '10px 44px',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 28, lineHeight: 1,
              background: colors.black, color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 0, border: `3px solid ${colors.white}`,
            }}>
              ¿Cuándo llega?
            </a>
          </div>
        </div>
      </section> */}

      {/* <section id="calendario" style={{
        padding: '60px 24px',
        background: colors.grayDark,
        borderTop: `4px solid ${colors.orange}`
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Image
            src="/media/Intinerario Semanal.png"
            alt="Itinerario Semanal Muscle Meals"
            width={800} height={600}
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
          />
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#menu" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '10px 44px',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 28, lineHeight: 1,
              background: colors.black, color: colors.white,
              borderRadius: 8, textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: 0, border: `3px solid ${colors.white}`,
            }}>
              Ver el Menú
            </a>
          </div>
        </div>
      </section> */}

      {/* Costo de Envío — comentado, descomentar si se quiere mostrar
      <section id="envios" style={{
        padding: '60px 24px',
        background: colors.grayDark,
        borderTop: `4px solid ${colors.orange}`
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32, textAlign: 'center', marginBottom: 40,
            textTransform: 'uppercase', letterSpacing: 2
          }}>
            Costo de <span style={{ color: colors.orange }}>Envío</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <Image src="/media/Costo de Envio.png" alt="Costo de Envío" width={600} height={600}
              style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
            <Image src="/media/Horario de Entregas.png" alt="Horario de Entregas" width={600} height={600}
              style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
          </div>
        </div>
      </section>
      */}

      {/* Platillos Destacados - Placeholder */}
      {/* <section id="menu" style={{
        padding: '60px 24px',
        background: colors.black
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Image
            src="/media/Título_Menu.png"
            alt="Menú de la Semana"
            width={600}
            height={100}
            style={{ display: 'block', margin: '0 auto 40px', width: '100%', maxWidth: 500, height: 'auto' }}
          />
          
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
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link
              href="/menu"
              className="franchise-stroke"
              style={{
                display: 'inline-block',
                padding: '10px 44px',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 28,
                lineHeight: 1,
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              Ver Todos los Platillos
            </Link>
          </div>
        </div>
      </section> */}


      {/* Membership Preview - Placeholder para futuro */}
      {/* <section id="membership" style={{
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
      </section> */}

      {/* CTA Final */}
      {/* <section id="cta" style={{
        backgroundImage: 'url(/media/Fondo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <Image
          src="/media/Titulo_Listo.png"
          alt="¿Listo para empezar?"
          width={700}
          height={160}
          style={{ display: 'block', margin: '0 auto 40px', width: '100%', maxWidth: 600, height: 'auto' }}
        />
        <Link
          href="/menu"
          className="franchise-stroke"
          style={{
            display: 'inline-block',
            padding: '10px 60px',
            fontFamily: 'Franchise, sans-serif',
            fontSize: 32,
            lineHeight: 1,
            background: colors.orange,
            color: colors.white,
            borderRadius: 8,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: 0,
          }}
        >
          Ordena Ahora
        </Link>
      </section> */}

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: colors.black,
        borderTop: `2px solid ${colors.grayLight}`,
        textAlign: 'center'
      }}>
        <section id="footer">
          <Image
            src="/media/MuscleMeals_Logo_Horizontal_HomeColorBlanco.png"
            alt="Muscle Meals"
            width={280}
            height={64}
            style={{ margin: '0 auto 24px', objectFit: 'contain', width: '100%', maxWidth: 280, height: 'auto' }}
          />

          {/* Redes sociales */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <a href="https://www.instagram.com/musclemeals.mx" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textMuted, textDecoration: 'none',
                background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 16px',
                fontFamily: 'Franchise, sans-serif', fontSize: 18, letterSpacing: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.orange}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              Facebook
            </a>
            <a href="https://wa.me/8136069805" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textMuted, textDecoration: 'none',
                background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 16px',
                fontFamily: 'Franchise, sans-serif', fontSize: 18, letterSpacing: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.orange}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L.057 23.57a.75.75 0 0 0 .93.909l5.878-1.557A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.1-1.404l-.36-.215-3.733.988.997-3.645-.235-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          <p style={{ color: colors.textDisabled, fontFamily: 'Franchise, sans-serif', fontSize: 16, letterSpacing: 0 }}>
            © 2026 Muscle Meals. Todos los derechos reservados.
          </p>
        </section>
      </footer>
    </main>
  )
}
