'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { colors } from '@/lib/theme'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(() => { window.location.href = '/cuenta' }, 2000)
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: 8,
    padding: '11px 14px',
    color: colors.white,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  }

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
          Nueva contraseña
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
          Elige una contraseña nueva para tu cuenta.
        </p>

        {success ? (
          <p style={{ color: '#10b981', fontSize: 14, textAlign: 'center' }}>
            ✓ Contraseña actualizada. Redirigiendo…
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={inputStyle}
              autoComplete="new-password"
            />
            {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 8,
                border: 'none',
                background: colors.orange,
                color: '#111',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit',
                marginTop: 2,
              }}
            >
              {loading ? '…' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
