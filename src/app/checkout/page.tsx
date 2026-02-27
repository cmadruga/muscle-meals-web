import CheckoutClient from './CheckoutClient'
import { getActivePickupSpots } from '@/lib/db/pickup-spots'

export default async function CheckoutPage() {
  const pickupSpots = await getActivePickupSpots()
  return <CheckoutClient pickupSpots={pickupSpots} />
}
