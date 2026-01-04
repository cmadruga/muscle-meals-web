import { notFound } from 'next/navigation'
import { getPackageById } from '@/lib/db/packages'
import { getActiveDishes } from '@/lib/db/products'
import PackageClient from './PackageClient'

interface PackagePageProps {
  params: Promise<{ id: string }>
}

/**
 * Server Component para la página de paquete
 * 
 * RESPONSABILIDADES:
 * - Fetch de datos en el servidor (más rápido, SEO-friendly)
 * - Manejo de errores (404 si no existe el paquete)
 * - Pasar datos al Client Component
 * 
 * VENTAJAS DE ESTE PATRÓN:
 * 1. Los datos se cargan en el servidor, no hay loading spinners
 * 2. El Client Component recibe datos ya listos (mejor UX)
 * 3. Queries de Supabase ejecutadas server-side (más seguro)
 * 4. Separación clara: Server = data, Client = interactividad
 */
export default async function PackagePage({ params }: PackagePageProps) {
  const { id } = await params

  // Fetch paralelo para mejor performance
  const [pkg, dishes] = await Promise.all([
    getPackageById(id),
    getActiveDishes()
  ])

  // Si el paquete no existe, mostrar 404
  if (!pkg) {
    notFound()
  }

  return <PackageClient pkg={pkg} dishes={dishes} />
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
    description: `Selecciona tus ${pkg.meals_included} platillos del paquete ${pkg.name}`
  }
}
