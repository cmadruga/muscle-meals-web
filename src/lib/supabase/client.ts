import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso en el BROWSER (Client Components)
 * 
 * Usa createBrowserClient de @supabase/ssr que es la forma recomendada
 * para Next.js App Router. Maneja automáticamente cookies y auth state.
 * 
 * Uso:
 * ```ts
 * 'use client'
 * import { supabase } from '@/lib/supabase/client'
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Instancia singleton del cliente para evitar múltiples conexiones
 * Úsala directamente en Client Components
 */
export const supabase = createClient()
