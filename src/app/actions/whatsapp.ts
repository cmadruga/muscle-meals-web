'use server'

import { sendReorderTemplate } from '@/lib/whatsapp'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'whatsapp-templates'

export async function sendReorderBroadcast(
  recipients: { phone: string; firstName: string }[],
  imageUrl: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const ok = await sendReorderTemplate(r.phone, r.firstName, imageUrl)
    if (ok) sent++
    else failed++
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
