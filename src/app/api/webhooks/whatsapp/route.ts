import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToAll } from '@/lib/push'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const MEDIA_BUCKET = 'wa-media'

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/opus': 'opus', 'audio/aac': 'aac',
  'video/mp4': 'mp4', 'video/3gpp': '3gp',
  'application/pdf': 'pdf',
}

const TYPE_FALLBACK_EXT: Record<string, string> = {
  image: 'jpg', sticker: 'webp', audio: 'ogg', video: 'mp4', document: 'bin',
}

// GET: verificación del webhook que Meta envía al configurarlo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verificado')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('❌ WhatsApp webhook: token inválido')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Descarga un media de Meta y lo sube a Supabase Storage; devuelve la URL pública
async function storeMedia(
  supabase: ReturnType<typeof createAdminClient>,
  mediaId: string,
  mimeType: string | null,
  msgType: string,
): Promise<string | null> {
  if (!WA_TOKEN) return null
  try {
    // 1. Obtener la URL de descarga temporal de Meta
    const metaRes = await fetch(`https://graph.facebook.com/v23.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    })
    if (!metaRes.ok) { console.error('❌ Meta media info error:', metaRes.status); return null }
    const metaJson = await metaRes.json()
    const downloadUrl: string = metaJson.url
    const resolvedMime: string = mimeType ?? metaJson.mime_type ?? ''
    if (!downloadUrl) return null

    // 2. Descargar el archivo binario
    const fileRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    })
    if (!fileRes.ok) { console.error('❌ Meta media download error:', fileRes.status); return null }
    const buffer = await fileRes.arrayBuffer()

    // 3. Subir a Supabase Storage
    const ext = MIME_EXT[resolvedMime] ?? TYPE_FALLBACK_EXT[msgType] ?? 'bin'
    const path = `${msgType}/${mediaId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, buffer, { contentType: resolvedMime || 'application/octet-stream', upsert: true })
    if (upErr) { console.error('❌ Storage upload error:', upErr); return null }

    const { data: { publicUrl } } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    return publicUrl
  } catch (err) {
    console.error('❌ storeMedia exception:', err)
    return null
  }
}

// Tipos de mensaje que llevan un campo de media con .id
const MEDIA_TYPES = new Set(['image', 'sticker', 'audio', 'video', 'document'])

// Extrae el cuerpo textual de cualquier tipo de mensaje WA
function extractBody(message: Record<string, unknown>): string {
  switch (message.type) {
    case 'text':    return (message.text as Record<string, string>)?.body ?? ''
    case 'image': {
      const cap = (message.image as Record<string, string>)?.caption
      return cap ? `📷 ${cap}` : '📷 Imagen'
    }
    case 'video': {
      const cap = (message.video as Record<string, string>)?.caption
      return cap ? `📹 ${cap}` : '📹 Video'
    }
    case 'audio':    return '🎵 Audio'
    case 'sticker':  return '🎭 Sticker'
    case 'reaction': return (message.reaction as Record<string, string>)?.emoji ?? '👍'
    case 'document': {
      const doc = message.document as Record<string, string>
      return doc?.filename ?? doc?.caption ?? '📎 Documento'
    }
    case 'location': return '📍 Ubicación'
    default:         return `[${message.type}]`
  }
}

// POST: mensajes entrantes de Meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue
        const value = change.value

        for (const message of value.messages ?? []) {
          const msgType = message.type as string
          const contactPhone = message.from as string
          const msgBody = extractBody(message as Record<string, unknown>)
          const waMsgId = message.id as string
          const sentAt = new Date(parseInt(message.timestamp) * 1000).toISOString()

          // Descargar y guardar media si aplica
          let mediaUrl: string | null = null
          if (MEDIA_TYPES.has(msgType)) {
            const mediaObj = (message[msgType] as Record<string, string> | undefined)
            const mediaId = mediaObj?.id
            const mimeType = mediaObj?.mime_type ?? null
            if (mediaId) {
              mediaUrl = await storeMedia(supabase, mediaId, mimeType, msgType)
            }
          }

          // Buscar conversación existente
          const { data: existing } = await supabase
            .from('wa_conversations')
            .select('id, unread_count')
            .eq('contact_phone', contactPhone)
            .single()

          let convId: string | null = null

          if (existing) {
            await supabase
              .from('wa_conversations')
              .update({ last_message_at: sentAt, status: 'open', unread_count: (existing.unread_count ?? 0) + 1 })
              .eq('id', existing.id)
            convId = existing.id
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('wa_conversations')
              .insert({ contact_phone: contactPhone, last_message_at: sentAt, unread_count: 1, status: 'open' })
              .select('id')
              .single()
            if (insertErr) console.error('❌ Error creando conversación WA:', insertErr)
            convId = inserted?.id ?? null
          }

          if (!convId) {
            console.error('❌ No se pudo obtener convId para:', contactPhone)
            continue
          }

          const { error: msgErr } = await supabase
            .from('wa_messages')
            .upsert(
              {
                conversation_id: convId,
                direction: 'in',
                body: msgBody,
                wa_msg_id: waMsgId,
                sent_at: sentAt,
                media_url: mediaUrl,
                media_type: mediaUrl ? msgType : null,
              },
              { onConflict: 'wa_msg_id', ignoreDuplicates: true }
            )

          if (msgErr) {
            console.error('❌ Error insertando mensaje WA:', msgErr)
          } else {
            console.log(`📥 WA [${contactPhone}] (${msgType})${mediaUrl ? ' +media' : ''} ${msgBody.slice(0, 60)}`)
            // Notificación push al admin
            const displayPhone = contactPhone.slice(-10)
            const pushBody = msgType === 'text' ? msgBody.slice(0, 80) : `(${msgType}) ${msgBody}`
            await sendPushToAll({
              title: `WhatsApp · ${displayPhone}`,
              body: pushBody,
              tag: `wa-${contactPhone}`,
              url: '/admin/inbox',
            }).catch(e => console.error('Push error:', e))
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error procesando webhook WA:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
