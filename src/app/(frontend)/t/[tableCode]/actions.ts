'use server'

import { z } from 'zod'

import { getCurrentCustomer } from '@/lib/customer-session'
import { currentServiceDate } from '@/lib/opening'
import { cartItemsSchema, findTableByQr, orderingClosedReason } from '@/lib/ordering'
import { createOrder, findOrCreateCustomer, OrderError } from '@/lib/orders'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { onlinePaymentAvailable, startPayment } from '@/lib/payment'
import { toE164 } from '@/lib/phone'
import { siteUrl } from '@/lib/site-url'

const orderInput = z.object({
  tableCode: z.string().min(1).max(8),
  token: z.string().min(1).max(64),
  items: cartItemsSchema,
  note: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  payOnline: z.boolean().default(false),
})

export type OrderResult = { ok: true; redirect: string } | { ok: false; error: string }

export async function submitOrder(input: z.input<typeof orderInput>): Promise<OrderResult> {
  const parsed = orderInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Commande invalide.' }
  const d = parsed.data

  const payload = await getPayloadClient()
  const settings = await getSettings()
  const table = await findTableByQr(payload, d.tableCode, d.token)
  if (!table) return { ok: false, error: 'QR code invalide. Demandez à l’équipe.' }
  const closed = orderingClosedReason(settings)
  if (closed) return { ok: false, error: closed }
  if (d.payOnline && !onlinePaymentAvailable()) return { ok: false, error: 'Le paiement en ligne n’est pas disponible. Choisissez la caisse.' }

  // client fidélité : session, sinon numéro saisi
  let customerId = (await getCurrentCustomer())?.id
  if (!customerId && d.phone) {
    const phone = toE164(d.phone)
    if (!phone) return { ok: false, error: 'Numéro de téléphone invalide (laissez vide si vous ne voulez pas de points).' }
    customerId = await findOrCreateCustomer(payload, phone)
  }

  const serviceDate = currentServiceDate(settings)
  try {
    const reservation = await payload.find({
      collection: 'reservations',
      where: { date: { equals: serviceDate }, tables: { in: [table.id] }, status: { in: ['confirmee', 'arrivee'] } },
      limit: 1,
      depth: 0,
    })
    const order = await createOrder(payload, {
      type: 'table',
      serviceDate,
      items: d.items,
      note: d.note,
      customerId,
      tableId: table.id,
      reservationId: reservation.docs[0]?.id,
      payOnline: d.payOnline,
    })
    const tracking = `${siteUrl}/t/${encodeURIComponent(table.code)}/commande/${order.id}?k=${encodeURIComponent(d.token)}`
    if (d.payOnline) {
      const url = await startPayment(payload, order, { success: `${tracking}&paiement=ok`, cancel: `${tracking}&paiement=annule` })
      return { ok: true, redirect: url }
    }
    return { ok: true, redirect: tracking }
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, error: err.message }
    payload.logger.error({ err, msg: 'Commande à table' })
    return { ok: false, error: 'La commande n’est pas passée. Réessayez ou appelez un serveur.' }
  }
}
