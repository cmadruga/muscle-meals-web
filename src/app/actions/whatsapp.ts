'use server'

import { sendReorderTemplate, sendReorderLastReminder, sendNewClienteLastReminder } from '@/lib/whatsapp'
import { createAdminClient } from '@/lib/supabase/admin'
import { insertWaOutgoingMessage } from '@/lib/db/whatsapp'

const BUCKET = 'whatsapp-templates'

export async function sendReorderBroadcast(
  recipients: { phone: string; firstName: string; fullName: string }[],
  imageUrl: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  for (const r of recipients) {
    const ok = await sendReorderTemplate(r.phone, r.firstName, imageUrl)
    if (ok) {
      sent++
      // Upsert conversation and log the outgoing message
      const waPhone = r.phone.replace(/^\+/, '')
      const { data } = await supabase
        .from('wa_conversations')
        .upsert(
          { contact_phone: waPhone, contact_name: r.fullName, last_message_at: now, status: 'open' },
          { onConflict: 'contact_phone' }
        )
        .select('id')
        .single()
      if (data?.id) {
        await insertWaOutgoingMessage(data.id, '📢 Plantilla: Reordenar')
      }
    } else {
      failed++
    }
  }

  return { sent, failed }
}

export async function sendTextTemplateBroadcast(
  templateId: 'reorder_lastreminder' | 'newcliente_lastreminder',
  recipients: { phone: string; firstName: string; fullName: string }[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0; let failed = 0
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const sender = templateId === 'reorder_lastreminder' ? sendReorderLastReminder : sendNewClienteLastReminder
  const label = templateId === 'reorder_lastreminder' ? '📢 Plantilla: Recordatorio reorden' : '📢 Plantilla: Nuevo cliente'

  for (const r of recipients) {
    const ok = await sender(r.phone, r.firstName)
    if (ok) {
      sent++
      const waPhone = r.phone.replace(/^\+/, '')
      const { data } = await supabase
        .from('wa_conversations')
        .upsert({ contact_phone: waPhone, last_message_at: now, status: 'open' }, { onConflict: 'contact_phone' })
        .select('id').single()
      if (data?.id) await insertWaOutgoingMessage(data.id, label)
    } else { failed++ }
  }
  return { sent, failed }
}

export async function listTemplateImages(): Promise<{ name: string; url: string }[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).list('', {
    limit: 100,
    sortBy: { column: 'created_at', order: 'asc' },
  })
  if (error || !data) return []
  return data
    .filter(f => f.name && !f.name.startsWith('.'))
    .map(f => ({
      name: f.name,
      url: admin.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
    }))
}

export async function uploadTemplateImage(
  filename: string,
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'Sin archivo' }

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) return { error: error.message }
  const { data } = admin.storage.from(BUCKET).getPublicUrl(filename)
  return { url: data.publicUrl }
}
