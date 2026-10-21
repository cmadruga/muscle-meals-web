import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export type PushPayload = {
  title: string
  body: string
  tag?: string
  url?: string
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const supabase = createAdminClient()
  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return

  await Promise.allSettled(
    subs.map(async (row: { id: string; subscription: string }) => {
      try {
        await webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify(payload))
      } catch (err: unknown) {
        // 410 Gone = suscripción expirada, borrar
        if ((err as { statusCode?: number })?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        } else {
          console.error('Push send error:', err)
        }
      }
    })
  )
}
