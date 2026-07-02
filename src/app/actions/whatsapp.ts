'use server'

import { sendReorderTemplate } from '@/lib/whatsapp'

export async function sendReorderBroadcast(
  recipients: { phone: string; firstName: string }[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const ok = await sendReorderTemplate(r.phone, r.firstName)
    if (ok) sent++
    else failed++
  }

  return { sent, failed }
}
