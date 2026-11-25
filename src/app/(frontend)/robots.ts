import type { MetadataRoute } from 'next'

import { isDemo } from '@/lib/demo'
import { siteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  // en démo, on ne laisse pas les moteurs indexer des données fictives
  if (isDemo()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/bar', '/t/', '/compte', '/connexion', '/reserver/confirmation', '/reserver/annuler', '/api'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
