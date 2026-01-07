import Link from 'next/link'
import { colors } from '@/lib/theme'

export default function OrderFailedPage() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: colors.black
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: colors.grayDark,
        border: `2px solid ${colors.grayLight}`,
        borderRadius: 16,
        padding: 48,
        textAlign: 'center'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: colors.error,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 48,
          color: 'white'
        }}>
          ✕
        </div>

        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 16,
          color: colors.error,
          textTransform: 'uppercase'
        }}>
          Pago no completado
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: colors.textMuted,
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Hubo un problema al procesar tu pago. No se realizó ningún cargo a tu tarjeta.
        </p>

        <div style={{
          padding: 16,
          background: colors.grayLight,
          borderRadius: 8,
          marginBottom: 32,
          border: `1px solid ${colors.error}`
        }}>
          <p style={{ 
            fontSize: 14, 
            color: colors.error,
            margin: '0 0 8px 0',
            fontWeight: 'bold'
          }}>
            Posibles causas:
          </p>
          <ul style={{
            fontSize: 14,
            color: colors.textMuted,
            margin: 0,
            padding: '0 0 0 20px',
            textAlign: 'left'
          }}>
            <li>Fondos insuficientes</li>
            <li>Tarjeta rechazada</li>
            <li>Datos incorrectos</li>
            <li>Transacción cancelada</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          flexDirection: 'column'
        }}>
          <Link
            href="/cart"
            style={{
              display: 'block',
              padding: '14px 24px',
              background: colors.orange,
              color: colors.black,
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              textTransform: 'uppercase'
            }}
          >
            Intentar de nuevo
          </Link>

          <Link
            href="/"
            style={{
              display: 'block',
              padding: '14px 24px',
              background: 'transparent',
              color: colors.orange,
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              border: `2px solid ${colors.orange}`
            }}
          >
            Volver al inicio
          </Link>
        </div>

        <p style={{
          marginTop: 32,
          fontSize: 14,
          color: colors.textTertiary
        }}>
          Si el problema persiste, contacta con tu banco o intenta con otro método de pago.
        </p>
      </div>
    </main>
  )
}
