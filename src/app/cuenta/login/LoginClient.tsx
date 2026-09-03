'use client'

import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/LoginForm'
import { colors } from '@/lib/theme'

export default function LoginClient() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/cuenta'

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.black,
      padding: 24,
    }}>
      <div style={{
        background: colors.grayDark,
        borderRadius: 12,
        padding: 40,
        width: '100%',
        maxWidth: 380,
      }}>
        <p style={{ color: colors.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
          Muscle Meals
        </p>
        <h1 style={{ color: colors.white, fontSize: 20, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          Mi cuenta
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
          Inicia sesión para ver tus órdenes
        </p>

        <LoginForm next={next} />
      </div>
    </main>
  )
}
