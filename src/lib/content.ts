import { ValidationError } from 'payload'

/** Loi Evin : aucun produit du tabac dans la carte ni dans la commande. */
// bornes Unicode : \b ne gère pas les lettres accentuées (« narguilé »)
const TOBACCO = /(?<!\p{L})(chichas?|shishas?|narguil[ée]s?|hookahs?|tabacs?|cigarettes?|cigares?|puffs?)(?!\p{L})/iu

export function containsTobacco(text: string): boolean {
  return TOBACCO.test(text)
}

export function assertNoTobacco(text: string): void {
  if (containsTobacco(text)) {
    throw new ValidationError({
      errors: [
        {
          message: 'Loi Evin : aucun produit du tabac ne peut figurer sur la carte ni être vendu en ligne.',
          path: 'title',
        },
      ],
    })
  }
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
