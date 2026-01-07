/**
 * Configuración centralizada del tema de la marca Muscle Meals
 */

export const colors = {
  orange: '#FE9739',
  black: '#1A1A1A',
  white: '#FFFFFF',
  grayDark: '#2A2A2A',
  grayLight: '#3A3A3A',
  // Colores secundarios para textos y elementos UI
  textMuted: '#888',
  textSecondary: '#aaa',
  textTertiary: '#666',
  textDisabled: '#444',
  error: '#ef4444'
} as const

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 42
} as const

export const maxWidth = {
  sm: 600,
  md: 800,
  lg: 1200
} as const
