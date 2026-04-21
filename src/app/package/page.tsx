import { getActiveMealsWithRecipes } from '@/lib/db/meals'
import { getGlobalSizes, getCustomerSizes } from '@/lib/db/sizes'
import { getCustomerByUserId } from '@/lib/db/customers'
import { getAllIngredients } from '@/lib/db/ingredients'
import { createClient } from '@/lib/supabase/server'
import { getSalesEnabled } from '@/lib/db/settings'
import type { Size } from '@/lib/types'
import PackageClient from './PackageClient'

/**
 * Server Component para la página de paquete
 * Carga meals + sizes; la config del paquete viene de la constante PACKAGE
 */
export default async function PackagePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit: editInstanceId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerSizes: Size[] = []
  if (user) {
    const customer = await getCustomerByUserId(user.id)
    if (customer) {
      customerSizes = await getCustomerSizes(customer.id)
    }
  }

  const [meals, sizes, allIngredients, salesEnabled] = await Promise.all([
    getActiveMealsWithRecipes(),
    getGlobalSizes(),
    getAllIngredients(),
    getSalesEnabled(),
  ])

  const proIngredients = allIngredients.filter(i => i.type === 'pro')
  const carbIngredients = allIngredients.filter(i => i.type === 'carb')

  return <PackageClient meals={meals} sizes={sizes} customerSizes={customerSizes} editInstanceId={editInstanceId} proIngredients={proIngredients} carbIngredients={carbIngredients} isAuthenticated={!!user} salesEnabled={salesEnabled} />
}

export const metadata = {
  title: `Paquete - Muscle Meals`,
  description: `Arma tu paquete con mínimo 5 platillos`
}
