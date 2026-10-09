'use server'

import { sendWhatsAppText, sendReorderTemplate } from '@/lib/whatsapp'
import {
  getWaConversations,
  getWaMessages,
  markWaConversationRead,
  insertWaOutgoingMessage,
} from '@/lib/db/whatsapp'
import { createAdminClient } from '@/lib/supabase/admin'

export { getWaConversations, getWaMessages, markWaConversationRead }

// WA phones from webhook are like "5218112345678" — add + to get E.164
function toE164(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('52') && d.length >= 12) return `+${d}`
  if (d.length === 10) return `+521${d}`
  return `+${d}`
}

export async function sendWaReply(
  convId: string,
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const ok = await sendWhatsAppText(toE164(phone), text)
  if (!ok) return { ok: false, error: 'Error enviando mensaje' }
  await insertWaOutgoingMessage(convId, text)
  return { ok: true }
}

export async function sendWaTemplateSingle(
  convId: string,
  phone: string,
  firstName: string,
  imageUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const ok = await sendReorderTemplate(toE164(phone), firstName, imageUrl)
  if (!ok) return { ok: false, error: 'Error enviando plantilla' }
  await insertWaOutgoingMessage(convId, '📢 Plantilla: Reordenar')
  return { ok: true }
}

export async function createWaConvAndSendTemplate(
  phone: string,
  name: string,
  firstName: string,
  imageUrl: string,
): Promise<{ ok: boolean; convId?: string; error?: string }> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  // Normalize phone to WA format (digits, no +)
  const waPhone = toE164(phone).replace('+', '')
  const { data, error } = await supabase
    .from('wa_conversations')
    .upsert(
      { contact_phone: waPhone, contact_name: name, last_message_at: now, status: 'open' },
      { onConflict: 'contact_phone' }
    )
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando conversación' }
  const ok = await sendReorderTemplate(toE164(phone), firstName, imageUrl)
  if (!ok) return { ok: false, error: 'Error enviando plantilla' }
  await insertWaOutgoingMessage(data.id, '📢 Plantilla: Reordenar')
  return { ok: true, convId: data.id }
}

export type CustomerForWa = { id: string; full_name: string; phone: string | null; last_order_at: string | null; created_at: string }

function phoneToE164(p: string | null): string | null {
  if (!p) return null
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `+521${d}`
  if (d.length === 12 && d.startsWith('52')) return `+521${d.slice(2)}`
  if (d.length === 13 && d.startsWith('521')) return `+${d}`
  return p
}

const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10)

export async function getCustomersForWa(): Promise<CustomerForWa[]> {
  const supabase = createAdminClient()

  // Mirror the same queries as customers/page.tsx
  const [{ data: accountRaw }, { data: guestRaw }, { data: orderData }] = await Promise.all([
    supabase.from('customers').select('id, full_name, phone, created_at').not('user_id', 'is', null),
    supabase.from('customers').select('id, full_name, phone, created_at').is('user_id', null).not('phone', 'is', null),
    supabase.from('orders').select('customer_id, created_at').order('created_at', { ascending: false }),
  ])

  const latestOrder = new Map<string, string>()
  ;(orderData ?? []).forEach((o: { customer_id: string; created_at: string }) => {
    if (!latestOrder.has(o.customer_id)) latestOrder.set(o.customer_id, o.created_at)
  })

  // Account customers — same as customers page
  const accountPhones = new Set<string>()
  const rows: CustomerForWa[] = ((accountRaw ?? []) as any[]).map(c => {
    const phone = phoneToE164(c.phone)
    if (phone) accountPhones.add(normalizePhone(phone))
    return {
      id: c.id,
      full_name: c.full_name ?? '',
      phone,
      last_order_at: latestOrder.get(c.id) ?? null,
      created_at: c.created_at,
    }
  })

  // Guest customers — group by phone, skip if phone matches account, skip if no orders
  const guestMap = new Map<string, any[]>()
  for (const row of guestRaw ?? []) {
    if (!row.phone) continue
    const key = normalizePhone(row.phone)
    if (accountPhones.has(key)) continue  // already in account list
    if (!guestMap.has(key)) guestMap.set(key, [])
    guestMap.get(key)!.push(row)
  }

  for (const [phoneKey, gRows] of guestMap) {
    // Only include guests with at least 1 order (mirror page.tsx behavior)
    const guestIds = gRows.map((r: any) => r.id)
    const hasOrder = guestIds.some((id: string) => latestOrder.has(id))
    if (!hasOrder) continue

    gRows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const latest = gRows[0]
    // Find the most recent order across all guest rows with this phone
    const mostRecentOrder = guestIds
      .map((id: string) => latestOrder.get(id))
      .filter(Boolean)
      .sort()
      .pop() ?? null

    rows.push({
      id: `guest_${phoneKey}`,
      full_name: latest.full_name ?? '',
      phone: phoneToE164(latest.phone),
      last_order_at: mostRecentOrder ?? null,
      created_at: latest.created_at,
    })
  }

  // Sort by most-recent activity first (last order, or account creation as fallback)
  return rows.sort((a, b) => {
    const ta = new Date(a.last_order_at ?? a.created_at).getTime()
    const tb = new Date(b.last_order_at ?? b.created_at).getTime()
    return tb - ta
  })
}
