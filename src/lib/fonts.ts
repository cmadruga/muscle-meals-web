import { Big_Shoulders, Barlow, Barlow_Condensed } from 'next/font/google'

/**
 * Big Shoulders — familia display condensed con soporte completo de acentos (á, é, í, ó, ú, ñ).
 * Visualmente muy similar a Franchise pero disponible en Google Fonts y auto-hosteada.
 * Nota: en el API de next/font esta familia se llama Big_Shoulders (sin _Display).
 */
export const bigShoulders = Big_Shoulders({
  subsets: ['latin', 'latin-ext'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
})

/**
 * Barlow — body text, labels, textos UI
 */
export const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

/**
 * Barlow Condensed — variante compacta para tabs, badges, botones secundarios
 */
export const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-condensed',
  display: 'swap',
})
