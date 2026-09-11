'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'

interface LoginFormProps {
  next?: string
  onSuccess?: () => void
  onClose?: () => void
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  page:      '#0a0908',
  panel:     '#0c0a09',
  card:      '#191614',
  formBg:    '#141110',
  orange:    '#F79138',
  orangeHov: '#ffa252',
  orangeTxt: '#17140f',
  text:      '#F5F1EC',
  muted:     'rgba(245,241,236,.6)',
  subtle:    'rgba(245,241,236,.45)',
  faint:     'rgba(245,241,236,.42)',
  border:    'rgba(255,255,255,.12)',
  borderSft: 'rgba(255,255,255,.1)',
  inputBg:   'rgba(255,255,255,.04)',
  error:     '#ef4444',
  success:   '#7ac77a',
}
const F = {
  display: `'Franchise','Big Shoulders Display',sans-serif`,
  body:    `Barlow,system-ui,sans-serif`,
}

// ── Google SVG ────────────────────────────────────────────────────────────────
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

// ── Password strength ─────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string } {
  if (pw.length < 6) return { score: 0, label: '' }
  if (pw.length < 8) return { score: 1, label: 'Débil' }
  const hasNum = /[0-9]/.test(pw)
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw)
  if (pw.length >= 10 && hasNum) return { score: 3, label: 'Fuerte' }
  if (hasNum || hasSpecial) return { score: 2, label: 'Media' }
  return { score: 1, label: 'Débil' }
}

// ── Component ─────────────────────────────────────────────────────────────────
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
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmarla.')
        setLoading(false)
        setTimeout(() => { setMode('signin'); setSuccess(''); setPassword(''); setConfirmPassword(''); setName('') }, 3000)
        return
      }
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

  const headline = isSignup
    ? { line1: 'Arma tu', line2: 'Cuenta' }
    : { line1: 'Bienvenido', line2: 'de vuelta' }

  const benefits = [
    'Repite tu última orden en un toque',
    'Guarda direcciones y macros',
    'Sigue tu entrega en vivo',
  ]

  const ctaLabel = loading ? '…' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar correo'

  return (
    <>
      <style>{`
        /* ── Shell ── */
        .mm-shell {
          display: grid;
          grid-template-columns: 336px 1fr;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          background: ${C.card};
        }

        /* ── Desktop left (decorative) ── */
        .mm-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 32px;
          min-height: 572px;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,.07);
        }

        /* ── Desktop right (form panel) ── */
        .mm-right {
          position: relative;
          padding: 34px 34px 30px;
          background: ${C.formBg} url('/media/fondo-auth.jpg') center/900px repeat;
        }
        /* Overlay sobre la textura */
        .mm-right-overlay {
          position: absolute;
          inset: 0;
          background: rgba(20,17,16,.82);
          pointer-events: none;
        }
        /* Todo el contenido del form por encima del overlay */
        .mm-right-content {
          position: relative;
        }

        /* ── Mobile: ocultar el left, mostrar foto 168px ── */
        .mm-mob-photo {
          display: none;
        }

        /* ── Shared input ── */
        .mm-inp {
          width: 100%;
          box-sizing: border-box;
          padding: 26px 14px 10px;
          background: ${C.inputBg};
          border: 1px solid ${C.border};
          border-radius: 9px;
          color: ${C.text};
          font-size: 15.5px;
          font-family: ${F.body};
          outline: none;
          display: block;
        }
        .mm-inp:focus { border-color: ${C.orange} !important; }

        /* ── Hover states ── */
        .mm-close:hover   { background: rgba(255,255,255,.12) !important; color: ${C.text} !important; }
        .mm-tab:hover     { color: ${C.text} !important; }
        .mm-submit:hover:not(:disabled) { background: ${C.orangeHov} !important; }
        .mm-google:hover  { background: rgba(255,255,255,.08) !important; }
        .mm-switch-btn:hover { color: ${C.orangeHov} !important; }

        /* ── Autofill dark override ── */
        .mm-inp:-webkit-autofill,
        .mm-inp:-webkit-autofill:hover,
        .mm-inp:-webkit-autofill:focus {
          -webkit-text-fill-color: ${C.text} !important;
          -webkit-box-shadow: 0 0 0px 1000px #1a1714 inset !important;
          transition: background-color 9999s;
        }

        /* ── Mobile (≤900px) ── */
        @media (max-width: 900px) {
          .mm-shell {
            display: flex;
            flex-direction: column;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,.09);
            background: ${C.formBg} url('/media/fondo-auth.jpg') center/700px repeat;
            box-shadow: 0 24px 60px rgba(0,0,0,.55);
          }
          .mm-left        { display: none; }
          .mm-mob-photo   { display: block; }
          .mm-right {
            padding: 14px 18px 20px;
            background: rgba(20,17,16,.88);
          }
          .mm-right-overlay { display: none; }
          /* iOS zoom prevention */
          .mm-inp { font-size: 16px !important; padding: 25px 13px 10px !important; }
          .mm-inp-pw { padding-right: 56px !important; }
          .mm-tab-label { font-size: 14px !important; }
          .mm-submit { font-size: 19px !important; padding: 16px 0 !important; }
        }
      `}</style>

      <div className="mm-shell">

        {/* ── Mobile photo band (168px) ── */}
        <div className="mm-mob-photo" style={{ position: 'relative', height: 168, overflow: 'hidden', flexShrink: 0 }} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/photo-lifestyle.jpg"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 38%', display: 'block' }}
          />
          {/* Gradient: blends into form bg */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg,rgba(10,9,8,.1) 0%,rgba(10,9,8,.45) 52%,rgba(20,17,16,1) 100%)',
          }} />
          {/* Logo — top left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/logo-horizontal.png"
            alt="Muscle Meals"
            style={{ position: 'absolute', top: 14, left: 16, height: 17, width: 'auto', display: 'block' }}
          />
          {/* Close — top right */}
          {onClose && (
            <button
              className="mm-close"
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 32, height: 32,
                border: 0, borderRadius: 8,
                background: 'rgba(10,9,8,.55)', color: C.text,
                font: `400 17px/1 ${F.body}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          )}
          {/* Heading — bottom left, above the gradient fade */}
          <h2 style={{
            position: 'absolute', left: 16, bottom: 12, margin: 0,
            font: `700 32px/.9 ${F.display}`,
            textTransform: 'uppercase', color: C.text,
            textShadow: '0 2px 14px rgba(0,0,0,.7)',
          }}>
            {headline.line1}<br />
            <span style={{ color: C.orange }}>{headline.line2}</span>
          </h2>
        </div>

        {/* ── Desktop left: decorative panel ── */}
        <div className="mm-left" aria-hidden="true">
          {/* Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/photo-desk.jpg"
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: '54% 62%', display: 'block',
            }}
          />
          {/* Main gradient (bottom-heavy) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg,rgba(10,9,8,.3) 0%,rgba(10,9,8,.72) 45%,rgba(10,9,8,.95) 100%)',
          }} />
          {/* Top gradient (darker top for logo legibility) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 150,
            background: 'linear-gradient(180deg,rgba(10,9,8,.92) 0%,transparent 100%)',
          }} />
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/logo-horizontal.png"
            alt="Muscle Meals"
            style={{ position: 'absolute', top: 30, left: 32, height: 20, width: 'auto', display: 'block' }}
          />
          {/* Content: heading + subcopy + benefits */}
          <div style={{ position: 'relative' }}>
            <h2 style={{
              margin: '0 0 18px',
              font: `700 50px/.88 ${F.display}`,
              textTransform: 'uppercase', color: C.text,
              textShadow: '0 2px 16px rgba(0,0,0,.7)',
            }}>
              {headline.line1}<br />
              <span style={{ color: C.orange }}>{headline.line2}</span>
            </h2>
            <p style={{
              margin: '0 0 20px',
              font: `400 13.5px/1.5 ${F.body}`,
              color: 'rgba(245,241,236,.82)', maxWidth: '28ch',
            }}>
              Tu última orden sigue guardada. Entra y repítela en un toque.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, font: `400 13px/1.4 ${F.body}`, color: C.text }}>
                  <span style={{ color: C.orange, fontWeight: 700 }}>0{i + 1}</span>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="mm-right">
          <div className="mm-right-overlay" />

          <div className="mm-right-content">

            {/* Close button (desktop) — positioned relative to this content div */}
            {onClose && (
              <button
                className="mm-close"
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  position: 'absolute', top: -14, right: 0,
                  width: 32, height: 32,
                  border: 0, borderRadius: 8,
                  background: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.65)',
                  font: `400 17px/1 ${F.body}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            )}

            {/* Tabs / Forgot heading */}
            {isForgot ? (
              <div style={{ marginBottom: 26 }}>
                <p style={{
                  margin: '0 0 6px',
                  font: `700 26px/1 ${F.display}`,
                  textTransform: 'uppercase', color: C.text,
                }}>Restablecer</p>
                <p style={{ margin: 0, font: `400 14px/1.5 ${F.body}`, color: C.muted }}>
                  Te enviamos un enlace para crear una nueva contraseña.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex', gap: 26,
                margin: '6px 0 26px',
                borderBottom: `1px solid ${C.borderSft}`,
              }}>
                {(['signin', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    className="mm-tab"
                    onClick={() => switchMode(m)}
                    style={{
                      padding: '0 0 11px',
                      border: 'none',
                      borderBottom: `2px solid ${mode === m ? C.orange : 'transparent'}`,
                      background: 'transparent',
                      font: `700 16px/1 ${F.display}`,
                      letterSpacing: '.08em', textTransform: 'uppercase',
                      color: mode === m ? C.text : C.subtle,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="mm-tab-label">
                      {m === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Name — signup only */}
              {isSignup && (
                <label style={{ display: 'block', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', top: 10, left: 14,
                    font: `600 10px/1 ${F.body}`, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: C.faint, pointerEvents: 'none',
                  }}>Nombre completo</span>
                  <input
                    className="mm-inp" type="text" placeholder="" value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    style={{ borderColor: name ? C.orange : C.border }}
                  />
                </label>
              )}

              {/* Email */}
              <label style={{ display: 'block', position: 'relative' }}>
                <span style={{
                  position: 'absolute', top: 10, left: 14,
                  font: `600 10px/1 ${F.body}`, letterSpacing: '.12em',
                  textTransform: 'uppercase', color: C.faint, pointerEvents: 'none',
                }}>Correo electrónico</span>
                <input
                  className="mm-inp" type="email" placeholder="" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  autoComplete="email"
                  style={{ borderColor: email ? C.orange : C.border }}
                />
              </label>

              {/* Password */}
              {!isForgot && (
                <>
                  <label style={{ display: 'block', position: 'relative' }}>
                    <span style={{
                      position: 'absolute', top: 10, left: 14,
                      font: `600 10px/1 ${F.body}`, letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: password ? 'rgba(247,145,56,.85)' : C.faint,
                      pointerEvents: 'none',
                    }}>Contraseña</span>
                    <input
                      className="mm-inp mm-inp-pw"
                      type={showPw ? 'text' : 'password'} placeholder="" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      style={{ paddingRight: 60, borderColor: password ? C.orange : C.border }}
                    />
                    <button
                      type="button" onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: 14, bottom: 11,
                        background: 'none', border: 'none',
                        font: `600 11px/1 ${F.body}`, letterSpacing: '.08em',
                        textTransform: 'uppercase', color: C.orange, cursor: 'pointer', padding: 0,
                      }}
                    >{showPw ? 'Ocultar' : 'Ver'}</button>
                  </label>

                  {/* Strength meter — signup */}
                  {isSignup && pwStrength && pwStrength.score > 0 && (
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: -4 }}>
                      {[1, 2, 3].map(i => (
                        <span key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= pwStrength.score ? C.orange : 'rgba(255,255,255,.12)',
                        }} />
                      ))}
                      <span style={{
                        marginLeft: 8, font: `600 11px/1 ${F.body}`, letterSpacing: '.1em',
                        textTransform: 'uppercase', color: C.subtle,
                      }}>{pwStrength.label}</span>
                    </div>
                  )}
                </>
              )}

              {/* Confirm password — signup */}
              {isSignup && (
                <label style={{ display: 'block', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', top: 10, left: 14,
                    font: `600 10px/1 ${F.body}`, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: C.faint, pointerEvents: 'none',
                  }}>Confirmar contraseña</span>
                  <input
                    className="mm-inp" type="password" placeholder="" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required
                    autoComplete="new-password"
                    style={{ borderColor: confirmPassword ? C.orange : C.border }}
                  />
                  {confirmPassword && confirmPassword === password && (
                    <span style={{
                      position: 'absolute', right: 14, bottom: 11,
                      font: `400 16px/1 ${F.body}`, color: C.success,
                    }}>✓</span>
                  )}
                </label>
              )}

              {/* Forgot link — signin only */}
              {mode === 'signin' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0 18px' }}>
                  <button
                    type="button" onClick={() => switchMode('forgot')}
                    style={{
                      background: 'none', border: 'none',
                      font: `500 13px/1 ${F.body}`, color: C.muted,
                      cursor: 'pointer', padding: 0,
                    }}
                  >¿Olvidaste tu contraseña?</button>
                </div>
              )}

              {/* Error / Success */}
              {error   && <p style={{ margin: 0, font: `400 13px/1.4 ${F.body}`, color: C.error }}>{error}</p>}
              {success && <p style={{ margin: 0, font: `400 13px/1.4 ${F.body}`, color: C.success }}>{success}</p>}

              {/* CTA */}
              <button
                className="mm-submit"
                type="submit" disabled={loading}
                style={{
                  width: '100%',
                  border: 0, borderRadius: 9,
                  background: C.orange, color: C.orangeTxt,
                  font: `700 20px/1 ${F.display}`,
                  letterSpacing: '.09em', textTransform: 'uppercase',
                  padding: '17px 0', cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 6px 20px rgba(247,145,56,.2)',
                }}
              >{ctaLabel}</button>

              {/* Terms — signup */}
              {isSignup && (
                <p style={{ margin: '2px 0 0', font: `400 12px/1.5 ${F.body}`, color: C.subtle }}>
                  Al continuar aceptas los{' '}
                  <a href="/terminos" style={{ color: C.orange }}>Términos</a> y el{' '}
                  <a href="/privacidad" style={{ color: C.orange }}>Aviso de privacidad</a>.
                </p>
              )}
            </form>

            {/* Back — forgot */}
            {isForgot && (
              <button
                onClick={() => switchMode('signin')}
                style={{
                  background: 'none', border: 'none',
                  font: `400 13px/1 ${F.body}`, color: C.subtle,
                  cursor: 'pointer', padding: 0, marginTop: 16, display: 'block',
                }}
              >← Volver a iniciar sesión</button>
            )}

            {/* Divider + Google */}
            {!isForgot && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0 14px' }}>
                  <span style={{ flex: 1, height: 1, background: C.borderSft }} />
                  <span style={{ font: `600 10.5px/1 ${F.body}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)' }}>
                    o continuar con
                  </span>
                  <span style={{ flex: 1, height: 1, background: C.borderSft }} />
                </div>
                <button
                  className="mm-google"
                  onClick={handleGoogleLogin}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    width: '100%', padding: '14px 0',
                    border: `1px solid rgba(255,255,255,.14)`, borderRadius: 9,
                    background: 'rgba(255,255,255,.03)', color: C.text,
                    font: `600 13.5px/1 ${F.body}`, cursor: 'pointer',
                  }}
                >
                  <GoogleIcon />
                  Google
                </button>
              </>
            )}

            {/* Footer link */}
            {mode === 'signin' && (
              <p style={{ margin: '16px 0 0', textAlign: 'center', font: `400 13px/1 ${F.body}`, color: C.subtle }}>
                ¿Primera vez?{' '}
                <button
                  className="mm-switch-btn"
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none', border: 'none',
                    font: `400 13px/1 ${F.body}`, color: C.orange,
                    cursor: 'pointer', padding: 0,
                  }}
                >Crea tu cuenta</button>
              </p>
            )}
            {mode === 'signup' && (
              <p style={{ margin: '16px 0 0', textAlign: 'center', font: `400 13px/1 ${F.body}`, color: C.subtle }}>
                ¿Ya tienes cuenta?{' '}
                <button
                  className="mm-switch-btn"
                  onClick={() => switchMode('signin')}
                  style={{
                    background: 'none', border: 'none',
                    font: `400 13px/1 ${F.body}`, color: C.orange,
                    cursor: 'pointer', padding: 0,
                  }}
                >Iniciar sesión</button>
              </p>
            )}

          </div>{/* .mm-right-content */}
        </div>{/* .mm-right */}

      </div>{/* .mm-shell */}
    </>
  )
}
