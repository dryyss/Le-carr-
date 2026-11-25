import type { Payload } from 'payload'

import type { Order } from '@/payload-types'

import { withLock } from './db-lock'
import { priceLines, PricingError, type RequestedLine } from './pricing'
import { siteUrl } from './site-url'
import { orderToken } from './tokens'

export const ORDER_COOLDOWN_MS = 60_000

export class OrderError extends Error {}

export type CreateOrderInput = {
  type: Order['type']
  serviceDate: string
  items: RequestedLine[]
  note?: string
  customerId?: number
  tableId?: number
  reservationId?: number
  scheduledFor?: Date
  contactName?: string
  contactPhone?: string
  payOnline?: boolean
}

/**
 * Crée une commande (à table, précommande ou à emporter). Les prix sont recalculés depuis la carte,
 * le numéro du jour est attribué sous verrou pour éviter les doublons.
 */
export async function createOrder(payload: Payload, input: CreateOrderInput): Promise<Order> {
  const ids = [...new Set(input.items.map((i) => i.menuItemId))]
  const { docs: products } = await payload.find({
    collection: 'menu-items',
    where: { id: { in: ids } },
    limit: ids.length || 1,
    depth: 0,
    pagination: false,
  })

  let priced
  try {
    priced = priceLines(products, input.items, { excludeAlcohol: input.type === 'emporter' })
  } catch (e) {
    if (e instanceof PricingError) throw new OrderError(e.message)
    throw e
  }

  return withLock(payload, 'orders', async (req) => {
    if (input.type === 'table' && input.tableId) {
      const last = await payload.count({
        collection: 'orders',
        where: { table: { equals: input.tableId }, createdAt: { greater_than: new Date(Date.now() - ORDER_COOLDOWN_MS).toISOString() } },
        req,
      })
      if (last.totalDocs > 0) throw new OrderError('Une commande vient de partir de cette table. Patientez une minute avant d’en passer une autre.')
    }
    const count = await payload.count({ collection: 'orders', where: { serviceDate: { equals: input.serviceDate } }, req })
    return payload.create({
      collection: 'orders',
      data: {
        number: count.totalDocs + 1,
        type: input.type,
        serviceDate: input.serviceDate,
        status: input.type === 'table' ? 'recue' : 'programmee',
        table: input.tableId,
        reservation: input.reservationId,
        customer: input.customerId,
        scheduledFor: input.scheduledFor?.toISOString(),
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        items: priced.lines,
        note: input.note || undefined,
        paymentMethod: input.payOnline ? 'en_ligne' : 'caisse',
        paymentStatus: input.payOnline ? 'en_attente' : 'a_regler',
      },
      req,
    })
  })
}

/** Page publique de suivi d'une commande (précommande, à emporter). */
export function publicOrderUrl(orderId: number): string {
  return `${siteUrl}/commande/${orderId}?t=${orderToken(orderId)}`
}

/** Client fidélité par numéro : retrouvé, ou créé sans aucun consentement marketing. */
export async function findOrCreateCustomer(payload: Payload, phone: string, firstName?: string): Promise<number> {
  const found = await payload.find({ collection: 'customers', where: { phone: { equals: phone } }, limit: 1, depth: 0 })
  if (found.docs[0]) return found.docs[0].id
  return (await payload.create({ collection: 'customers', data: { phone, firstName } })).id
}
