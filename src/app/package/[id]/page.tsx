import { notFound } from 'next/navigation'
import { getPackageById } from '@/lib/db/packages'
import { getActiveMealsWithRecipes } from '@/lib/db/meals'
import { getGlobalSizes, getCustomerSizes } from '@/lib/db/sizes'
import { getCustomerByUserId } from '@/lib/db/customers'
import { createClient } from '@/lib/supabase/server'
import type { Size } from '@/lib/types'
import PackageClient from './PackageClient'

interface PackagePageProps {
  params: Promise<{ id: string }>
}

/**
 * Server Component para la página de paquete
 * Carga paquete + meals + sizes
 */
export default async function PackagePage({ params }: PackagePageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerSizes: Size[] = []
  if (user) {
    const customer = await getCustomerByUserId(user.id)
    if (customer) {
      customerSizes = await getCustomerSizes(customer.id)
    }
  }

  // Fetch paralelo
  const [pkg, meals, sizes] = await Promise.all([
    getPackageById(id),
    getActiveMealsWithRecipes(),
    getGlobalSizes()
  ])

  if (!pkg) {
    notFound()
  }

  return <PackageClient pkg={pkg} meals={meals} sizes={sizes} customerSizes={customerSizes} />
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params }: PackagePageProps) {
  const { id } = await params
  const pkg = await getPackageById(id)

  if (!pkg) {
    return { title: 'Paquete no encontrado' }
  }

  return {
    title: `${pkg.name} - Muscle Meals`,
    description: `Selecciona tus ${pkg.meals_included} comidas del paquete ${pkg.name}`
  }
}
