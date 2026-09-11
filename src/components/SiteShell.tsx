'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

/**
 * Wrapper del layout raíz.
 * - /admin: sin Navbar, sin paddingTop
 * - resto:  Navbar global (64px) + paddingTop 64px
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin    = pathname.startsWith('/admin')
  const noZoom     = isAdmin || pathname.startsWith('/checkout')

  return (
    <>
      {!isAdmin && <Navbar />}
      <div style={{ paddingTop: isAdmin ? 0 : 64 }}>
        {noZoom ? children : <div className="public-content">{children}</div>}
      </div>
    </>
  )
}
