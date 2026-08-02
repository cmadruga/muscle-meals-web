'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { colors } from '@/lib/theme'

function Icon({ d, children }: { d?: string; children?: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d ? <path d={d} /> : children}
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  orders: (
    <Icon>
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
    </Icon>
  ),
  customers: (
    <Icon>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" />
    </Icon>
  ),
  lista: (
    <Icon>
      <path d="M5.5 3h7M5.5 6.5h7M5.5 10h7M5.5 13.5h7" />
      <circle cx="3" cy="3" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="3" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="3" cy="10" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="3" cy="13.5" r="0.75" fill="currentColor" stroke="none" />
    </Icon>
  ),
  empaques: (
    <Icon>
      <path d="M8 1.5L14 4.5v7L8 14.5 2 11.5v-7L8 1.5z" />
      <path d="M8 1.5v13M2 4.5l6 3 6-3" />
    </Icon>
  ),
  recetario: (
    <Icon>
      <path d="M3 2h7.5L13 4.5V14H3V2z" />
      <path d="M10 2v2.5H13" />
      <path d="M5.5 7h5M5.5 9.5h5M5.5 12h3" />
    </Icon>
  ),
  pinche: (
    <Icon>
      <path d="M5 2v5a3 3 0 006 0V2" />
      <path d="M8 9v5.5" />
      <path d="M5.5 14.5h5" />
    </Icon>
  ),
  stock: (
    <Icon>
      <path d="M2 13h2.5V8H2v5zM6.75 13h2.5V5h-2.5v8zM11.5 13H14V2h-2.5v11z" />
    </Icon>
  ),
  database: (
    <Icon>
      <ellipse cx="8" cy="3.5" rx="5" ry="2" />
      <path d="M3 3.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
      <path d="M3 7.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
    </Icon>
  ),
}

const NAV_LINKS = [
  { href: '/admin/orders',    label: 'Pedidos',       iconKey: 'orders' },
  { href: '/admin/customers', label: 'Clientes',      iconKey: 'customers' },
  { href: '/admin/lista',     label: 'Lista',         iconKey: 'lista' },
  { href: '/admin/empaques',  label: 'Empaques',      iconKey: 'empaques' },
  { href: '/admin/recetario', label: 'Recetario',     iconKey: 'recetario' },
  { href: '/admin/pinche',    label: 'Pinche',        iconKey: 'pinche' },
  { href: '/admin/stock',     label: 'Stock',         iconKey: 'stock' },
  { href: '/admin/database',  label: 'Base de Datos', iconKey: 'database' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
    setPendingHref(null)
  }, [pathname])

  const navLinks = (
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV_LINKS.map(({ href, label, iconKey }) => {
        const isActive = pathname.startsWith(href)
        const isPending = pendingHref === href && !isActive
        return (
          <Link
            key={href}
            href={href}
            onClick={() => !isActive && setPendingHref(href)}
            className={`adm-navlink${isActive ? ' active' : ''}${isPending ? ' pending' : ''}`}
          >
            <span className="adm-navicon">{ICONS[iconKey]}</span>
            <span className="adm-navlabel">{label}</span>
            {isPending && <span className="adm-spinner" />}
          </Link>
        )
      })}
    </nav>
  )

  const collapsedNav = (
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      {NAV_LINKS.map(({ href, label, iconKey }) => {
        const isActive = pathname.startsWith(href)
        const isPending = pendingHref === href && !isActive
        return (
          <Link
            key={href}
            href={href}
            title={label}
            onClick={() => !isActive && setPendingHref(href)}
            className={`adm-navlink collapsed${isActive ? ' active' : ''}${isPending ? ' pending' : ''}`}
          >
            <span className="adm-navicon">{ICONS[iconKey]}</span>
            {isPending && <span className="adm-spinner" />}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.black, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        @keyframes adm-spin { to { transform: rotate(360deg); } }

        .adm-sidebar {
          width: 220px;
          background: ${colors.grayDark};
          border-right: 1px solid ${colors.grayLight};
          display: flex;
          flex-direction: column;
          padding: 20px 12px;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          z-index: 50;
          transition: width 0.2s ease, transform 0.25s ease;
          overflow: hidden;
        }
        .adm-sidebar.collapsed { width: 56px; padding: 20px 8px; }

        .adm-navlink {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          padding: 9px 10px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #aaa;
          transition: background 0.12s, color 0.12s;
          position: relative;
          white-space: nowrap;
          overflow: hidden;
        }
        .adm-navlink:hover { background: #ffffff12; color: ${colors.white}; }
        .adm-navlink.active { background: ${colors.orange}22; color: ${colors.orange}; font-weight: 600; }
        .adm-navlink.pending { color: #888; opacity: 0.7; pointer-events: none; }
        .adm-navlink.collapsed { justify-content: center; padding: 9px; width: 40px; }

        .adm-navicon { font-size: 16px; flex-shrink: 0; line-height: 1; }
        .adm-navlabel { flex: 1; }

        .adm-spinner {
          width: 12px; height: 12px;
          border: 2px solid #444;
          border-top-color: ${colors.orange};
          border-radius: 50%;
          animation: adm-spin 0.7s linear infinite;
          flex-shrink: 0;
          margin-left: auto;
        }
        .adm-navlink.collapsed .adm-spinner {
          position: absolute;
          bottom: 4px; right: 4px;
          width: 8px; height: 8px;
          border-width: 1.5px;
          margin-left: 0;
        }

        .adm-collapse-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${colors.orange};
          padding: 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.6;
          transition: opacity 0.15s, background 0.15s;
        }
        .adm-collapse-btn:hover { opacity: 1; background: ${colors.orange}18; }

        .adm-topbar { display: none; }
        .adm-overlay { display: none; }
        .adm-content { margin-left: 220px; padding: 32px; min-height: 100vh; transition: margin-left 0.2s ease; }
        .adm-content.collapsed { margin-left: 56px; }

        @media (max-width: 768px) {
          .adm-sidebar { transform: translateX(-100%); }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            background: ${colors.grayDark};
            border-bottom: 1px solid ${colors.grayLight};
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 52px;
            z-index: 40;
          }
          .adm-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: #000000aa;
            z-index: 49;
          }
          .adm-content { margin-left: 0; padding: 16px; padding-top: 68px; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        {/* Header */}
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <button onClick={() => setCollapsed(false)} title="Expandir" className="adm-collapse-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        ) : (
          <div style={{
            marginBottom: 28,
            padding: '14px 14px 14px 14px',
            background: `${colors.orange}12`,
            border: `1px solid ${colors.orange}30`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: colors.orange, fontWeight: 800, fontSize: 15, letterSpacing: '0.01em', lineHeight: 1.2 }}>
                Muscle Meals
              </div>
              <div style={{ color: `${colors.orange}80`, fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Panel Admin
              </div>
            </div>
            <button onClick={() => setCollapsed(true)} title="Colapsar" className="adm-collapse-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4L6 8l4 4" />
              </svg>
            </button>
          </div>
        )}

        {collapsed ? collapsedNav : navLinks}

      </aside>

      {open && <div className="adm-overlay" onClick={() => setOpen(false)} />}

      <div className="adm-topbar">
        <span style={{ color: colors.orange, fontWeight: 700, fontSize: 16 }}>Muscle Meals</span>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}
        >
          <div style={{ width: 22, height: 2, background: colors.white, borderRadius: 2 }} />
          <div style={{ width: 22, height: 2, background: colors.white, borderRadius: 2 }} />
          <div style={{ width: 22, height: 2, background: colors.white, borderRadius: 2 }} />
        </button>
      </div>

      <main className={`adm-content${collapsed ? ' collapsed' : ''}`}>
        {children}
      </main>
    </div>
  )
}
