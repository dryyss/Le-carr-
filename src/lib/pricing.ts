/** Calcul des lignes de commande, côté serveur uniquement : prix et options viennent de la carte. */

export type ProductForPricing = {
  id: number
  title: string
  price: number
  available?: boolean | null
  tags?: string[] | null
  options?: { name: string; supplement?: number | null }[] | null
}

export type RequestedLine = { menuItemId: number; qty: number; options: string[] }

export type PricedLine = { menuItem: number; title: string; qty: number; options?: string; unitPrice: number }

export class PricingError extends Error {}

export const MAX_ITEMS_PER_ORDER = 30

export function priceLines(
  products: ProductForPricing[],
  requested: RequestedLine[],
  opts: { excludeAlcohol?: boolean } = {},
): { lines: PricedLine[]; total: number } {
  if (!requested.length) throw new PricingError('Votre panier est vide.')
  const totalQty = requested.reduce((s, l) => s + l.qty, 0)
  if (totalQty > MAX_ITEMS_PER_ORDER) throw new PricingError(`${MAX_ITEMS_PER_ORDER} articles maximum par commande.`)

  const byId = new Map(products.map((p) => [p.id, p]))
  const lines = requested.map((r) => {
    if (!Number.isInteger(r.qty) || r.qty < 1) throw new PricingError('Quantité invalide.')
    const p = byId.get(r.menuItemId)
    if (!p || p.available === false) throw new PricingError('Un produit de votre panier n’est plus disponible. Retirez-le pour continuer.')
    if (opts.excludeAlcohol && p.tags?.includes('alcool')) {
      throw new PricingError(`« ${p.title} » n’est pas disponible à emporter (boisson alcoolisée).`)
    }
    const wanted = new Set(r.options)
    const chosen = (p.options ?? []).filter((o) => wanted.has(o.name))
    if (chosen.length !== wanted.size) throw new PricingError(`Option inconnue pour « ${p.title} ».`)
    return {
      menuItem: p.id,
      title: p.title,
      qty: r.qty,
      options: chosen.map((o) => o.name).join(', ') || undefined,
      unitPrice: p.price + chosen.reduce((s, o) => s + (o.supplement ?? 0), 0),
    }
  })
  return { lines, total: lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) }
}
