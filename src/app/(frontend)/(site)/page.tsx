import { ArrowRight, CalendarCheck, Clock, Gift, MapPin, Phone, QrCode, ShoppingBag, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { GalleryLightbox, type GalleryPhoto } from '@/components/motion/GalleryLightbox'
import { InteractiveHero } from '@/components/motion/InteractiveHero'
import { Magnetic } from '@/components/motion/Magnetic'
import { SpotlightCard } from '@/components/motion/SpotlightCard'
import { VideoShowcase } from '@/components/motion/VideoShowcase'
import { EventCard } from '@/components/site/EventCard'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { isOpenAt } from '@/lib/opening'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { formatPhoneFr } from '@/lib/phone'
import { getMenu, getUpcomingEvents, mediaOf } from '@/lib/queries'
import { addressLine, hoursSummary, mapsUrl } from '@/lib/site'
import { AMBIANCE_FALLBACKS, DEFAULT_GALLERY, menuCategoryImage, menuItemImage } from '@/lib/visuals'

export const revalidate = 60

const MARQUEE = ['Burgers', 'Pâtes', 'Plats', 'Salades', 'Mocktails', 'Cocktails', 'Milkshakes', 'Desserts', 'Soirées', 'Matchs', 'Privatisation']

const WAYS = [
  {
    icon: CalendarCheck,
    title: 'Réserver une table',
    text: 'Choisissez votre créneau, recevez la confirmation par SMS. Vous pouvez même précommander pour être servi dès votre arrivée.',
    href: '/reserver',
    cta: 'Réserver',
    cursor: 'RÉSERVER',
  },
  {
    icon: ShoppingBag,
    title: 'Commander à emporter',
    text: 'Burgers, pâtes, desserts et mocktails prêts à l’heure que vous choisissez. Payez en ligne ou au retrait.',
    href: '/commander',
    cta: 'Commander',
    cursor: 'COMMANDER',
  },
  {
    icon: QrCode,
    title: 'Commander à table',
    text: 'Sur place, scannez le QR code de votre table : la carte s’ouvre, votre commande part directement au bar.',
    href: '/carte',
    cta: 'Voir la carte',
    cursor: 'LA CARTE',
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
    .flatMap((s) => s.items.map((item) => ({ item, categorySlug: s.category.slug })))
    .filter(({ item }) => item.tags?.includes('signature'))
    .slice(0, 6)
  const open = isOpenAt(settings)
  const mapQuery = settings.geo?.lat && settings.geo?.lng ? `${settings.geo.lat},${settings.geo.lng}` : `${settings.name} ${addressLine(settings)}`

  const galleryPhotos: GalleryPhoto[] =
    home.gallery && home.gallery.length > 0
      ? home.gallery
          .map((g, idx) => {
            const img = mediaOf(g.image)
            return img?.url ? { id: String(g.id ?? idx), url: img.url, alt: img.alt } : null
          })
          .filter((x): x is GalleryPhoto => x !== null)
      : DEFAULT_GALLERY.map((g, idx) => ({ id: `default-${idx}`, url: g.url, alt: g.alt, caption: g.caption }))

  return (
    <>
      {/* En-tête plein cadre avec vidéo d'ambiance et parallaxe souris */}
      <InteractiveHero
        kicker={home.heroKicker || 'Restaurant lounge · Saint-Brice-sous-Forêt'}
        title={home.heroTitle || 'Le Carré'}
        subtitle={home.heroSubtitle || 'Burgers, pâtes, mocktails et desserts gourmands dans une ambiance feutrée. Ouvert 7j/7 de 18h à 2h.'}
        posterUrl={heroImage?.url ?? '/images/site/hero-lounge.jpg'}
        videoUrl="/videos/le-carre-ambiance.mp4"
        open={open}
        hoursLine={hoursSummary(settings.openingHours)[0] ?? '18h – 2h'}
      />

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

      {/* Section Vidéo immersive (Ambiance & Cuisine) */}
      <VideoShowcase />

      {/* Trois façons */}
      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="facons">
        <p className="kicker mb-3">Comme vous voulez</p>
        <h2 id="facons" className="mb-12 text-4xl sm:text-5xl">
          Sur place, à table ou à emporter
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {WAYS.map((w) => (
            <SpotlightCard key={w.title} cursorLabel={w.cursor} className="reveal frame flex flex-col border border-border bg-card/60 p-7">
              <w.icon className="mb-6 size-8 text-accent" aria-hidden />
              <h3 className="mb-3 text-2xl">{w.title}</h3>
              <p className="mb-6 flex-1 text-muted-foreground">{w.text}</p>
              <Link href={w.href} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                {w.cta} <ArrowRight className="size-4" />
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Ambiance avec photos */}
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
                const photoUrl = img?.url ?? AMBIANCE_FALLBACKS[i % AMBIANCE_FALLBACKS.length]
                const photoAlt = img?.alt ?? a.title
                return (
                  <article key={a.id ?? a.title} className="reveal group bg-background">
                    <div className="relative aspect-4/3 overflow-hidden">
                      <Image
                        src={photoUrl}
                        alt={photoAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="space-y-3 p-7">
                      <span className="font-display text-5xl font-light text-brand-red/45 tabular-nums">0{i + 1}</span>
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

      {/* Incontournables avec photos */}
      {signatures.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="signatures">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3 text-accent">Les favoris</p>
              <h2 id="signatures" className="text-4xl sm:text-5xl">
                Nos incontournables
              </h2>
            </div>
            <Link href="/carte" className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
              Toute la carte <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {signatures.map(({ item, categorySlug }) => (
              <li key={item.id} className="reveal">
                <SpotlightCard
                  cursorLabel="CARTE"
                  className="group flex items-center gap-4 rounded-lg border border-border/80 bg-card/55 p-4"
                >
                  <Link href={`/carte#${categorySlug ?? ''}`} className="flex w-full items-center gap-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted sm:size-24">
                      <Image
                        src={menuItemImage(item.title, categorySlug, item.image)}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-medium">{item.title}</p>
                      {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                    </div>
                    <span className="shrink-0 font-display text-lg tabular-nums">{formatPrice(item.price)}</span>
                  </Link>
                </SpotlightCard>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* La carte en un coup d'œil — tuiles photographiques */}
      {menu.length > 0 && (
        <section className="border-y border-border bg-card" aria-labelledby="carte-apercu">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker mb-3">La carte</p>
                <h2 id="carte-apercu" className="text-4xl sm:text-5xl">
                  De quoi grignoter, dîner ou trinquer
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/commander">
                  Commander à emporter <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {menu.map(({ category, items }) => {
                const slug = category.slug ?? String(category.id)
                return (
                  <li key={category.id} className="reveal">
                    <Link
                      href={`/carte#${slug}`}
                      data-cursor-label="VOIR"
                      className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-md border border-border bg-background p-5 transition-colors hover:border-brand-red/70"
                    >
                      <Image
                        src={menuCategoryImage(slug)}
                        alt={category.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/45 to-transparent" />
                      <div className="relative z-10">
                        <p className="font-display text-2xl font-light text-foreground">{category.title}</p>
                        <p className="mt-1 text-xs text-foreground/75">
                          {items.length} choix · dès {formatPrice(Math.min(...items.map((i) => i.price)))}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Événements */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="evenements">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3 text-accent">Agenda</p>
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
        <SpotlightCard className="reveal frame grid gap-10 border border-border bg-card/45 p-8 sm:p-12 md:grid-cols-2">
          <div className="space-y-5">
            <Gift className="size-8 text-accent" aria-hidden />
            <p className="kicker">Programme de fidélité</p>
            <h2 id="fidelite" className="text-4xl sm:text-5xl">
              1 € = {settings.loyalty?.pointsPerEuro ?? 1} point
            </h2>
            <p className="text-muted-foreground">
              Donnez votre numéro en commandant, les points se cumulent tout seuls. Un bonus vous attend le jour de votre anniversaire.
            </p>
            <Magnetic className="inline-block">
              <Button asChild size="lg" variant="outline">
                <Link href="/connexion">Créer ma carte</Link>
              </Button>
            </Magnetic>
          </div>
          {rewards.docs.length > 0 && (
            <ul className="divide-y divide-border self-center border-y border-border">
              {rewards.docs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <span>{r.title}</span>
                  <span className="shrink-0 font-display text-lg tabular-nums text-accent">{r.pointsCost} pts</span>
                </li>
              ))}
            </ul>
          )}
        </SpotlightCard>
      </section>

      {/* Galerie interactive avec lightbox */}
      {galleryPhotos.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="galerie">
          <p className="kicker mb-3">En images</p>
          <h2 id="galerie" className="mb-10 text-4xl sm:text-5xl">
            Galerie
          </h2>
          <GalleryLightbox photos={galleryPhotos} />
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
                <SpotlightCard key={r.id ?? r.author} className="reveal frame border border-border bg-background p-7">
                  <figure>
                    <div className="mb-4 flex gap-1" role="img" aria-label={`${r.rating ?? 5} sur 5`}>
                      {Array.from({ length: r.rating ?? 5 }, (_, k) => (
                        <Star key={k} className="size-4 fill-accent text-accent" aria-hidden />
                      ))}
                    </div>
                    <blockquote className="text-lg leading-relaxed">« {r.text} »</blockquote>
                    <figcaption className="mt-4 text-sm text-muted-foreground">{r.author}</figcaption>
                  </figure>
                </SpotlightCard>
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
                <span className="text-2xl text-accent transition-transform duration-300 group-open:rotate-45" aria-hidden>
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
        <SpotlightCard className="reveal frame flex flex-col items-start gap-6 border border-border bg-card/50 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
          <div className="space-y-3">
            <h2 className="text-4xl">{home.ctaTitle}</h2>
            <p className="text-muted-foreground">{home.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <Button asChild size="lg">
                <Link href="/reserver">Réserver</Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild size="lg" variant="outline">
                <Link href="/privatisation">Privatiser</Link>
              </Button>
            </Magnetic>
          </div>
        </SpotlightCard>
      </section>
    </>
  )
}
