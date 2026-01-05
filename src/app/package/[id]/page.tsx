import { notFound } from 'next/navigation'
import { getPackageById } from '@/lib/db/packages'
import { getActiveMeals } from '@/lib/db/meals'
import { getMainSizes } from '@/lib/db/sizes'
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

  // Fetch paralelo
  const [pkg, meals, sizes] = await Promise.all([
    getPackageById(id),
    getActiveMeals(),
    getMainSizes()
  ])

  if (!pkg) {
    notFound()
  }

  return <PackageClient pkg={pkg} meals={meals} sizes={sizes} />
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
