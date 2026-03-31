import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const email = user.email!
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split('@')[0]

      const admin = createAdminClient()

      // Si ya existe un customer con este email → vincular user_id
      // Si no existe → crear registro básico
      const { data: existing } = await admin
        .from('customers')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        await admin
          .from('customers')
          .update({ user_id: user.id })
          .eq('id', existing.id)
      } else {
        await admin.from('customers').insert({
          full_name: name,
          email,
          user_id: user.id,
          // phone y address son opcionales; el cliente los completa en /cuenta
        })
      }

      return NextResponse.redirect(`${origin}/cuenta`)
    }
  }

  // Error o código faltante → de regreso al login
  return NextResponse.redirect(`${origin}/cuenta/login?error=auth`)
}
