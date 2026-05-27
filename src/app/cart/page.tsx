import { getCriticalPeriodConfig } from '@/lib/db/settings'
import { isInCutoffWindow } from '@/lib/utils/delivery'
import CartClient from './CartClient'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const criticalConfig = await getCriticalPeriodConfig()
  const inCutoff = isInCutoffWindow(criticalConfig)
  return <CartClient inCutoff={inCutoff} />
}
