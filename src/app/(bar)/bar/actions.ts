'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { NEXT_STATUS, toBarOrder, type BarOrder } from '@/lib/bar'
import { getPayloadClient, getStaffUser } from '@/lib/payload'

const id = z.number().int().positive()

async function requireStaff() {
  const user = await getStaffUser()
  if (!user) throw new Error('Accès réservé à l’équipe')
  return user
}

/** Passe une commande à l'état suivant (programmée => reçue => en préparation => servie). */
export async function advanceOrder(orderId: number): Promise<BarOrder | null> {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id: id.parse(orderId), depth: 0 })
  const next = NEXT_STATUS[order.status]
  if (!next) return null

  let table: number | undefined
  if (order.status === 'programmee' && !order.table && order.reservation) {
    // précommande lancée : on la place sur la table de la réservation
    const resId = typeof order.reservation === 'object' ? order.reservation.id : order.reservation
    const reservation = await payload.findByID({ collection: 'reservations', id: resId, depth: 0 }).catch(() => null)
    const first = reservation?.tables?.[0]
    table = typeof first === 'object' ? first?.id : (first ?? undefined)
  }

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: next, ...(table ? { table } : {}) },
    depth: 1,
    user,
    overrideAccess: false,
  })
  return toBarOrder(updated)
}

export async function cancelOrder(orderId: number): Promise<BarOrder | null> {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  const updated = await payload.update({ collection: 'orders', id: id.parse(orderId), data: { status: 'annulee' }, depth: 1, user, overrideAccess: false })
  return toBarOrder(updated)
}

/** Encaissement en caisse confirmé par le staff. */
export async function markPaidAtCounter(orderId: number): Promise<BarOrder | null> {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  const updated = await payload.update({
    collection: 'orders',
    id: id.parse(orderId),
    data: { paymentStatus: 'payee', paymentMethod: 'caisse', paidAt: new Date().toISOString() },
    depth: 1,
    user,
    overrideAccess: false,
  })
  return toBarOrder(updated)
}

/** Rupture de stock rapide depuis le bar. */
export async function setAvailability(itemId: number, available: boolean): Promise<void> {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  await payload.update({ collection: 'menu-items', id: id.parse(itemId), data: { available: z.boolean().parse(available) }, user, overrideAccess: false })
  revalidatePath('/carte')
  revalidatePath('/')
}
