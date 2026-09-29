import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CartItem } from '@/lib/store/cart'
import type { ReorderCookie } from '@/lib/types/reorder'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → go to menu; MenuClient will show the login modal
  if (!user) {
    return NextResponse.redirect(new URL('/menu?reorder=1', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'))
  }

  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) {
    return NextResponse.redirect(new URL('/menu?reorder=1', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'))
  }

  // Get last non-admin order
  const { data: rawOrders } = await admin
    .from('orders')
    .select('*, order_items(*, meals:meal_id(name), sizes:size_id(name, price, package_price))')
    .eq('customer_id', customer.id)
    .not('status', 'in', '("extra","admin")')
    .order('created_at', { ascending: false })
    .limit(1)

  const lastOrder = rawOrders?.[0] ?? null
  type RawItem = {
    meal_id: string
    size_id: string
    qty: number
    unit_price: number
    package_instance_id?: string | null
    meals: { name: string } | null
    sizes: { name: string; price: number; package_price: number | null } | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems: RawItem[] = (lastOrder as any)?.order_items ?? []

  if (!lastOrder || rawItems.length === 0) {
    return NextResponse.redirect(new URL('/menu', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'))
  }

  // Check which meals are still active
  const allMealIds = [...new Set(rawItems.map(i => i.meal_id))]
  const { data: activeMeals } = await admin
    .from('meals')
    .select('id')
    .in('id', allMealIds)
    .eq('active', true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMealIdSet = new Set(activeMeals?.map((m: any) => m.id) ?? [])
  const activeItems  = rawItems.filter(i => activeMealIdSet.has(i.meal_id))
  const skippedItems = rawItems.filter(i => !activeMealIdSet.has(i.meal_id))

  // Build CartItem[] for available items.
  // Always reconstruct as individual items (no packageInstanceId) so the cart's
  // sidebar counts them in totalQty. The ≥5 package discount applies automatically.
  const items: CartItem[] = activeItems.map(i => ({
    mealId: i.meal_id,
    mealName: i.meals?.name ?? 'Platillo',
    sizeId: i.size_id,
    sizeName: i.sizes?.name ?? '',
    qty: i.qty,
    unitPrice: i.sizes?.price ?? i.unit_price,
    packagePrice: i.sizes?.package_price ?? undefined,
  }))

  const unavailable = skippedItems.map(i => ({
    name: i.meals?.name ?? 'Platillo',
    sizeName: i.sizes?.name ?? '',
    qty: i.qty,
  }))

  const cookieData: ReorderCookie = { items, unavailable }

  // Set cookie directly on the redirect response — this guarantees the
  // Set-Cookie header travels with the redirect even on client-side navigation.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'
  const redirectResponse = NextResponse.redirect(new URL('/menu?reorder=1', siteUrl))
  redirectResponse.cookies.set('mm_reorder', JSON.stringify(cookieData), {
    maxAge: 300,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,  // must be false so client JS (document.cookie) can read it
  })
  return redirectResponse
}
