import LandingClient from './LandingClient'
import { getMealsBasic } from '@/lib/db/meals'

export default async function Home() {
  const meals = await getMealsBasic()
  return <LandingClient meals={meals} />
}
