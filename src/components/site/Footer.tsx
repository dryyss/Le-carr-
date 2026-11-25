import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { getSettings } from '@/lib/payload'
import { formatPhoneFr } from '@/lib/phone'
import { addressLine, hoursSummary, mapsUrl, SOCIAL_LABELS } from '@/lib/site'

export async function Footer() {
  const s = await getSettings()
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo className="size-16" />
          <p className="text-sm text-muted-foreground">Restaurant lounge à Saint-Brice-sous-Forêt.</p>
        </div>
        <div>
          <h2 className="kicker mb-4">Horaires</h2>
          <ul className="space-y-1 text-sm">
            {hoursSummary(s.openingHours).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-4">Nous trouver</h2>
          <address className="space-y-1 text-sm not-italic">
            <a href={mapsUrl(s)} target="_blank" rel="noopener" className="block underline-offset-4 hover:underline">
              {addressLine(s)}
            </a>
            {s.phone && (
              <a href={`tel:${s.phone}`} className="block underline-offset-4 hover:underline">
                {formatPhoneFr(s.phone)}
              </a>
            )}
          </address>
        </div>
        <div>
          <h2 className="kicker mb-4">Suivez-nous</h2>
          <ul className="space-y-1 text-sm">
            {(s.socials ?? []).map((so) => (
              <li key={so.url}>
                <a href={so.url} target="_blank" rel="noopener" className="underline-offset-4 hover:underline">
                  {SOCIAL_LABELS[so.network] ?? so.network}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Le Carré. L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>
          <nav aria-label="Liens légaux" className="flex gap-5">
            <Link href="/mentions-legales" className="hover:text-foreground">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/admin" className="hover:text-foreground">
              Espace équipe
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
