import { getSettings } from '@/lib/payload'
import { siteUrl } from '@/lib/site-url'

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Données structurées BarOrPub (LocalBusiness) pour le référencement local. */
export async function JsonLd() {
  const s = await getSettings()
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    additionalType: 'https://schema.org/Restaurant',
    name: s.name,
    url: siteUrl,
    image: `${siteUrl}/brand/logo.png`,
    telephone: s.phone || undefined,
    servesCuisine: ['Burgers', 'Pâtes', 'Mocktails', 'Desserts'],
    priceRange: '€€',
    acceptsReservations: true,
    menu: `${siteUrl}/carte`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address?.street || undefined,
      postalCode: s.address?.postalCode || undefined,
      addressLocality: s.address?.city || undefined,
      addressCountry: 'FR',
    },
    geo: s.geo?.lat && s.geo?.lng ? { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng } : undefined,
    openingHoursSpecification: (s.openingHours ?? []).map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[Number(h.day)],
      opens: h.open,
      closes: h.close,
    })),
    sameAs: (s.socials ?? []).map((so) => so.url),
  }
  return (
    <script
      type="application/ld+json"
      // contenu sérialisé par nos soins, « < » échappé
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
