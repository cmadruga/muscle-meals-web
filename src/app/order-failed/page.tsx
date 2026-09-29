import { Suspense } from 'react'
import OrderStatusCard from '@/components/OrderStatusCard'

async function FailedContent({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string }>
}) {
  const { our_order_id } = await searchParams
  return <OrderStatusCard status="failed" orderId={our_order_id ?? null} />
}

export default function OrderFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string }>
}) {
  return (
    <Suspense fallback={<OrderStatusCard status="failed" />}>
      <FailedContent searchParams={searchParams} />
    </Suspense>
  )
}
