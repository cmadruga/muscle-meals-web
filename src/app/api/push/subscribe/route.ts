import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Solo el admin puede suscribirse
function isAdmin(request: NextRequest): boolean {
  return request.cookies.get('admin_token')?.value === process.env.ADMIN_TOKEN
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await request.json()
  if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { endpoint: subscription.endpoint, subscription: JSON.stringify(subscription) },
      { onConflict: 'endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return NextResponse.json({ ok: true })
}
