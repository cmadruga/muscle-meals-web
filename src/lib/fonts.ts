import { Big_Shoulders, Barlow, Barlow_Condensed } from 'next/font/google'

/**
 * Big Shoulders Display — titulares, botones, etiquetas uppercase
 * Equivalente a Franchise pero disponible en Google Fonts y auto-hosteada.
 */
export const bigShoulders = Big_Shoulders({
  subsets: ['latin'],
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
