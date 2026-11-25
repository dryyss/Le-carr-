import type { MetadataRoute } from 'next'

import { getUpcomingEvents } from '@/lib/queries'
import { siteUrl } from '@/lib/site-url'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/carte', '/reserver', '/evenements', '/privatisation', '/mentions-legales', '/confidentialite']
  const events = await getUpcomingEvents(50).catch(() => [])
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...events.map((e) => ({ url: `${siteUrl}/evenements/${e.slug}`, lastModified: e.updatedAt, priority: 0.6 })),
  ]
}
