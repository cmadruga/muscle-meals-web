import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * Bypasa RLS — usar solo en el servidor (Server Actions, Route Handlers, lib/db).
 * NUNCA importar desde componentes cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
