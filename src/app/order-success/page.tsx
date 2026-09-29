import { Suspense } from 'react'
import OrderStatusCard from '@/components/OrderStatusCard'

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string; value?: string }>
}) {
  const { our_order_id, value } = await searchParams
  return (
    <OrderStatusCard
      status="success"
      orderId={our_order_id ?? null}
      value={Number(value ?? 0)}
    />
  )
}

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ our_order_id?: string; value?: string }>
}) {
  return (
    <Suspense fallback={<OrderStatusCard status="success" />}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  )
}
