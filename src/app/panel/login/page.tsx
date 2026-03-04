'use client'

import { useState } from 'react'
import { adminLogin } from '@/app/actions/admin-auth'
import { colors } from '@/lib/theme'

export default function AdminLoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await adminLogin(token)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.black,
      padding: 24
    }}>
      <div style={{
        background: colors.grayDark,
        borderRadius: 12,
        padding: 40,
        width: '100%',
        maxWidth: 360
      }}>
        <h1 style={{ color: colors.orange, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Muscle Meals
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
          Panel administrador
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Token de acceso"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="current-password"
            style={{
              width: '100%',
              background: colors.grayLight,
              border: `1px solid #444`,
              borderRadius: 8,
              padding: '12px 16px',
              color: colors.white,
              fontSize: 16,
              marginBottom: 16,
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />

          {error && (
            <p style={{ color: colors.error, fontSize: 14, marginBottom: 16 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: '100%',
              background: colors.orange,
              color: colors.black,
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading || !token ? 'not-allowed' : 'pointer',
              opacity: loading || !token ? 0.6 : 1
            }}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
