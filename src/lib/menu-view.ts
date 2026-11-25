import type { MenuSectionView } from '@/components/order/types'

import type { MenuSection } from './queries'

/** Carte sérialisable pour les composants client, avec filtre optionnel sur l'alcool (vente à emporter). */
export function toSectionViews(menu: MenuSection[], opts: { excludeAlcohol?: boolean } = {}): MenuSectionView[] {
  return menu
    .map(({ category, items }) => ({
      id: category.id,
      slug: category.slug ?? String(category.id),
      title: category.title,
      note: category.note ?? null,
      items: items
        .filter((i) => !(opts.excludeAlcohol && i.tags?.includes('alcool')))
        .map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description ?? null,
          price: i.price,
          tags: i.tags ?? [],
          options: (i.options ?? []).map((o) => ({ name: o.name, supplement: o.supplement ?? 0 })),
        })),
    }))
    .filter((s) => s.items.length > 0)
}
