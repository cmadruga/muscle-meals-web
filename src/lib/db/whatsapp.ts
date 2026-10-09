import { createAdminClient } from '@/lib/supabase/admin'

export type WaConversation = {
  id: string
  contact_phone: string
  last_message_at: string | null
  unread_count: number
  status: string
  created_at: string
  customer_id: string | null
  customer_name: string | null  // resolved from customers DB, never from WA profile
}

export type WaMessage = {
  id: string
  conversation_id: string
  direction: 'in' | 'out'
  body: string | null
  wa_msg_id: string | null
  sent_at: string
}

export async function getWaConversations(): Promise<WaConversation[]> {
  const supabase = createAdminClient()
  const [{ data: convs }, { data: customerRows }] = await Promise.all([
    supabase.from('wa_conversations').select('*').order('last_message_at', { ascending: false }),
    supabase.from('customers').select('id, full_name, phone').not('phone', 'is', null),
  ])
  const phoneMap = new Map<string, { id: string; full_name: string }>()
  ;(customerRows ?? []).forEach((c: { id: string; full_name: string; phone: string }) => {
    const last10 = c.phone.replace(/\D/g, '').slice(-10)
    if (last10.length === 10) phoneMap.set(last10, { id: c.id, full_name: c.full_name })
  })
  return ((convs ?? []) as any[]).map(conv => {
    const match = phoneMap.get(conv.contact_phone.replace(/\D/g, '').slice(-10)) ?? null
    return {
      id: conv.id,
      contact_phone: conv.contact_phone,
      last_message_at: conv.last_message_at,
      unread_count: conv.unread_count,
      status: conv.status,
      created_at: conv.created_at,
      customer_id: match?.id ?? null,
      customer_name: match?.full_name ?? null,
    }
  })
}

export async function getWaMessages(convId: string): Promise<WaMessage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('wa_messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('sent_at', { ascending: true })
  return (data as WaMessage[]) ?? []
}

export async function markWaConversationRead(convId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('wa_conversations').update({ unread_count: 0 }).eq('id', convId)
}

export async function insertWaOutgoingMessage(convId: string, body: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await Promise.all([
    supabase.from('wa_messages').insert({ conversation_id: convId, direction: 'out', body, sent_at: now }),
    supabase.from('wa_conversations').update({ last_message_at: now }).eq('id', convId),
  ])
}
