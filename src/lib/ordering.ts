import type { Payload } from 'payload'
import { z } from 'zod'

import type { Setting, Table } from '@/payload-types'

import { isOpenAt } from './opening'
import { MAX_ITEMS_PER_ORDER } from './pricing'
import { safeEqual } from './tokens'

/** Schéma Zod commun des lignes de panier envoyées par le navigateur (seuls id, quantité et options comptent). */
export const cartItemsSchema = z
  .array(
    z.object({
      menuItemId: z.number().int().positive(),
      qty: z.number().int().min(1).max(MAX_ITEMS_PER_ORDER),
      options: z.array(z.string().max(80)).max(10).default([]),
    }),
  )
  .min(1, 'Votre panier est vide.')
  .max(MAX_ITEMS_PER_ORDER)

/** Table active dont le jeton QR correspond, sinon null. */
export async function findTableByQr(payload: Payload, code: string, token: string | null | undefined): Promise<Table | null> {
  if (!token) return null
  const { docs } = await payload.find({
    collection: 'tables',
    where: { code: { equals: code.toUpperCase() } },
    limit: 1,
    depth: 0,
  })
  const table = docs[0]
  if (!table?.active || !table.qrToken || !safeEqual(table.qrToken, token)) return null
  return table
}

/** Raison pour laquelle la commande est fermée, ou null si on peut commander. */
export function orderingClosedReason(settings: Setting, at: Date = new Date()): string | null {
  if (!settings.orderingEnabled) return 'La commande en ligne est momentanément suspendue. Appelez un serveur, il s’occupe de vous.'
  if (!isOpenAt(settings, at)) return 'Nous sommes fermés pour le moment : la carte reste consultable, la commande rouvre à l’ouverture.'
  return null
}
