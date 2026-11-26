import { ArrowRight, ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { SpotlightCard } from '@/components/motion/SpotlightCard'
import { MenuTags } from '@/components/site/MenuTags'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { getMenu } from '@/lib/queries'
import { menuCategoryImage, menuItemImage } from '@/lib/visuals'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'La carte',
  description: 'Starters, pâtes, burgers, plats, salades, mocktails, cocktails, milkshakes et desserts du Carré.',
}

export default async function CartePage() {
  const menu = await getMenu()

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="kicker mb-3 text-accent">Le Carré</p>
          <h1 className="mb-3 text-5xl sm:text-6xl">La carte</h1>
          <p className="max-w-xl text-muted-foreground">
            Cuisine généreuse, mocktails glacés et desserts gourmands. Sur place, scannez le QR code de votre table pour commander directement au bar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/commander">
              <ShoppingBag className="size-4" /> Commander à emporter
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/reserver">
              Réserver <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <nav
        aria-label="Catégories"
        className="no-scrollbar sticky top-16 z-30 -mx-5 mb-12 overflow-x-auto border-y border-border bg-background/95 px-5 py-3 backdrop-blur-md"
      >
        <ul className="flex gap-2 whitespace-nowrap">
          {menu.map(({ category }) => (
            <li key={category.id}>
              <a
                href={`#${category.slug}`}
                className="inline-block rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-all hover:border-brand-red hover:bg-brand-red/15 hover:text-foreground"
              >
                {category.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-16">
        {menu.map(({ category, items }) => {
          const slug = category.slug ?? String(category.id)
          return (
            <section key={category.id} id={slug} className="scroll-mt-36" aria-labelledby={`h-${category.id}`}>
              {/* Bannière photo de catégorie */}
              <div className="reveal frame relative mb-6 overflow-hidden border border-border bg-card">
                <div className="relative flex h-32 items-end p-6 sm:h-40">
                  <Image
                    src={menuCategoryImage(slug)}
                    alt={category.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1000px"
                    className="object-cover opacity-45"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/20" />
                  <div className="relative z-10">
                    <h2 id={`h-${category.id}`} className="text-4xl sm:text-5xl">
                      {category.title}
                    </h2>
                    {category.note && <p className="mt-1 text-sm text-foreground/75">{category.note}</p>}
                  </div>
                  <span className="relative z-10 ml-auto hidden font-display text-xs uppercase tracking-[0.3em] text-muted-foreground sm:block">
                    {items.length} choix
                  </span>
                </div>
              </div>

              {/* Cartes visuelles des plats */}
              <ul className="grid gap-4 md:grid-cols-2">
                {items.map((i) => {
                  const photo = menuItemImage(i.title, slug, i.image)
                  return (
                    <li key={i.id} className="reveal">
                      <SpotlightCard className="group flex h-full items-center gap-4 rounded-lg border border-border/80 bg-card/60 p-4">
                        <div className="relative size-24 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted sm:size-28">
                          <Image
                            src={photo}
                            alt={i.title}
                            fill
                            sizes="112px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-lg font-medium leading-snug">{i.title}</p>
                            <span className="shrink-0 font-display text-lg tabular-nums text-foreground">{formatPrice(i.price)}</span>
                          </div>
                          {i.description && <p className="text-sm text-muted-foreground">{i.description}</p>}
                          {i.options && i.options.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Au choix : {i.options.map((o) => o.name + (o.supplement ? ` (+${formatPrice(o.supplement)})` : '')).join(', ')}
                            </p>
                          )}
                          <MenuTags tags={i.tags} />
                        </div>
                      </SpotlightCard>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="mt-14 text-xs text-muted-foreground">
        Prix nets, service compris. L’abus d’alcool est dangereux pour la santé, à consommer avec modération. Vente d’alcool interdite aux
        mineurs. Allergènes : demandez à l’équipe.
      </p>
    </div>
  )
}
