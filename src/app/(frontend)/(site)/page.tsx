import { ArrowRight, CalendarCheck, Clock, Gift, MapPin, Phone, QrCode, ShoppingBag, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { EventCard } from '@/components/site/EventCard'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { isOpenAt } from '@/lib/opening'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { formatPhoneFr } from '@/lib/phone'
import { getMenu, getUpcomingEvents, mediaOf } from '@/lib/queries'
import { addressLine, hoursSummary, mapsUrl } from '@/lib/site'

export const revalidate = 60

const MARQUEE = ['Burgers', 'Pâtes', 'Plats', 'Salades', 'Mocktails', 'Cocktails', 'Milkshakes', 'Desserts', 'Soirées', 'Matchs', 'Privatisation']

const WAYS = [
  {
    icon: CalendarCheck,
    title: 'Réserver une table',
    text: 'Choisissez votre créneau, recevez la confirmation par SMS. Vous pouvez même précommander pour être servi dès votre arrivée.',
    href: '/reserver',
    cta: 'Réserver',
  },
  {
    icon: ShoppingBag,
    title: 'Commander à emporter',
    text: 'Burgers, pâtes, desserts et mocktails prêts à l’heure que vous choisissez. Payez en ligne ou au retrait.',
    href: '/commander',
    cta: 'Commander',
  },
  {
    icon: QrCode,
    title: 'Commander à table',
    text: 'Sur place, scannez le QR code de votre table : la carte s’ouvre, votre commande part directement au bar.',
    href: '/carte',
    cta: 'Voir la carte',
  },
]

const FAQ = [
  {
    q: 'Faut-il réserver ?',
    a: 'Ce n’est pas obligatoire, mais conseillé le vendredi, le samedi et les soirs de match. La réservation en ligne est confirmée immédiatement par SMS.',
  },
  {
    q: 'Peut-on payer en ligne ?',
    a: 'Oui : pour une commande à emporter, une précommande avec votre réservation ou une commande passée depuis votre table. Vous pouvez aussi régler en caisse.',
  },
  {
    q: 'Et pour un grand groupe ?',
    a: 'Au-delà de 10 personnes, faites une demande de privatisation : on vous propose un espace et une formule adaptés.',
  },
  {
    q: 'Comment fonctionne la fidélité ?',
    a: '1 euro commandé = 1 point, crédité automatiquement si vous donnez votre numéro. Les points se transforment en desserts, mocktails et boissons offerts.',
  },
]

export default async function HomePage() {
  const payload = await getPayloadClient()
  const [home, settings, menu, events, rewards] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', depth: 1 }),
    getSettings(),
    getMenu(),
    getUpcomingEvents(3),
    payload.find({ collection: 'rewards', where: { active: { equals: true } }, sort: 'pointsCost', limit: 4, depth: 0 }),
  ])

  const heroImage = mediaOf(home.heroImage)
  const signatures = menu
    .flatMap((s) => s.items)
    .filter((i) => i.tags?.includes('signature'))
    .slice(0, 6)
  const open = isOpenAt(settings)
  const mapQuery = settings.geo?.lat && settings.geo?.lng ? `${settings.geo.lat},${settings.geo.lng}` : `${settings.name} ${addressLine(settings)}`

  return (
    <>
      {/* En-tête plein cadre */}
      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden">
        {heroImage ? (
          <>
            <Image src={heroImage.url!} alt={heroImage.alt} fill priority sizes="100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-linear-to-b from-background/60 via-background/70 to-background" />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.07] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
          />
        )}
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr]">
          <div className="animate-reveal space-y-7">
            <p className="kicker">{home.heroKicker}</p>
            <h1 className="text-6xl uppercase leading-[0.95] tracking-[0.12em] sm:text-7xl lg:text-8xl">{home.heroTitle}</h1>
            <p className="max-w-md text-lg text-muted-foreground">{home.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/reserver">
                  Réserver une table <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/commander">Commander à emporter</Link>
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`inline-block size-2 rounded-full ${open ? 'bg-success' : 'bg-muted-foreground'}`} aria-hidden />
              {open ? 'Ouvert en ce moment' : 'Fermé pour le moment'} · {hoursSummary(settings.openingHours)[0]}
            </p>
          </div>
          <div className="flex justify-center max-md:order-first">
            <Logo className="w-40 animate-reveal sm:w-56 md:w-full md:max-w-sm" />
          </div>
        </div>
      </section>

      {/* Bandeau défilant */}
      <div className="overflow-hidden border-y border-border py-4" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl font-light uppercase tracking-[0.3em] text-muted-foreground">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              {w}
              <span className="inline-block size-2 rotate-45 border border-brand-red" />
            </span>
          ))}
        </div>
      </div>

      {/* Trois façons */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="facons">
        <p className="kicker mb-3">Comme vous voulez</p>
        <h2 id="facons" className="mb-12 text-4xl sm:text-5xl">
          Sur place, à table ou à emporter
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {WAYS.map((w) => (
            <article key={w.title} className="reveal frame flex flex-col border border-border p-7">
              <w.icon className="mb-6 size-8" aria-hidden />
              <h3 className="mb-3 text-2xl">{w.title}</h3>
              <p className="mb-6 flex-1 text-muted-foreground">{w.text}</p>
              <Link href={w.href} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                {w.cta} <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Ambiance */}
      {home.ambiance && home.ambiance.length > 0 && (
        <section className="border-y border-border bg-card" aria-labelledby="ambiance">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="kicker mb-3">L’ambiance</p>
            <h2 id="ambiance" className="mb-12 max-w-2xl text-4xl sm:text-5xl">
              Un lieu pour prendre son temps, du coucher du soleil à 2 h du matin
            </h2>
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
              {home.ambiance.map((a, i) => {
                const img = mediaOf(a.image)
                return (
                  <article key={a.id ?? a.title} className="reveal bg-background">
                    {img && (
                      <div className="relative aspect-4/3">
                        <Image src={img.url!} alt={img.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                      </div>
                    )}
                    <div className="space-y-3 p-7">
                      <span className="font-display text-5xl font-light text-foreground/20 tabular-nums">0{i + 1}</span>
                      <h3 className="text-2xl">{a.title}</h3>
                      <p className="text-muted-foreground">{a.text}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Incontournables */}
      {signatures.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="signatures">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3">Les favoris</p>
              <h2 id="signatures" className="text-4xl sm:text-5xl">
                Nos incontournables
              </h2>
            </div>
            <Link href="/carte" className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
              Toute la carte <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {signatures.map((i) => (
              <li key={i.id} className="reveal flex items-baseline gap-3 border-b border-border py-5">
                <div className="min-w-0 flex-1">
                  <p className="text-lg">{i.title}</p>
                  {i.description && <p className="text-sm text-muted-foreground">{i.description}</p>}
                </div>
                <span className="font-display text-lg tabular-nums">{formatPrice(i.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* La carte en un coup d'œil */}
      {menu.length > 0 && (
        <section className="border-y border-border bg-card" aria-labelledby="carte-apercu">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="kicker mb-3">La carte</p>
            <h2 id="carte-apercu" className="mb-10 text-4xl sm:text-5xl">
              De quoi grignoter, dîner ou trinquer
            </h2>
            <ul className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-4">
              {menu.map(({ category, items }) => (
                <li key={category.id} className="bg-background">
                  <Link href={`/carte#${category.slug}`} className="group block h-full p-6 transition-colors hover:bg-secondary">
                    <p className="font-display text-2xl font-light">{category.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {items.length} choix · dès {formatPrice(Math.min(...items.map((i) => i.price)))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Événements */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="evenements">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3">Agenda</p>
              <h2 id="evenements" className="text-4xl sm:text-5xl">
                Prochains événements
              </h2>
            </div>
            <Link href="/evenements" className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
              Tout l’agenda <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Fidélité */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="fidelite">
        <div className="frame grid gap-10 border border-border p-8 sm:p-12 md:grid-cols-2">
          <div className="space-y-5">
            <Gift className="size-8" aria-hidden />
            <p className="kicker">Programme de fidélité</p>
            <h2 id="fidelite" className="text-4xl sm:text-5xl">
              1 € = {settings.loyalty?.pointsPerEuro ?? 1} point
            </h2>
            <p className="text-muted-foreground">
              Donnez votre numéro en commandant, les points se cumulent tout seuls. Un bonus vous attend le jour de votre anniversaire.
            </p>
            <Button asChild size="lg" variant="outline">
              <Link href="/connexion">Créer ma carte</Link>
            </Button>
          </div>
          {rewards.docs.length > 0 && (
            <ul className="divide-y divide-border self-center border-y border-border">
              {rewards.docs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <span>{r.title}</span>
                  <span className="shrink-0 font-display text-lg tabular-nums">{r.pointsCost} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Galerie */}
      {home.gallery && home.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="galerie">
          <p className="kicker mb-3">En images</p>
          <h2 id="galerie" className="mb-10 text-4xl sm:text-5xl">
            Galerie
          </h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {home.gallery.map((g, idx) => {
              const img = mediaOf(g.image)
              if (!img) return null
              return (
                <div key={g.id ?? idx} className={`reveal relative overflow-hidden ${idx % 5 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
                  <Image src={img.url!} alt={img.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Avis */}
      {home.reviews && home.reviews.length > 0 && (
        <section className="border-y border-border bg-card" aria-labelledby="avis">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="kicker mb-3">Ils en parlent</p>
            <h2 id="avis" className="mb-10 text-4xl sm:text-5xl">
              Avis clients
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {home.reviews.map((r) => (
                <figure key={r.id ?? r.author} className="reveal frame border border-border bg-background p-7">
                  <div className="mb-4 flex gap-1" role="img" aria-label={`${r.rating ?? 5} sur 5`}>
                    {Array.from({ length: r.rating ?? 5 }, (_, k) => (
                      <Star key={k} className="size-4 fill-foreground" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="text-lg leading-relaxed">« {r.text} »</blockquote>
                  <figcaption className="mt-4 text-sm text-muted-foreground">{r.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Infos pratiques */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="infos">
        <p className="kicker mb-3">Infos pratiques</p>
        <h2 id="infos" className="mb-10 text-4xl sm:text-5xl">
          Venir au Carré
        </h2>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2 border-t border-border pt-5">
              <Clock className="size-5 text-accent" aria-hidden />
              <h3 className="text-xl">Horaires</h3>
              {hoursSummary(settings.openingHours).map((l) => (
                <p key={l} className="text-muted-foreground">
                  {l}
                </p>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-5">
              <MapPin className="size-5 text-accent" aria-hidden />
              <h3 className="text-xl">Adresse</h3>
              <p className="text-muted-foreground">{addressLine(settings)}</p>
              <a href={mapsUrl(settings)} target="_blank" rel="noopener" className="text-sm underline underline-offset-4">
                Itinéraire
              </a>
            </div>
            <div className="space-y-2 border-t border-border pt-5">
              <Phone className="size-5 text-accent" aria-hidden />
              <h3 className="text-xl">Contact</h3>
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="block text-muted-foreground hover:text-foreground">
                  {formatPhoneFr(settings.phone)}
                </a>
              )}
              <Link href="/privatisation" className="text-sm underline underline-offset-4">
                Privatiser le lieu
              </Link>
            </div>
          </div>
          <div className="frame relative min-h-80 overflow-hidden border border-border">
            <iframe
              title={`Plan d’accès au ${settings.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full grayscale invert-[0.9] contrast-[0.9]"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 pb-20" aria-labelledby="faq">
        <p className="kicker mb-3">Questions fréquentes</p>
        <h2 id="faq" className="mb-8 text-4xl sm:text-5xl">
          Bon à savoir
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg">
                {f.q}
                <span className="text-2xl transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Appel à réserver */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="frame flex flex-col items-start gap-6 border border-border p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
          <div className="space-y-3">
            <h2 className="text-4xl">{home.ctaTitle}</h2>
            <p className="text-muted-foreground">{home.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/reserver">Réserver</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/privatisation">Privatiser</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
