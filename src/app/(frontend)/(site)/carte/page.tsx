import type { Metadata } from 'next'

import { MenuTags } from '@/components/site/MenuTags'
import { formatPrice } from '@/lib/content'
import { getMenu } from '@/lib/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'La carte',
  description: 'Starters, pâtes, burgers, plats, salades, mocktails, cocktails, milkshakes et desserts du Carré.',
}

export default async function CartePage() {
  const menu = await getMenu()

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="kicker mb-3">Le Carré</p>
      <h1 className="mb-4 text-5xl sm:text-6xl">La carte</h1>
      <p className="mb-8 text-muted-foreground">Sur place, scannez le QR code de votre table pour commander depuis votre téléphone.</p>

      <nav
        aria-label="Catégories"
        className="sticky top-16 z-30 -mx-5 mb-10 overflow-x-auto border-y border-border bg-background/95 px-5 py-3 backdrop-blur"
      >
        <ul className="flex gap-2 whitespace-nowrap">
          {menu.map(({ category }) => (
            <li key={category.id}>
              <a
                href={`#${category.slug}`}
                className="inline-block rounded-full border border-border px-4 py-1.5 text-sm hover:border-foreground"
              >
                {category.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-16">
        {menu.map(({ category, items }) => (
          <section key={category.id} id={category.slug ?? undefined} className="scroll-mt-36" aria-labelledby={`h-${category.id}`}>
            <h2 id={`h-${category.id}`} className="text-4xl">
              {category.title}
            </h2>
            {category.note && <p className="mt-1 text-sm text-muted-foreground">{category.note}</p>}
            <ul className="mt-6">
              {items.map((i) => (
                <li key={i.id} className="flex items-baseline gap-4 border-b border-border py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-lg">{i.title}</p>
                    {i.description && <p className="text-sm text-muted-foreground">{i.description}</p>}
                    {i.options && i.options.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Au choix : {i.options.map((o) => o.name + (o.supplement ? ` (+${formatPrice(o.supplement)})` : '')).join(', ')}
                      </p>
                    )}
                    <MenuTags tags={i.tags} />
                  </div>
                  <span className="font-display text-lg tabular-nums">{formatPrice(i.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-14 text-xs text-muted-foreground">
        Prix nets, service compris. L’abus d’alcool est dangereux pour la santé, à consommer avec modération. Vente d’alcool interdite aux
        mineurs. Allergènes : demandez à l’équipe.
      </p>
    </div>
  )
}
