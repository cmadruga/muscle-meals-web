'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { getMyMembership } from '@/app/actions/customer'
import LoginModal from './LoginModal'

const C = { orange: '#F79138', text: '#F5F1EC', card: '#191614' }
const F = { body: 'Barlow,system-ui,sans-serif', display: `Franchise,'Big Shoulders Display',sans-serif` }

/** Back navigation config for the current route, or null on home. */
function getBack(pathname: string): { label: string; href: string } | null {
  if (pathname === '/')                  return null
  if (pathname === '/menu')              return null
  if (pathname === '/checkout')          return { label: '← Volver al menú', href: '/menu' }
  if (pathname.startsWith('/order-'))   return { label: '← Volver al menú', href: '/menu' }
  if (pathname === '/cuenta')            return { label: '← Volver al menú', href: '/menu' }
  if (pathname === '/cuenta/pedidos')    return { label: '← Mi cuenta',      href: '/cuenta' }
  if (pathname.startsWith('/cuenta'))   return { label: '← Mi cuenta',      href: '/cuenta' }
  if (pathname.startsWith('/auth'))     return null
  return                                       { label: '← Volver al menú', href: '/menu' }
}

export default function Navbar() {
  const pathname        = usePathname()
  const router          = useRouter()
  const [mounted, setMounted]             = useState(false)
  const [showLogin, setShowLogin]         = useState(false)
  const [showDropdown, setShowDropdown]   = useState(false)
  const [showSheet, setShowSheet]         = useState(false)
  const [weeksLeft, setWeeksLeft]         = useState<number | null>(null)
  const [isMember, setIsMember]           = useState(false)
  const { user, loading } = useAuth()
  const dropdownRef   = useRef<HTMLDivElement>(null)
  const desktopBtnRef = useRef<HTMLButtonElement>(null)
  const mobileBtnRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* ── Fetch order count + membership once user is available ── */
  useEffect(() => {
    if (!user) { setIsMember(false); setWeeksLeft(null); return }
    getMyMembership().then(m => {
      if (m) { setIsMember(m.isMember); setWeeksLeft(m.weeksLeft) }
    })
  }, [user])

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    if (!showDropdown) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (!dropdownRef.current?.contains(t) && !desktopBtnRef.current?.contains(t)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  /* ── Close sheet on outside click ── */
  useEffect(() => {
    if (!showSheet) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSheet(false) }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [showSheet])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setShowDropdown(false); setShowSheet(false)
    router.push('/'); router.refresh()
  }

  const back        = getBack(pathname)
  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase() || '?'
  const userName    = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''
  const firstName   = userName.split(' ')[0] || 'Mi cuenta'

  /* ── Chip style when dropdown open (members vs non-members) ── */
  const chipBorder = showDropdown
    ? (isMember ? '1px solid rgba(247,145,56,.5)' : '1px solid rgba(255,255,255,.2)')
    : '1px solid rgba(255,255,255,.14)'
  const chipBg = showDropdown
    ? (isMember ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.07)')
    : 'rgba(255,255,255,.04)'
  const caretColor = showDropdown ? (isMember ? C.orange : 'rgba(245,241,236,.6)') : 'rgba(245,241,236,.55)'

  /* ── Dropdown panel ── */
  const DropdownPanel = () => (
    <div ref={dropdownRef} style={{
      position: 'fixed', top: 74, right: 16, zIndex: 1100,
      width: 284,
      background: C.card, border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,.6)',
    }}>
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: C.orange, color: '#17140f', font: `700 16px/38px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>{userInitial}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: `600 14.5px/1 ${F.body}`, color: C.text }}>{userName || firstName}</div>
          <div style={{ marginTop: 4, font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
      </div>

      {/* Membership status row */}
      {isMember && (weeksLeft ?? 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 18px', background: 'rgba(247,145,56,.09)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Miembro activo</span>
          <span style={{ font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>{weeksLeft} semana{weeksLeft !== 1 ? 's' : ''} restante{weeksLeft !== 1 ? 's' : ''}</span>
        </div>
      )}
      {isMember && (weeksLeft ?? 0) === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 18px', background: 'rgba(232,181,74,.08)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8B54A' }}>Miembro inactivo</span>
          <span style={{ font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>0 semanas restantes</span>
        </div>
      )}

      {/* Nav items */}
      <div style={{ padding: '7px 0' }}>
        <DropdownItem href="/cuenta" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.6)" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.6-3.6 3.3-5.4 6.5-5.4s5.9 1.8 6.5 5.4"/></svg>
        } onClick={() => setShowDropdown(false)}>Mi cuenta</DropdownItem>

        <DropdownItem href="/cuenta/pedidos" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.6)" strokeWidth="1.9" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9.5h8M8 14h5"/></svg>
        } onClick={() => setShowDropdown(false)}>Mis pedidos</DropdownItem>

        <DropdownItem href="/cuenta#invitar" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="1.9" strokeLinecap="round"><path d="M4 8h16v12H4z"/><path d="M12 8v12M4 8l2.5-4 5.5 4 5.5-4L20 8"/></svg>
        } onClick={() => setShowDropdown(false)}>Invitar y ganar 10%</DropdownItem>
      </div>

      {/* Upgrade / renewal block */}
      {(!isMember || (weeksLeft ?? 0) === 0) && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.08)', background: 'rgba(247,145,56,.07)' }}>
          <div style={{ font: `600 13.5px/1.35 ${F.body}`, color: C.text }}>
            {isMember ? 'Renueva tu membresía y vuelve a ahorrar' : 'Hazte miembro y ahorra en cada semana'}
          </div>
          {/* Ver planes — pendiente */}
        </div>
      )}

      {/* Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '7px 0' }}>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(214,84,74,.09)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e08078" strokeWidth="1.9" strokeLinecap="round"><path d="M15 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8"/><path d="M18 12h-7M15.5 9l3 3-3 3"/></svg>
          <span style={{ font: `500 14px/1 ${F.body}`, color: '#e08078' }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  /* ── Mobile bottom sheet ── */
  const BottomSheet = () => (
    <>
      {/* Backdrop */}
      <div onClick={() => setShowSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(8,7,6,.74)', backdropFilter: 'blur(2px)' }} />
      {/* Sheet */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1100, background: C.card, borderTop: '1px solid rgba(255,255,255,.1)', borderRadius: '22px 22px 0 0', padding: '10px 0 22px' }}>
        <span style={{ display: 'block', width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)', margin: '0 auto 16px' }} />
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ flexShrink: 0, width: 42, height: 42, borderRadius: '50%', background: C.orange, color: '#17140f', font: `700 17px/42px ${F.body}`, textAlign: 'center', display: 'inline-block' }}>{userInitial}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: `600 15px/1 ${F.body}`, color: C.text }}>{userName || firstName}</div>
            <div style={{ marginTop: 4, font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
        </div>

        {/* Membership */}
        {isMember && (weeksLeft ?? 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 20px', background: 'rgba(247,145,56,.09)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Miembro activo</span>
            <span style={{ font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>{weeksLeft} semana{weeksLeft !== 1 ? 's' : ''} restante{weeksLeft !== 1 ? 's' : ''}</span>
          </div>
        )}
        {isMember && (weeksLeft ?? 0) === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 20px', background: 'rgba(232,181,74,.08)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8B54A' }}>Miembro inactivo</span>
            <span style={{ font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>0 semanas restantes</span>
          </div>
        )}

        {/* Nav items */}
        <div style={{ padding: '6px 0' }}>
          <SheetItem href="/cuenta" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.6)" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.6-3.6 3.3-5.4 6.5-5.4s5.9 1.8 6.5 5.4"/></svg>} onClick={() => setShowSheet(false)}>Mi cuenta</SheetItem>
          <SheetItem href="/cuenta/pedidos" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.6)" strokeWidth="1.9" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9.5h8M8 14h5"/></svg>}
            onClick={() => setShowSheet(false)}>Mis pedidos</SheetItem>
          <SheetItem href="/cuenta#invitar" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="1.9" strokeLinecap="round"><path d="M4 8h16v12H4z"/><path d="M12 8v12M4 8l2.5-4 5.5 4 5.5-4L20 8"/></svg>} onClick={() => setShowSheet(false)}>Invitar y ganar 10%</SheetItem>
        </div>

        {(!isMember || (weeksLeft ?? 0) === 0) && (
          <div style={{ margin: '0 20px', padding: '14px 18px', borderRadius: 10, background: 'rgba(247,145,56,.07)', border: '1px solid rgba(247,145,56,.15)' }}>
            <div style={{ font: `600 13px/1.35 ${F.body}`, color: C.text }}>
              {isMember ? 'Renueva tu membresía y vuelve a ahorrar' : 'Hazte miembro y ahorra en cada semana'}
            </div>
            <button onClick={() => { setShowSheet(false); router.push('/membresia') }} style={{ width: '100%', marginTop: 11, padding: '11px 0', border: 'none', borderRadius: 8, background: C.orange, color: '#17140f', font: `700 15px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Ver planes</button>
          </div>
        )}

        {/* Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '6px 0 0' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 20px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e08078" strokeWidth="1.9" strokeLinecap="round"><path d="M15 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8"/><path d="M18 12h-7M15.5 9l3 3-3 3"/></svg>
            <span style={{ font: `500 15.5px/1 ${F.body}`, color: '#e08078' }}>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  )

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        .nb-desktop { display: flex; align-items: center; }
        .nb-mobile  { display: none; }
        @media (max-width: 640px) {
          .nb-desktop { display: none !important; }
          .nb-mobile  { display: flex !important; }
        }
        .nb-dropdown-row:hover { background: rgba(255,255,255,.05) !important; }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 1000,
        background: '#0c0a09', borderBottom: '1px solid rgba(255,255,255,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>

        {/* ─── DESKTOP left ───────────────────────────────────────────────── */}
        <div className="nb-desktop" style={{ gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/media/logo-horizontal.png" alt="Muscle Meals" width={148} height={22} style={{ height: 22, width: 'auto', display: 'block' }} />
          </Link>
          {back && (
            <>
              <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.1)', flexShrink: 0 }} />
              <Link href={back.href} style={{ font: `500 13.5px/1 ${F.body}`, color: 'rgba(245,241,236,.55)', textDecoration: 'none' }}>{back.label}</Link>
            </>
          )}
        </div>

        {/* ─── DESKTOP right ──────────────────────────────────────────────── */}
        <div className="nb-desktop">
          {mounted && !loading && (
            user ? (
              <button ref={desktopBtnRef} onClick={() => setShowDropdown(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px 7px 7px',
                border: chipBorder, borderRadius: 22, background: chipBg,
                cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.orange, color: '#17140f', font: `700 12px/26px ${F.body}`, textAlign: 'center', display: 'inline-block', flexShrink: 0 }}>{userInitial}</span>
                <span style={{ font: `600 13px/1 ${F.body}`, color: C.text }}>{firstName}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={caretColor} strokeWidth="2.6" strokeLinecap="round" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ padding: '9px 14px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, background: 'transparent', cursor: 'pointer', font: `600 13px/1 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>
                Iniciar sesión
              </button>
            )
          )}
        </div>

        {/* ─── MOBILE left ────────────────────────────────────────────────── */}
        <div className="nb-mobile" style={{ flex: 1, justifyContent: 'flex-start' }}>
          {back ? (
            <Link href={back.href} style={{ font: `500 13px/1 ${F.body}`, color: 'rgba(245,241,236,.6)', textDecoration: 'none', whiteSpace: 'nowrap' }}>← Volver</Link>
          ) : (
            <div style={{ width: 80 }} />
          )}
        </div>

        {/* ─── MOBILE center logo ──────────────────────────────────────────── */}
        <Link href="/" className="nb-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }}>
          <Image src="/media/logo-movil.png" alt="Muscle Meals" width={33} height={36} style={{ height: 36, width: 'auto', display: 'block' }} />
        </Link>

        {/* ─── MOBILE right ───────────────────────────────────────────────── */}
        <div className="nb-mobile" style={{ flex: 1, justifyContent: 'flex-end' }}>
          {mounted && !loading && (
            user ? (
              <button ref={mobileBtnRef} onClick={() => setShowSheet(true)} style={{ width: 34, height: 34, borderRadius: '50%', background: C.orange, color: '#17140f', font: `700 13px/1 ${F.body}`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                {userInitial}
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ padding: '7px 11px', border: '1px solid rgba(255,255,255,.16)', borderRadius: 8, background: 'transparent', cursor: 'pointer', font: `600 12px/1 ${F.body}`, color: 'rgba(245,241,236,.75)', whiteSpace: 'nowrap' }}>
                Iniciar sesión
              </button>
            )
          )}
        </div>

      </nav>

      {/* Desktop dropdown */}
      {mounted && showDropdown && user && <DropdownPanel />}

      {/* Mobile bottom sheet */}
      {mounted && showSheet && user && <BottomSheet />}

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}

/* ── Helper link components ── */
function DropdownItem({ href, icon, right, onClick, children }: {
  href: string; icon: React.ReactNode; right?: React.ReactNode; onClick?: () => void; children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} className="nb-dropdown-row" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', textDecoration: 'none' }}>
      {icon}
      <span style={{ flex: 1, font: `500 14px/1 Barlow,system-ui,sans-serif`, color: '#F5F1EC' }}>{children}</span>
      {right}
    </Link>
  )
}

function SheetItem({ href, icon, right, onClick, children }: {
  href: string; icon: React.ReactNode; right?: React.ReactNode; onClick?: () => void; children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 20px', textDecoration: 'none' }}>
      {icon}
      <span style={{ flex: 1, font: `500 15.5px/1 Barlow,system-ui,sans-serif`, color: '#F5F1EC' }}>{children}</span>
      {right}
    </Link>
  )
}
