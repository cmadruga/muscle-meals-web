'use client'

import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default function LoginClient() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/cuenta'

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f0d0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 860 }}>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
