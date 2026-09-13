import { Suspense } from 'react'
import OrderStatusCard from '@/components/OrderStatusCard'

async function PendingContent({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string }>
}) {
  const { our_order_id } = await searchParams
  return <OrderStatusCard status="pending" orderId={our_order_id ?? null} />
}

export default function OrderPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string }>
}) {
  return (
    <Suspense fallback={<OrderStatusCard status="pending" />}>
      <PendingContent searchParams={searchParams} />
    </Suspense>
  )
}
