import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso en SERVER (Server Components, Route Handlers, Server Actions)
 * 
 * IMPORTANTE: Esta función es async porque `cookies()` en Next.js 15+ es async.
 * Debe llamarse dentro de un contexto de request (no en módulos top-level).
 * 
 * Uso en Server Component:
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('products').select()
 * }
 * ```
 * 
 * Uso en Route Handler:
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export async function GET() {
 *   const supabase = await createClient()
 *   // ...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El método `set` fue llamado desde un Server Component.
            // Esto puede ignorarse si tienes middleware refrescando sesiones.
          }
        },
      },
    }
  )
}
