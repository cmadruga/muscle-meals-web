import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

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
          if (message.type !== 'text') continue

          const contactPhone = message.from
          const contactName = value.contacts?.[0]?.profile?.name ?? null
          const msgBody = message.text?.body ?? ''
          const waMsgId = message.id
          const sentAt = new Date(parseInt(message.timestamp) * 1000).toISOString()

          // Upsert conversación (función SQL atómica)
          const { data: convId, error: rpcErr } = await supabase.rpc('wa_upsert_conversation', {
            p_phone: contactPhone,
            p_name: contactName,
            p_time: sentAt,
          })

          if (rpcErr || !convId) {
            console.error('❌ wa_upsert_conversation error:', rpcErr)
            continue
          }

          // Insertar mensaje (ignorar duplicados por wa_msg_id)
          const { error: msgErr } = await supabase
            .from('wa_messages')
            .upsert(
              { conversation_id: convId, direction: 'in', body: msgBody, wa_msg_id: waMsgId, sent_at: sentAt },
              { onConflict: 'wa_msg_id', ignoreDuplicates: true }
            )

          if (msgErr) console.error('❌ Error insertando mensaje WA:', msgErr)
          else console.log(`📥 WA [${contactPhone}] ${msgBody.slice(0, 60)}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error procesando webhook WA:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
