import type { Event, Media } from '@/payload-types'

import { mediaOf } from './queries'

/** Images par défaut des catégories de la carte (utilisées si aucune photo n'est uploadée dans Payload). */
const CATEGORY_IMAGES: Record<string, string> = {
  starters: '/images/menu/menu-starters.jpg',
  pates: '/images/menu/menu-pates.jpg',
  burgers: '/images/menu/menu-burgers.jpg',
  plats: '/images/menu/menu-plats.jpg',
  salades: '/images/menu/menu-salades.jpg',
  mocktails: '/images/menu/menu-mocktails.jpg',
  cocktails: '/images/menu/menu-cocktails.jpg',
  boissons: '/images/menu/menu-boissons.jpg',
  milkshakes: '/images/menu/menu-milkshakes.jpg',
  desserts: '/images/menu/menu-desserts.jpg',
}

/** Correspondances par mots-clés du nom de plat pour varier les photos au sein d'une même catégorie. */
const ITEM_KEYWORDS: [RegExp, string][] = [
  [/mozza|samoussa/i, '/images/menu/menu-mozzasticks.jpg'],
  [/nem|tempura|crevette/i, '/images/menu/menu-starters.jpg'],
  [/chicken|fish/i, '/images/menu/menu-chicken-burger.jpg'],
  [/burger/i, '/images/menu/menu-burgers.jpg'],
  [/steak à cheval|cheval/i, '/images/menu/menu-steak-cheval.jpg'],
  [/escalope|plat/i, '/images/menu/menu-plats.jpg'],
  [/p[aâ]tes|carbonara|foresti[eè]re|bolognaise/i, '/images/menu/menu-pates.jpg'],
  [/salade|burrata|c[eé]sar/i, '/images/menu/menu-salades.jpg'],
  [/virgin|ocean|amazonia|bahamas|ipanema|mocktail/i, '/images/menu/menu-mocktails.jpg'],
  [/mojito|sex on|pi[nñ]a|vodka|jack|cocktail/i, '/images/menu/menu-cocktails.jpg'],
  [/th[eé]|soft|red bull|heineken/i, '/images/menu/menu-boissons.jpg'],
  [/milkshake/i, '/images/menu/menu-milkshakes.jpg'],
  [/cr[eê]pe|gaufre/i, '/images/menu/menu-crepe.jpg'],
  [/tiramisu|daim|tarte/i, '/images/menu/menu-tiramisu.jpg'],
  [/fondant|chocolat/i, '/images/menu/menu-desserts.jpg'],
]

export function menuCategoryImage(slug: string | null | undefined): string {
  if (!slug) return '/images/site/ambiance-cuisine.jpg'
  return CATEGORY_IMAGES[slug] ?? '/images/site/ambiance-cuisine.jpg'
}

export function menuItemImage(
  title: string,
  categorySlug?: string | null,
  uploaded?: number | Media | null,
): string {
  const custom = mediaOf(uploaded)
  if (custom?.url) return custom.url
  for (const [pattern, src] of ITEM_KEYWORDS) {
    if (pattern.test(title)) return src
  }
  return menuCategoryImage(categorySlug)
}

export const AMBIANCE_FALLBACKS = [
  '/images/site/hero-lounge.jpg',
  '/images/site/ambiance-cuisine.jpg',
  '/images/site/ambiance-soiree.jpg',
] as const

export function eventCoverImage(type: Event['type'], uploaded?: number | Media | null): { url: string; alt: string } {
  const custom = mediaOf(uploaded)
  if (custom?.url) return { url: custom.url, alt: custom.alt }
  if (type === 'match') return { url: '/images/site/event-match.jpg', alt: 'Soirée match sur grand écran au Carré' }
  if (type === 'soiree_theme') return { url: '/images/site/event-soiree.jpg', alt: 'Ambiance soirée DJ au Carré' }
  return { url: '/images/site/ambiance-soiree.jpg', alt: 'Soirée lounge au Carré' }
}

export const DEFAULT_GALLERY: { url: string; alt: string; caption: string }[] = [
  { url: '/images/site/hero-lounge.jpg', alt: 'Banquettes et lumières tamisées du Carré', caption: 'Le lounge' },
  { url: '/images/menu/menu-burgers.jpg', alt: 'Burger mix gourmet et frites maison', caption: 'Burger mix' },
  { url: '/images/menu/menu-mocktails.jpg', alt: 'Mocktail signature Ocean Blue glacé', caption: 'Ocean Blue' },
  { url: '/images/menu/menu-pates.jpg', alt: 'Pâtes carbonara crémeuses au parmesan', caption: 'Pâtes carbonara' },
  { url: '/images/site/ambiance-soiree.jpg', alt: 'Table de mocktails frais en soirée', caption: 'Bar & mocktails' },
  { url: '/images/menu/menu-desserts.jpg', alt: 'Fondant au chocolat coulant et glace vanille', caption: 'Fondant chocolat' },
  { url: '/images/menu/menu-milkshakes.jpg', alt: 'Milkshake gourmand Oreo et chocolat', caption: 'Milkshake à composer' },
  { url: '/images/site/event-soiree.jpg', alt: 'Ambiance soirées et DJ au Carré', caption: 'Nos soirées' },
]
