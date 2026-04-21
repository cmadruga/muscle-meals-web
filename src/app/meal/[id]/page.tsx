import { notFound } from 'next/navigation'
import { getMealById, getMealsBasic } from '@/lib/db/meals'
import { getGlobalSizes, getCustomerSizes } from '@/lib/db/sizes'
import { getCustomerByUserId } from '@/lib/db/customers'
import { createClient } from '@/lib/supabase/server'
import { getSalesEnabled } from '@/lib/db/settings'
import type { Size } from '@/lib/types'
import MealClient from './MealClient'

interface MealPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Server Component para la página de meal individual
 */
export default async function MealPage({ params, searchParams }: MealPageProps) {
  const { id } = await params
  const { sizeId } = await searchParams as { sizeId?: string }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerSizes: Size[] = []
  if (user) {
    const customer = await getCustomerByUserId(user.id)
    if (customer) {
      customerSizes = await getCustomerSizes(customer.id)
    }
  }

  const [meal, sizes, allMeals, salesEnabled] = await Promise.all([
    getMealById(id),
    getGlobalSizes(),
    getMealsBasic(),
    getSalesEnabled(),
  ])

  if (!meal) {
    notFound()
  }

  // Filtrar otros meals (excluir el actual) para sugerencias
  const suggestedMeals = allMeals.filter(m => m.id !== meal.id)

  return <MealClient meal={meal} sizes={sizes} customerSizes={customerSizes} suggestedMeals={suggestedMeals} initialSizeId={sizeId} isAuthenticated={!!user} salesEnabled={salesEnabled} />
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params }: MealPageProps) {
  const { id } = await params
  const meal = await getMealById(id)

  if (!meal) {
    return { title: 'Platillo no encontrado' }
  }

  return {
    title: `${meal.name} - Muscle Meals`,
    description: meal.description || `Ordena ${meal.name}`
  }
}
