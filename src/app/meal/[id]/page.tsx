import { notFound } from 'next/navigation'
import { getMealById, getMealsBasic } from '@/lib/db/meals'
import { getMainSizes } from '@/lib/db/sizes'
import MealClient from './MealClient'

interface MealPageProps {
  params: Promise<{ id: string }>
}

/**
 * Server Component para la página de meal individual
 */
export default async function MealPage({ params }: MealPageProps) {
  const { id } = await params

  const [meal, sizes, allMeals] = await Promise.all([
    getMealById(id),
    getMainSizes(),
    getMealsBasic()
  ])

  if (!meal) {
    notFound()
  }

  // Filtrar otros meals (excluir el actual) para sugerencias
  const suggestedMeals = allMeals.filter(m => m.id !== meal.id)

  return <MealClient meal={meal} sizes={sizes} suggestedMeals={suggestedMeals} />
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
