'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import LoginModal from './LoginModal'

const C = { orange: '#F79138', text: '#F5F1EC', card: '#191614' }
const F = { body: 'Barlow,system-ui,sans-serif' }

/** Back navigation config for the current route, or null on home. */
function getBack(pathname: string): { label: string; href: string } | null {
  if (pathname === '/')                return null
  if (pathname === '/menu')            return { label: '← Volver al inicio', href: '/' }
  if (pathname === '/checkout')        return { label: '← Volver al menú',   href: '/menu' }
  if (pathname.startsWith('/order-')) return { label: '← Ir al menú',        href: '/menu' }
  if (pathname.startsWith('/cuenta')) return { label: '← Volver al inicio',  href: '/' }
  if (pathname.startsWith('/auth'))   return { label: '← Volver al inicio',  href: '/' }
  return                                     { label: '← Volver al inicio',  href: '/' }
}

export default function Navbar() {
  const pathname        = usePathname()
  const router          = useRouter()
  const [mounted, setMounted]           = useState(false)
  const [showLogin, setShowLogin]       = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, loading } = useAuth()
  const dropdownRef   = useRef<HTMLDivElement>(null)
  const desktopBtnRef = useRef<HTMLButtonElement>(null)
  const mobileBtnRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        !dropdownRef.current?.contains(t) &&
        !desktopBtnRef.current?.contains(t) &&
        !mobileBtnRef.current?.contains(t)
      ) setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setShowDropdown(false)
    router.push('/')
    router.refresh()
  }

  const back        = getBack(pathname)
  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase() || '?'
  const userName    = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''
  const firstName   = userName.split(' ')[0] || 'Mi cuenta'

  return (
    <>
      <style>{`
        .nb-desktop { display: flex; align-items: center; }
        .nb-mobile  { display: none; }
        @media (max-width: 640px) {
          .nb-desktop { display: none !important; }
          .nb-mobile  { display: flex !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 1000,
        background: '#0c0a09', borderBottom: '1px solid rgba(255,255,255,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>

        {/* ─── DESKTOP left: logo [+ sep + back link] ─────────────── */}
        <div className="nb-desktop" style={{ gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/media/logo-horizontal.png" alt="Muscle Meals"
              width={148} height={22} style={{ height: 22, width: 'auto', display: 'block' }} />
          </Link>
          {back && (
            <>
              <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.1)', flexShrink: 0 }} />
              <Link href={back.href} style={{
                font: `500 13.5px/1 ${F.body}`, color: 'rgba(245,241,236,.55)', textDecoration: 'none',
              }}>
                {back.label}
              </Link>
            </>
          )}
        </div>

        {/* ─── DESKTOP right: avatar or login ─────────────────────── */}
        <div className="nb-desktop">
          {mounted && !loading && (
            user ? (
              <button ref={desktopBtnRef} onClick={() => setShowDropdown(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 14px',
                border: '1px solid rgba(255,255,255,.14)', borderRadius: 9,
                background: 'transparent', cursor: 'pointer',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: C.orange, color: '#17140f',
                  font: `700 10px/20px ${F.body}`, textAlign: 'center',
                  display: 'inline-block', flexShrink: 0,
                }}>{userInitial}</span>
                <span style={{ font: `600 13px/1 ${F.body}`, color: C.text }}>{firstName}</span>
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{
                padding: '9px 14px',
                border: '1px solid rgba(255,255,255,.14)', borderRadius: 9,
                background: 'transparent', cursor: 'pointer',
                font: `600 13px/1 ${F.body}`, color: 'rgba(245,241,236,.7)',
              }}>
                Iniciar sesión
              </button>
            )
          )}
        </div>

        {/* ─── MOBILE left: back link or spacer ───────────────────── */}
        <div className="nb-mobile" style={{ flex: 1, justifyContent: 'flex-start' }}>
          {back ? (
            <Link href={back.href} style={{
              font: `500 13px/1 ${F.body}`, color: 'rgba(245,241,236,.6)',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              ← Volver
            </Link>
          ) : (
            <div style={{ width: 80 }} /> /* spacer to balance right side */
          )}
        </div>

        {/* ─── MOBILE center: logo-movil (absolute) ───────────────── */}
        <Link href="/" className="nb-mobile" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          alignItems: 'center',
        }}>
          <Image src="/media/logo-movil.png" alt="Muscle Meals"
            width={33} height={36} style={{ height: 36, width: 'auto', display: 'block' }} />
        </Link>

        {/* ─── MOBILE right: avatar or login ──────────────────────── */}
        <div className="nb-mobile" style={{ flex: 1, justifyContent: 'flex-end' }}>
          {mounted && !loading && (
            user ? (
              <button ref={mobileBtnRef} onClick={() => setShowDropdown(v => !v)} style={{
                width: 34, height: 34, borderRadius: '50%',
                background: C.orange, color: '#17140f',
                font: `700 13px/1 ${F.body}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0,
              }}>
                {userInitial}
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{
                padding: '7px 11px',
                border: '1px solid rgba(255,255,255,.16)', borderRadius: 8,
                background: 'transparent', cursor: 'pointer',
                font: `600 12px/1 ${F.body}`, color: 'rgba(245,241,236,.75)',
                whiteSpace: 'nowrap',
              }}>
                Iniciar sesión
              </button>
            )
          )}
        </div>

      </nav>

      {/* ── Dropdown panel ─────────────────────────────────────────── */}
      {mounted && showDropdown && user && (
        <div ref={dropdownRef} style={{
          position: 'fixed', top: 74, right: 16, zIndex: 1100,
          background: C.card, border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 10, minWidth: 200, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: 0, fontFamily: F.body }}>
              {firstName}
            </p>
            <p style={{ color: 'rgba(245,241,236,.45)', fontSize: 12, margin: '2px 0 0', fontFamily: F.body }}>
              {user.email}
            </p>
          </div>
          <DropdownLink href="/cuenta" onClick={() => setShowDropdown(false)}>Mi cuenta</DropdownLink>
          <DropdownLink href="/cuenta/ordenes" onClick={() => setShowDropdown(false)}>Mis órdenes</DropdownLink>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 4 }} />
          <button onClick={handleLogout} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '11px 16px', background: 'transparent', border: 'none',
            color: '#ef4444', fontSize: 14, cursor: 'pointer', fontFamily: F.body,
          }}>
            Cerrar sesión
          </button>
        </div>
      )}

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}

function DropdownLink({ href, onClick, children }: {
  href: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', padding: '11px 16px',
      color: '#F5F1EC', textDecoration: 'none', fontSize: 14,
      fontFamily: 'Barlow,system-ui,sans-serif',
    }}>
      {children}
    </Link>
  )
}
