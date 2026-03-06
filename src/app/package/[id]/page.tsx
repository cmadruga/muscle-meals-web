import { getActiveMealsWithRecipes } from '@/lib/db/meals'
import { getGlobalSizes, getCustomerSizes } from '@/lib/db/sizes'
import { getCustomerByUserId } from '@/lib/db/customers'
import { createClient } from '@/lib/supabase/server'
import type { Size } from '@/lib/types'
import PackageClient from './PackageClient'

/**
 * Server Component para la página de paquete
 * Carga meals + sizes; la config del paquete viene de la constante PACKAGE
 */
export default async function PackagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerSizes: Size[] = []
  if (user) {
    const customer = await getCustomerByUserId(user.id)
    if (customer) {
      customerSizes = await getCustomerSizes(customer.id)
    }
  }

  const [meals, sizes] = await Promise.all([
    getActiveMealsWithRecipes(),
    getGlobalSizes()
  ])

  return <PackageClient meals={meals} sizes={sizes} customerSizes={customerSizes} />
}

export const metadata = {
  title: `Paquete - Muscle Meals`,
  description: `Arma tu paquete con mínimo 5 platillos`
}
