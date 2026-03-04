import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { colors } from '@/lib/theme'
import PerfilForm from './perfil/PerfilForm'

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <main style={{ minHeight: '100vh', background: colors.black, padding: '32px 24px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h1 style={{ color: colors.white, fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          Mi cuenta
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
          {user.email}
        </p>

        <PerfilForm customer={customer} />
      </div>
    </main>
  )
}
