import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReferralCode } from '@/lib/utils/referrals'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Behind a proxy (ngrok, Vercel, etc.) request.url may resolve to the internal
  // host. Use x-forwarded-* headers to reconstruct the real public origin.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin
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

      const baseCode = buildReferralCode(email)

      if (existing) {
        // Vincular user_id; asignar referral_code si aún no tiene
        const updates: Record<string, string> = { user_id: user.id }
        const { data: existingFull } = await admin
          .from('customers').select('referral_code').eq('id', existing.id).maybeSingle()
        if (!existingFull?.referral_code) {
          // Generar código único con sufijo si hay conflicto
          let code = baseCode
          let n = 2
          while (true) {
            const { data: conflict } = await admin
              .from('customers').select('id').eq('referral_code', code).maybeSingle()
            if (!conflict) break
            code = baseCode + n++
          }
          updates.referral_code = code
        }
        await admin.from('customers').update(updates).eq('id', existing.id)
      } else {
        // Nuevo cliente — generar código único
        let code = baseCode
        let n = 2
        while (true) {
          const { data: conflict } = await admin
            .from('customers').select('id').eq('referral_code', code).maybeSingle()
          if (!conflict) break
          code = baseCode + n++
        }
        await admin.from('customers').insert({
          full_name: name,
          email,
          user_id: user.id,
          referral_code: code,
          // phone y address son opcionales; el cliente los completa en /cuenta
        })
      }

      // Prefer ?next= in the URL; fall back to the mm_auth_next cookie
      // (set by LoginForm before OAuth so we avoid query params in redirectTo)
      const nextFromQuery  = searchParams.get('next')
      const nextFromCookie = request.cookies.get('mm_auth_next')?.value
        ? decodeURIComponent(request.cookies.get('mm_auth_next')!.value)
        : null
      const next = nextFromQuery ?? nextFromCookie ?? '/cuenta'
      const safePath = next.startsWith('/') ? next : '/cuenta'
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  // Error o código faltante → de regreso al login
  return NextResponse.redirect(`${origin}/cuenta/login?error=auth`)
}
