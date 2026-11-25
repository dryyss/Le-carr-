import { cache } from 'react'

import type { Event, Media, MenuCategory, MenuItem } from '@/payload-types'

import { getPayloadClient } from './payload'

export type MenuSection = { category: MenuCategory; items: MenuItem[] }

/** Carte publique : catégories visibles et produits disponibles, dans l'ordre. */
export const getMenu = cache(async (): Promise<MenuSection[]> => {
  const payload = await getPayloadClient()
  const [cats, items] = await Promise.all([
    payload.find({ collection: 'menu-categories', where: { active: { equals: true } }, sort: 'order', limit: 100, depth: 0, pagination: false }),
    payload.find({ collection: 'menu-items', where: { available: { equals: true } }, sort: 'order', limit: 1000, depth: 1, pagination: false }),
  ])
  return cats.docs
    .map((category) => ({
      category,
      items: items.docs.filter((i) => (typeof i.category === 'object' ? i.category.id : i.category) === category.id),
    }))
    .filter((s) => s.items.length > 0)
})

export const getUpcomingEvents = cache(async (limit = 12): Promise<Event[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      published: { equals: true },
      or: [{ endsAt: { greater_than_equal: new Date().toISOString() } }, { startsAt: { greater_than_equal: new Date(Date.now() - 6 * 3600_000).toISOString() } }],
    },
    sort: 'startsAt',
    limit,
    depth: 1,
    overrideAccess: false,
  })
  return docs
})

export function mediaOf(m: number | Media | null | undefined): Media | null {
  return m && typeof m === 'object' && m.url ? m : null
}
