'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { colors } from '@/lib/theme'

type Mode = 'signin' | 'signup' | 'forgot'

interface LoginFormProps {
  /** URL to redirect after successful login (default: /cuenta) */
  next?: string
  /** Called after successful sign-in (for modal use) */
  onSuccess?: () => void
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

const inputStyle = {
  width: '100%',
  background: '#1a1a1a',
  border: `1px solid #444`,
  borderRadius: 8,
  padding: '11px 14px',
  color: colors.white,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

export default function LoginForm({ next = '/cuenta', onSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

  function reset() {
    setError('')
    setSuccess('')
  }

  function switchMode(m: Mode) {
    reset()
    setMode(m)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    setLoading(true)

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
        })
        if (error) throw error
        setSuccess('Te enviamos un correo para restablecer tu contraseña.')
        setLoading(false)
        return
      }

      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] },
            emailRedirectTo: callbackUrl,
          },
        })
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            setError('Ya existe una cuenta con este correo. Inicia sesión.')
          } else {
            setError(error.message)
          }
          setLoading(false)
          return
        }
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmarla. Redirigiendo a inicio de sesión…')
        setLoading(false)
        // Auto-switch to sign-in with email pre-filled after 3 s
        setTimeout(() => {
          setMode('signin')
          setSuccess('')
          setPassword('')
          setConfirmPassword('')
          setName('')
        }, 3000)
        return
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
          setError('Email o contraseña incorrectos.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      // Sign-in successful
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.href = next
      }
    } catch (err: any) {
      setError(err?.message ?? 'Ocurrió un error, intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Autofill style override — normalizes Chrome's autofill background + text color */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff !important;
          -webkit-box-shadow: 0 0 0px 1000px #1a1a1a inset !important;
          font-size: 14px !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      {/* Mode toggle */}
      {mode !== 'forgot' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1a1a1a', borderRadius: 8, padding: 4 }}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 6,
                border: 'none',
                background: mode === m ? colors.grayDark : 'transparent',
                color: mode === m ? colors.white : colors.textMuted,
                fontSize: 14,
                fontWeight: mode === m ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {m === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Name — only on signup */}
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            autoComplete="name"
          />
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
          autoComplete="email"
        />

        {mode !== 'forgot' && (
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        )}

        {mode === 'signup' && (
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
            autoComplete="new-password"
          />
        )}

        {/* Error / success */}
        {error && (
          <p style={{ margin: 0, fontSize: 13, color: '#ef4444', fontFamily: 'inherit' }}>{error}</p>
        )}
        {success && (
          <p style={{ margin: 0, fontSize: 13, color: '#10b981', fontFamily: 'inherit' }}>{success}</p>
        )}

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
          {loading ? '…' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar correo'}
        </button>
      </form>

      {/* Forgot password link */}
      {mode === 'signin' && (
        <button
          onClick={() => switchMode('forgot')}
          style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10, padding: 0 }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}
      {mode === 'forgot' && (
        <button
          onClick={() => switchMode('signin')}
          style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10, padding: 0 }}
        >
          ← Volver a iniciar sesión
        </button>
      )}

      {/* Divider */}
      {mode !== 'forgot' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#333' }} />
            <span style={{ fontSize: 12, color: colors.textMuted }}>o continuar con</span>
            <div style={{ flex: 1, height: 1, background: '#333' }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
              background: colors.white,
              color: '#1a1a1a',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <GoogleIcon />
            Google
          </button>
        </>
      )}
    </div>
  )
}
