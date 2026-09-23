'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

/**
 * Wrapper del layout raíz.
 * - /admin: sin Navbar, sin paddingTop
 * - /: sin Navbar, sin paddingTop (landing tiene su propio avatar inline)
 * - resto:  Navbar global (64px) + paddingTop 64px
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin    = pathname.startsWith('/admin')
  const isLanding  = pathname === '/'
  const noNavbar   = isAdmin || isLanding
  const noZoom     = isAdmin || isLanding || pathname.startsWith('/checkout')

  return (
    <>
      {!noNavbar && <Navbar />}
      <div style={{ paddingTop: noNavbar ? 0 : 64 }}>
        {noZoom ? children : <div className="public-content">{children}</div>}
      </div>
    </>
  )
}
