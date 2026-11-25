import { Inter, Jost } from 'next/font/google'

/** Titres : sans-serif géométrique fine, proche du logo. Texte : Inter. */
export const display = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-display-family',
  display: 'swap',
})

export const body = Inter({
  subsets: ['latin'],
  variable: '--font-body-family',
  display: 'swap',
})
