import type { MenuSectionView } from '@/components/order/types'

import type { MenuSection } from './queries'
import { menuCategoryImage, menuItemImage } from './visuals'

/** Carte sérialisable pour les composants client, avec filtre optionnel sur l'alcool (vente à emporter). */
export function toSectionViews(menu: MenuSection[], opts: { excludeAlcohol?: boolean } = {}): MenuSectionView[] {
  return menu
    .map(({ category, items }) => {
      const slug = category.slug ?? String(category.id)
      return {
        id: category.id,
        slug,
        title: category.title,
        note: category.note ?? null,
        cover: menuCategoryImage(slug),
        items: items
          .filter((i) => !(opts.excludeAlcohol && i.tags?.includes('alcool')))
          .map((i) => ({
            id: i.id,
            title: i.title,
            description: i.description ?? null,
            price: i.price,
            image: menuItemImage(i.title, slug, i.image),
            tags: i.tags ?? [],
            options: (i.options ?? []).map((o) => ({ name: o.name, supplement: o.supplement ?? 0 })),
          })),
      }
    })
    .filter((s) => s.items.length > 0)
}
