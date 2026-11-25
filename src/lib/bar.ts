import type { Payload, Where } from 'payload'

import type { Order } from '@/payload-types'

import { addDays, todayParis } from './time'

export type BarOrder = {
  id: number
  number: number
  type: Order['type']
  table: string | null
  contact: string | null
  status: Order['status']
  paymentStatus: NonNullable<Order['paymentStatus']>
  scheduledFor: string | null
  createdAt: string
  updatedAt: string
  servedAt: string | null
  note: string | null
  items: { qty: number; title: string; options: string | null }[]
}

export const SERVED_VISIBLE_MS = 30 * 60_000

export function toBarOrder(o: Order): BarOrder {
  return {
    id: o.id,
    number: o.number,
    type: o.type,
    table: o.table ? (typeof o.table === 'object' ? o.table.label : `Table ${o.table}`) : null,
    contact: o.contactName ?? null,
    status: o.status,
    paymentStatus: o.paymentStatus ?? 'a_regler',
    scheduledFor: o.scheduledFor ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    servedAt: o.servedAt ?? null,
    note: o.note ?? null,
    items: o.items.map((i) => ({ qty: i.qty, title: i.title, options: i.options ?? null })),
  }
}

/** Commandes à afficher au bar : en cours, programmées du jour, et servies des 30 dernières minutes. */
export async function loadBarOrders(payload: Payload, extra?: Where): Promise<BarOrder[]> {
  const today = todayParis()
  const since = new Date(Date.now() - 12 * 3600_000).toISOString()
  const servedSince = new Date(Date.now() - SERVED_VISIBLE_MS).toISOString()
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        {
          or: [
            { and: [{ status: { equals: 'programmee' } }, { serviceDate: { in: [addDays(today, -1), today] } }] },
            { and: [{ createdAt: { greater_than: since } }, { status: { in: ['recue', 'en_preparation'] } }] },
            { and: [{ status: { equals: 'servie' } }, { servedAt: { greater_than: servedSince } }] },
          ],
        },
        ...(extra ? [extra] : []),
      ],
    },
    sort: 'createdAt',
    limit: 300,
    depth: 1,
    pagination: false,
  })
  return docs.map(toBarOrder)
}

export const NEXT_STATUS: Partial<Record<Order['status'], Order['status']>> = {
  programmee: 'recue',
  recue: 'en_preparation',
  en_preparation: 'servie',
}

/** Lance au bar une précommande : passe en « reçue » sur la table de la réservation. */
export async function launchPreorders(payload: Payload, reservationId: number, tableId: number | undefined, req?: Parameters<Payload['update']>[0]['req']) {
  await payload.update({
    collection: 'orders',
    where: { reservation: { equals: reservationId }, status: { equals: 'programmee' } },
    data: { status: 'recue', ...(tableId ? { table: tableId } : {}) },
    req,
  })
}
