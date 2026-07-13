import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'

export type SizeOption = { id: string; name: string; is_main: boolean; customer_id: string | null }

export type CustomerOrder = {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: string
  items: {
    qty: number
    unit_price: number
    meal_name: string
    size_name: string
    package_instance_id: string | null
  }[]
}

export type CustomerRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  user_id: string | null
  created_at: string
  is_member: boolean
  membership_weeks_left: number
  membership_qty: number | null
  membership_size_id: string | null
  orders: CustomerOrder[]
  guestOrders: CustomerOrder[]  // orders made before creating account
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')
  if (!adminToken) redirect('/admin/login')

  const params = await searchParams
  const highlightId = params.id ?? null

  const admin = createAdminClient()

  const [{ data: raw }, { data: sizesRaw }, { data: guestRaw }] = await Promise.all([
    admin
      .from('customers')
      .select(`
        id, full_name, email, phone, address, user_id, created_at,
        is_member, membership_weeks_left, membership_qty, membership_size_id,
        orders(
          id, order_number, created_at, total_amount, status,
          order_items(id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name))
        )
      `)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false }),
    admin
      .from('sizes')
      .select('id, name, is_main, customer_id')
      .order('name'),
    admin
      .from('customers')
      .select(`
        id, full_name, phone, address, created_at,
        orders(
          id, order_number, created_at, total_amount, status,
          order_items(id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name))
        )
      `)
      .is('user_id', null)
      .not('phone', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  function mapOrders(raw: any[]): CustomerOrder[] {
    return raw
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        total_amount: o.total_amount,
        status: o.status,
        items: (o.order_items ?? []).map((i: any) => ({
          qty: i.qty,
          unit_price: i.unit_price,
          meal_name: i.meals?.name ?? 'Platillo',
          size_name: i.sizes?.name ?? '',
          package_instance_id: i.package_instance_id ?? null,
        })),
      }))
  }

  const customers: CustomerRow[] = (raw ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    user_id: c.user_id,
    created_at: c.created_at,
    is_member: c.is_member ?? false,
    membership_weeks_left: c.membership_weeks_left ?? 0,
    membership_qty: c.membership_qty ?? null,
    membership_size_id: c.membership_size_id ?? null,
    orders: mapOrders(c.orders ?? []),
    guestOrders: [],  // filled below after guestRaw is processed
  }))

  // Convert any Mexican phone variant to E.164 (+521XXXXXXXXXX)
  const toE164 = (p: string | null): string | null => {
    if (!p) return null
    const d = p.replace(/\D/g, '')
    if (d.length === 10) return `+521${d}`
    if (d.length === 12 && d.startsWith('52')) return `+521${d.slice(2)}`
    if (d.length === 13 && d.startsWith('521')) return `+${d}`
    return p
  }

  // Normalize to last 10 digits for dedup matching
  const normalizePhone = (p: string) => { const d = p.replace(/\D/g, ''); return d.slice(-10) }

  // Apply E.164 to all account customers
  for (const c of customers) { c.phone = toE164(c.phone) }

  // Phones of customers who already have an account — exclude these from guests
  const accountPhones = new Set(customers.map(c => c.phone ? normalizePhone(c.phone) : '').filter(Boolean))

  // Collect pre-account orders for customers who later created an account
  const preAccountOrders = new Map<string, any[]>()
  const guestMap = new Map<string, any[]>()

  for (const row of guestRaw ?? []) {
    if (!row.phone) continue
    const key = normalizePhone(row.phone)
    if (accountPhones.has(key)) {
      if (!preAccountOrders.has(key)) preAccountOrders.set(key, [])
      preAccountOrders.get(key)!.push(...(row.orders ?? []))
    } else {
      if (!guestMap.has(key)) guestMap.set(key, [])
      guestMap.get(key)!.push(row)
    }
  }

  // Attach pre-account orders to their account customer
  for (const c of customers) {
    if (!c.phone) continue
    const key = normalizePhone(c.phone)
    c.guestOrders = mapOrders(preAccountOrders.get(key) ?? [])
  }

  const guestCustomers: CustomerRow[] = []
  for (const [phoneKey, rows] of guestMap) {
    rows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const latest = rows[0]
    const allOrders = mapOrders(rows.flatMap((r: any) => r.orders ?? []))
    if (allOrders.length === 0) continue  // skip guests with no orders at all
    guestCustomers.push({
      id: `guest_${phoneKey}`,
      full_name: latest.full_name,
      email: '',
      phone: toE164(latest.phone),
      address: latest.address ?? null,
      user_id: null,
      created_at: allOrders[0]?.created_at ?? latest.created_at,
      is_member: false,
      membership_weeks_left: 0,
      membership_qty: null,
      membership_size_id: null,
      orders: allOrders,
      guestOrders: [],
    })
  }

  const sizes: SizeOption[] = (sizesRaw ?? []).map((s: any) => ({ id: s.id, name: s.name, is_main: s.is_main ?? false, customer_id: s.customer_id ?? null }))

  return <CustomersClient customers={customers} guestCustomers={guestCustomers} sizes={sizes} highlightId={highlightId} />
}
