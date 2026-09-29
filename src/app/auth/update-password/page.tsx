'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { F } from '@/lib/ui-fonts'

const C = {
  bg:     '#0f0d0c',
  card:   '#191614',
  orange: '#F79138',
  text:   '#F5F1EC',
  muted:  'rgba(245,241,236,.6)',
  faint:  'rgba(245,241,236,.42)',
  border: 'rgba(255,255,255,.12)',
  inputBg:'rgba(255,255,255,.04)',
}

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '26px 62px 10px 14px',
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    color: C.text,
    fontSize: 15.5,
    fontFamily: F.body,
    outline: 'none',
  }

  return (
    <>
      {/* Fonts cargadas globalmente via next/font */}
      <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid rgba(255,255,255,.08)`, padding: '40px 36px 36px', width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: C.orange }} />
            <span style={{ font: `700 13px/1 ${F.display}`, letterSpacing: '.22em', textTransform: 'uppercase', color: C.text }}>Muscle Meals</span>
          </div>

          <h1 style={{ margin: '0 0 6px', font: `800 36px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
            Nueva<br /><span style={{ color: C.orange }}>contraseña</span>
          </h1>
          <p style={{ margin: '0 0 28px', font: `400 13.5px/1.5 ${F.body}`, color: C.muted }}>
            Elige una contraseña nueva para tu cuenta.
          </p>

          {success ? (
            <p style={{ font: `400 14px/1.5 ${F.body}`, color: '#7ac77a', textAlign: 'center' }}>
              ✓ Contraseña actualizada. Redirigiendo…
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'block', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, left: 14, font: `600 10px/1 ${F.body}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.faint, pointerEvents: 'none' }}>Nueva contraseña</span>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, bottom: 11, background: 'none', border: 'none', font: `600 11px/1 ${F.body}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.orange, cursor: 'pointer', padding: 0 }}>
                  {showPw ? 'Ocultar' : 'Ver'}
                </button>
              </label>

              <label style={{ display: 'block', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, left: 14, font: `600 10px/1 ${F.body}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.faint, pointerEvents: 'none' }}>Confirmar contraseña</span>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ ...inputStyle, padding: '26px 14px 10px' }} autoComplete="new-password" />
                {confirm && confirm === password && (
                  <span style={{ position: 'absolute', right: 14, bottom: 11, font: `700 14px/1 ${F.body}`, color: '#7ac77a' }}>✓</span>
                )}
              </label>

              {error && <p style={{ margin: 0, font: `400 13px/1.4 ${F.body}`, color: '#ef4444' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: 4, border: 0, borderRadius: 9,
                background: C.orange, color: '#17140f',
                font: `700 18px/1 ${F.display}`,
                letterSpacing: '.09em', textTransform: 'uppercase',
                padding: '17px 0', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(247,145,56,.18)',
              }}>
                {loading ? '…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
