import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role — bypasea RLS.
 * Solo usar en Server Actions / Route Handlers (nunca en el browser).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
