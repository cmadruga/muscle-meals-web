'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

/**
 * Wrapper del layout raíz que oculta la Navbar pública en rutas /panel
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/panel')

  return (
    <>
      {!isAdmin && <Navbar />}
      <div style={{ paddingTop: isAdmin ? 0 : 60 }}>
        {children}
      </div>
    </>
  )
}
