import Link from 'next/link'

export default function OrderFailedPage() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#ef4444',
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
          color: '#1f2937'
        }}>
          Pago no completado
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: '#6b7280',
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Hubo un problema al procesar tu pago. No se realizó ningún cargo a tu tarjeta.
        </p>

        <div style={{
          padding: 16,
          background: '#fef2f2',
          borderRadius: 8,
          marginBottom: 32,
          border: '1px solid #fecaca'
        }}>
          <p style={{ 
            fontSize: 14, 
            color: '#991b1b',
            margin: '0 0 8px 0',
            fontWeight: 'bold'
          }}>
            Posibles causas:
          </p>
          <ul style={{
            fontSize: 14,
            color: '#7f1d1d',
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
              padding: '12px 24px',
              background: '#333',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16
            }}
          >
            Intentar de nuevo
          </Link>

          <Link
            href="/"
            style={{
              display: 'block',
              padding: '12px 24px',
              background: 'transparent',
              color: '#ef4444',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 16,
              border: '2px solid #ef4444'
            }}
          >
            Volver al inicio
          </Link>
        </div>

        <p style={{
          marginTop: 32,
          fontSize: 14,
          color: '#9ca3af'
        }}>
          Si el problema persiste, contacta con tu banco o intenta con otro método de pago.
        </p>
      </div>
    </main>
  )
}
