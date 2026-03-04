import Link from 'next/link'
import { adminLogout } from '@/app/actions/admin-auth'
import { colors } from '@/lib/theme'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.black }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: colors.grayDark,
        borderRight: `1px solid ${colors.grayLight}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 50
      }}>
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <span style={{ color: colors.orange, fontWeight: 700, fontSize: 18 }}>
            Muscle Meals
          </span>
          <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            Panel Admin
          </p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link
            href="/panel/orders"
            style={{
              display: 'block',
              color: colors.white,
              textDecoration: 'none',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Órdenes
          </Link>
          {/* Recetas — pendiente */}
        </nav>

        <form action={adminLogout}>
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
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </aside>

      {/* Content area */}
      <main style={{
        flex: 1,
        marginLeft: 220,
        padding: 32,
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  )
}
