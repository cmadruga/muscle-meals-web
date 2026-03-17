import type { RecipeIngredient } from './ingredient'

/**
 * Tipo de receta
 */
export type RecipeType = 'main' | 'sub'

export interface SectionVesselConfig {
  vessel_id: string
  vessel_name: string
  max_gr: number
  gr_per_cup?: number
}

export interface RecipeVesselConfig {
  pro?: SectionVesselConfig
  carb?: SectionVesselConfig
  veg?: SectionVesselConfig
}

/**
 * Receta base
 */
export interface Recipe {
  id: string
  name: string
  description: string | null
  type: RecipeType
  ingredients: RecipeIngredient[]
  portions: number
  created_at: string
  vessel_config?: RecipeVesselConfig | null
}

/**
 * Receta básica para UI
 */
export interface RecipeBasic {
  id: string
  name: string
  type: RecipeType
}
