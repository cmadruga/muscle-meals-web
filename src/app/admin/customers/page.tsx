import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'

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
  orders: CustomerOrder[]
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

  const { data: raw } = await admin
    .from('customers')
    .select(`
      id, full_name, email, phone, address, user_id, created_at,
      orders(
        id, order_number, created_at, total_amount, status,
        order_items(id, qty, unit_price, package_instance_id, meals:meal_id(name), sizes:size_id(name))
      )
    `)
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })

  const customers: CustomerRow[] = (raw ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    user_id: c.user_id,
    created_at: c.created_at,
    orders: (c.orders ?? [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
      })),
  }))

  return <CustomersClient customers={customers} highlightId={highlightId} />
}
