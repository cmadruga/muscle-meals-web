'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminLogout } from '@/app/actions/admin-auth'
import { colors } from '@/lib/theme'

const NAV_LINKS = [
  { href: '/admin/orders', label: 'Pedidos' },
  { href: '/admin/lista', label: 'Lista' },
  { href: '/admin/empaques', label: 'Empaques' },
  { href: '/admin/recetario', label: 'Recetario' },
  { href: '/admin/pinche', label: 'Pinche' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/database', label: 'Base de Datos' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Cerrar sidebar al navegar
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname])

  const navLinks = (
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: 'block',
            color: pathname.startsWith(href) ? colors.orange : colors.white,
            textDecoration: 'none',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.black, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        .adm-sidebar {
          width: 220px;
          background: ${colors.grayDark};
          border-right: 1px solid ${colors.grayLight};
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          z-index: 50;
          transition: width 0.2s ease, transform 0.25s ease;
          overflow: hidden;
        }
        .adm-sidebar.collapsed {
          width: 48px;
          padding: 24px 8px;
        }
        .adm-topbar { display: none; }
        .adm-overlay { display: none; }
        .adm-content { margin-left: 220px; padding: 32px; min-height: 100vh; transition: margin-left 0.2s ease; }
        .adm-content.collapsed { margin-left: 48px; }

        @media (max-width: 768px) {
          .adm-sidebar {
            transform: translateX(-100%);
          }
          .adm-sidebar.open {
            transform: translateX(0);
          }
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
          .adm-content {
            margin-left: 0;
            padding: 16px;
            padding-top: 68px;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        {/* Header + collapse button */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {!collapsed && (
            <div style={{ paddingLeft: 8 }}>
              <span style={{ color: colors.orange, fontWeight: 700, fontSize: 18 }}>Muscle Meals</span>
              <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Panel Admin</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: colors.textMuted, fontSize: 18, padding: 4, lineHeight: 1,
              marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0,
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed && navLinks}

        {!collapsed && (
          <form action={adminLogout} suppressHydrationWarning>
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'transparent',
                border: `1px solid ${colors.grayLight}`,
                borderRadius: 8,
                padding: '8px 12px',
                color: colors.textMuted,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Salir
            </button>
          </form>
        )}
      </aside>

      {/* Overlay móvil */}
      {open && <div className="adm-overlay" onClick={() => setOpen(false)} />}

      {/* Top bar móvil */}
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

      {/* Contenido */}
      <main className={`adm-content${collapsed ? ' collapsed' : ''}`}>
        {children}
      </main>
    </div>
  )
}
