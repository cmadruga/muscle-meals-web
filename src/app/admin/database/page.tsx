import { colors } from '@/lib/theme'
import { getAllMeals } from '@/lib/db/meals'
import { getAllIngredients } from '@/lib/db/ingredients'
import { getAllRecipes } from '@/lib/db/recipes'
import { getAllMaterials } from '@/lib/db/materials'
import { getAllPincheVessels } from '@/lib/db/pinche-vessels'
import { getMainSizes } from '@/lib/db/sizes'
import MealsTab from './MealsTab'
import IngredientesTab from './IngredientesTab'
import RecetasTab from './RecetasTab'
import MaterialesTab from './MaterialesTab'
import PincheTab from './PincheTab'
import Link from 'next/link'

const TABS = [
  { id: 'materiales', label: 'Materiales' },
  { id: 'pinche', label: 'Pinche' },
  { id: 'ingredientes', label: 'Ingredientes' },
  { id: 'recetas', label: 'Recetas' },
  { id: 'meals', label: 'Platillos' },
] as const

type Tab = (typeof TABS)[number]['id']

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab: Tab =
    (params.tab as Tab | undefined) && TABS.some((t) => t.id === params.tab)
      ? (params.tab as Tab)
      : 'meals'

  const [meals, ingredients, recipes, materials, vessels, mainSizes] = await Promise.all([
    activeTab === 'meals' ? getAllMeals() : Promise.resolve(null),
    activeTab === 'ingredientes' || activeTab === 'recetas' || activeTab === 'meals' ? getAllIngredients() : Promise.resolve(null),
    activeTab === 'recetas' || activeTab === 'meals' ? getAllRecipes() : Promise.resolve(null),
    activeTab === 'materiales' ? getAllMaterials() : Promise.resolve(null),
    activeTab === 'pinche' ? getAllPincheVessels() : Promise.resolve(null),
    activeTab === 'meals' ? getMainSizes() : Promise.resolve(null),
  ])

  return (
    <div>
      <h1 style={{ color: colors.white, fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        Base de Datos
      </h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28 }}>
        Gestión de platillos, ingredientes y recetas
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.grayLight}`, marginBottom: 28 }}>
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/database?tab=${tab.id}`}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              color: activeTab === tab.id ? colors.orange : colors.textMuted,
              borderBottom: activeTab === tab.id ? `2px solid ${colors.orange}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'meals' && meals && recipes && ingredients && mainSizes && <MealsTab meals={meals} recipes={recipes} ingredients={ingredients} mainSizes={mainSizes} />}
      {activeTab === 'ingredientes' && ingredients && <IngredientesTab ingredients={ingredients} />}
      {activeTab === 'recetas' && recipes && ingredients && <RecetasTab recipes={recipes} ingredients={ingredients} />}
      {activeTab === 'materiales' && materials && <MaterialesTab materials={materials} />}
      {activeTab === 'pinche' && vessels && <PincheTab vessels={vessels} />}
    </div>
  )
}
