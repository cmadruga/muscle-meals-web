import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Propagar x-pathname para que el root layout pueda ocultar la Navbar en /panel
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  // ── Admin /panel ──────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // La página de login es pública
    if (pathname === '/admin/login') {
      return response
    }

    const adminToken = request.cookies.get('admin_token')?.value
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return response
  }

  // ── Cliente /cuenta ───────────────────────────────────────
  if (pathname.startsWith('/cuenta')) {
    // La página de login y el callback son públicas
    if (pathname === '/cuenta/login' || pathname.startsWith('/auth/')) {
      return response
    }

    // Verificar sesión Supabase (refresca cookies si es necesario)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request: { headers: requestHeaders } })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/cuenta/login', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/:path*']
}
