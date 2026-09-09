'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'

interface LoginFormProps {
  /** URL to redirect after successful login (default: /cuenta) */
  next?: string
  /** Called after successful sign-in (for modal use) */
  onSuccess?: () => void
  /** Called when the × close button is clicked */
  onClose?: () => void
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function passwordStrength(pw: string): { score: number; label: string } {
  if (pw.length < 6) return { score: 0, label: '' }
  if (pw.length < 8) return { score: 1, label: 'Débil' }
  const hasNum = /[0-9]/.test(pw)
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw)
  if (pw.length >= 10 && hasNum) return { score: 3, label: 'Fuerte' }
  if (hasNum || hasSpecial) return { score: 2, label: 'Media' }
  return { score: 1, label: 'Débil' }
}

// Design tokens from Auth Redesign
const C = {
  card:      '#191614',
  left:      '#120f0e',
  orange:    '#F79138',
  text:      '#F5F1EC',
  muted:     'rgba(245,241,236,.6)',
  subtle:    'rgba(245,241,236,.45)',
  faint:     'rgba(245,241,236,.42)',
  border:    'rgba(255,255,255,.12)',
  borderSoft:'rgba(255,255,255,.1)',
  inputBg:   'rgba(255,255,255,.04)',
  error:     '#ef4444',
  success:   '#7ac77a',
}

const FONTS = {
  display:   `'Big Shoulders Display', 'Barlow Condensed', sans-serif`,
  body:      `'Barlow Condensed', system-ui, sans-serif`,
  label:     `'Barlow Condensed', system-ui, sans-serif`,
}

export default function LoginForm({ next = '/cuenta', onSuccess, onClose }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

  function reset() { setError(''); setSuccess('') }
  function switchMode(m: Mode) { reset(); setMode(m) }

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
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); setLoading(false); return }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] },
            emailRedirectTo: callbackUrl,
          },
        })
        if (error) {
          setError(
            error.message.includes('already registered') || error.message.includes('already been registered')
              ? 'Ya existe una cuenta con este correo. Inicia sesión.'
              : error.message
          )
          setLoading(false)
          return
        }
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmarla. Redirigiendo…')
        setLoading(false)
        setTimeout(() => { setMode('signin'); setSuccess(''); setPassword(''); setConfirmPassword(''); setName('') }, 3000)
        return
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message.includes('Invalid login') || error.message.includes('invalid_credentials')
            ? 'Email o contraseña incorrectos.'
            : error.message.includes('Email not confirmed')
              ? 'Confirma tu correo antes de iniciar sesión.'
              : error.message
        )
        setLoading(false)
        return
      }
      if (onSuccess) onSuccess()
      else window.location.href = next
    } catch (err: any) {
      setError(err?.message ?? 'Ocurrió un error, intenta de nuevo.')
      setLoading(false)
    }
  }

  const pwStrength = mode === 'signup' && password ? passwordStrength(password) : null
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'

  const leftContent = isSignup
    ? { lines: ['Arma tu', 'cuenta'], benefits: ['Repite tu última orden en un toque', 'Guarda direcciones y macros', 'Sigue tu entrega en vivo'] }
    : { lines: ['Bienvenido', 'de vuelta'], benefits: ['Repite tu última orden en un toque', 'Guarda direcciones y macros', 'Sigue tu entrega en vivo'] }

  return (
    <>
      {/* Scoped styles — fonts ya cargadas globalmente via next/font */}
      <style>{`
        .mm-login { display: grid; grid-template-columns: 300px 1fr; background: ${C.card}; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); }
        .mm-left  { display: flex; }
        @media (max-width: 600px) {
          .mm-login { grid-template-columns: 1fr; }
          .mm-left  { display: none; }
        }
        .mm-label { position: absolute; top: 10px; left: 14px; font: 600 10px/1 'Barlow', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: ${C.faint}; pointer-events: none; transition: color .15s; }
        .mm-label-orange { color: rgba(247,145,56,.85); }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
          -webkit-text-fill-color: ${C.text} !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,.05) inset !important;
          transition: background-color 9999s;
        }
      `}</style>

      <div className="mm-login">

        {/* ── LEFT PANEL ── */}
        <div className="mm-left" style={{
          position: 'relative',
          background: C.left,
          padding: '36px 28px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: `1px solid rgba(255,255,255,.07)`,
        }}>
          {/* diagonal stripe */}
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(247,145,56,.09) 0 2px,transparent 2px 11px)' }} />

          <div style={{ position: 'relative' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: C.orange, flexShrink: 0 }} />
              <span style={{ font: `700 13px/1 ${FONTS.display}`, letterSpacing: '.22em', textTransform: 'uppercase', color: C.text }}>
                Muscle Meals
              </span>
            </div>
            {/* Headline */}
            <h2 style={{ margin: '0 0 20px', font: `800 42px/.92 ${FONTS.display}`, textTransform: 'uppercase', color: C.text }}>
              {leftContent.lines[0]}<br />
              <span style={{ color: C.orange }}>{leftContent.lines[1]}</span>
            </h2>
            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {leftContent.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, font: `400 13px/1.45 ${FONTS.body}`, color: C.muted }}>
                  <span style={{ color: C.orange, fontWeight: 700, flexShrink: 0 }}>0{i + 1}</span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Product photo placeholder */}
          <div style={{ position: 'relative', marginTop: 28, border: '1px dashed rgba(245,241,236,.22)', borderRadius: 8, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px)' }}>
            <span style={{ font: '400 10px/1 ui-monospace, monospace', letterSpacing: '.08em', color: 'rgba(245,241,236,.38)' }}>foto de producto</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ position: 'relative', padding: '32px 30px 28px' }}>
          {/* Close button */}
          {onClose && (
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, border: 0, borderRadius: 8, background: 'rgba(255,255,255,.06)', color: C.muted, font: `400 17px/1 ${FONTS.body}`, cursor: 'pointer' }}>×</button>
          )}

          {/* Forgot heading */}
          {isForgot ? (
            <div style={{ marginBottom: 24, paddingTop: 4 }}>
              <p style={{ margin: '0 0 6px', font: `800 28px/1 ${FONTS.display}`, textTransform: 'uppercase', color: C.text }}>Restablecer</p>
              <p style={{ margin: 0, font: `400 13.5px/1.5 ${FONTS.body}`, color: C.muted, maxWidth: '30ch' }}>
                Te enviamos un enlace para crear una nueva contraseña.
              </p>
            </div>
          ) : (
            /* Tab navigation */
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: `1px solid ${C.borderSoft}`, paddingTop: 4 }}>
              {(['signin', 'signup'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  padding: '0 0 11px',
                  border: 'none',
                  borderBottom: `2px solid ${mode === m ? C.orange : 'transparent'}`,
                  background: 'transparent',
                  font: `700 14px/1 ${FONTS.display}`,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: mode === m ? C.text : C.subtle,
                  cursor: 'pointer',
                  transition: 'color .15s, border-color .15s',
                }}>
                  {m === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

            {/* Name — signup only */}
            {isSignup && (
              <label style={{ display: 'block', position: 'relative' }}>
                <span className="mm-label">Nombre completo</span>
                <input type="text" placeholder="" value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '26px 14px 10px', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 15.5, fontFamily: FONTS.body, outline: 'none' }}
                  autoComplete="name"
                />
              </label>
            )}

            {/* Email */}
            <label style={{ display: 'block', position: 'relative' }}>
              <span className="mm-label">Correo electrónico</span>
              <input type="email" placeholder="" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', boxSizing: 'border-box', padding: '26px 14px 10px', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 15.5, fontFamily: FONTS.body, outline: 'none' }}
                autoComplete="email"
              />
            </label>

            {/* Password */}
            {!isForgot && (
              <>
                <label style={{ display: 'block', position: 'relative' }}>
                  <span className={`mm-label${password ? ' mm-label-orange' : ''}`}>Contraseña</span>
                  <input type={showPw ? 'text' : 'password'} placeholder="" value={password} onChange={e => setPassword(e.target.value)} required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '26px 62px 10px 14px', background: C.inputBg, border: `1px solid ${password ? C.orange : C.border}`, borderRadius: 9, color: C.text, fontSize: 15.5, fontFamily: FONTS.body, outline: 'none', transition: 'border-color .15s' }}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 14, bottom: 11, background: 'none', border: 'none', font: `600 11px/1 ${FONTS.label}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.orange, cursor: 'pointer', padding: 0 }}>
                    {showPw ? 'Ocultar' : 'Ver'}
                  </button>
                </label>

                {/* Strength meter — signup */}
                {isSignup && pwStrength && pwStrength.score > 0 && (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: -2 }}>
                    {[1, 2, 3].map(i => (
                      <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength.score ? C.orange : 'rgba(255,255,255,.12)', transition: 'background .2s' }} />
                    ))}
                    <span style={{ marginLeft: 8, font: `600 11px/1 ${FONTS.label}`, letterSpacing: '.1em', textTransform: 'uppercase', color: C.subtle }}>{pwStrength.label}</span>
                  </div>
                )}
              </>
            )}

            {/* Confirm password — signup */}
            {isSignup && (
              <label style={{ display: 'block', position: 'relative' }}>
                <span className="mm-label">Confirmar contraseña</span>
                <input type="password" placeholder="" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '26px 14px 10px', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 15.5, fontFamily: FONTS.body, outline: 'none' }}
                  autoComplete="new-password"
                />
                {confirmPassword && confirmPassword === password && (
                  <span style={{ position: 'absolute', right: 14, bottom: 11, font: `700 14px/1 ${FONTS.body}`, color: C.success }}>✓</span>
                )}
              </label>
            )}

            {/* Forgot link — signin */}
            {mode === 'signin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => switchMode('forgot')}
                  style={{ background: 'none', border: 'none', font: `500 13px/1 ${FONTS.body}`, color: C.muted, cursor: 'pointer', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error   && <p style={{ margin: 0, font: `400 13px/1.4 ${FONTS.body}`, color: C.error }}>{error}</p>}
            {success && <p style={{ margin: 0, font: `400 13px/1.4 ${FONTS.body}`, color: C.success }}>{success}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', marginTop: 6, border: 0, borderRadius: 9,
              background: C.orange, color: '#17140f',
              font: `700 18px/1 ${FONTS.display}`,
              letterSpacing: '.09em', textTransform: 'uppercase',
              padding: '17px 0', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 6px 20px rgba(247,145,56,.18)',
            }}>
              {loading ? '…' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar correo'}
            </button>

            {/* Terms — signup */}
            {isSignup && (
              <p style={{ margin: '2px 0 0', font: `400 12px/1.5 ${FONTS.body}`, color: C.subtle }}>
                Al continuar aceptas los{' '}
                <a href="/terminos" style={{ color: C.orange }}>Términos</a> y el{' '}
                <a href="/privacidad" style={{ color: C.orange }}>Aviso de privacidad</a>.
              </p>
            )}
          </form>

          {/* Back link — forgot */}
          {isForgot && (
            <button onClick={() => switchMode('signin')}
              style={{ background: 'none', border: 'none', font: `500 13px/1 ${FONTS.body}`, color: C.subtle, cursor: 'pointer', padding: 0, marginTop: 14, display: 'block' }}>
              ← Volver a iniciar sesión
            </button>
          )}

          {/* Divider + Google — not in forgot */}
          {!isForgot && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '18px 0 12px' }}>
                <span style={{ flex: 1, height: 1, background: C.borderSoft }} />
                <span style={{ font: `600 10.5px/1 ${FONTS.label}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(245,241,236,.38)' }}>o continuar con</span>
                <span style={{ flex: 1, height: 1, background: C.borderSoft }} />
              </div>
              <button onClick={handleGoogleLogin} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                width: '100%', padding: '13px 0',
                border: `1px solid rgba(255,255,255,.14)`, borderRadius: 9,
                background: 'rgba(255,255,255,.03)', color: C.text,
                font: `600 13.5px/1 ${FONTS.body}`, cursor: 'pointer',
              }}>
                <GoogleIcon />
                Google
              </button>
            </>
          )}

          {/* Switch mode link at bottom */}
          {mode === 'signin' && (
            <p style={{ margin: '14px 0 0', textAlign: 'center', font: `400 13px/1 ${FONTS.body}`, color: C.subtle }}>
              ¿Primera vez?{' '}
              <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', font: `600 13px/1 ${FONTS.body}`, color: C.orange, cursor: 'pointer', padding: 0 }}>
                Crea tu cuenta
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
