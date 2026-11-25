'use server'

import { z } from 'zod'

import { getCurrentCustomer } from '@/lib/customer-session'
import { cartItemsSchema } from '@/lib/ordering'
import { createOrder, findOrCreateCustomer, OrderError, publicOrderUrl } from '@/lib/orders'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { onlinePaymentAvailable, startPayment } from '@/lib/payment'
import { isValidPickup } from '@/lib/pickup'
import { toE164 } from '@/lib/phone'
import { isValidDate, parisToUtc } from '@/lib/time'

const input = z.object({
  items: cartItemsSchema,
  date: z.string().refine(isValidDate),
  startMin: z.number().int().min(0).max(2880),
  name: z.string().trim().min(2, 'Indiquez votre nom').max(80),
  phone: z.string().trim().max(30),
  note: z.string().trim().max(300).optional(),
  payOnline: z.boolean().default(false),
  website: z.string().max(0).optional(),
})

export type TakeawayResult = { ok: true; redirect: string } | { ok: false; error: string }

export async function submitTakeaway(raw: z.input<typeof input>): Promise<TakeawayResult> {
  const parsed = input.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Commande invalide.' }
  const d = parsed.data
  if (d.website) return { ok: false, error: 'Commande impossible.' }
  const phone = toE164(d.phone)
  if (!phone) return { ok: false, error: 'Numéro de téléphone invalide.' }

  const settings = await getSettings()
  if (!settings.orderingEnabled) return { ok: false, error: 'La commande en ligne est momentanément suspendue.' }
  if (!isValidPickup(settings, d.date, d.startMin)) return { ok: false, error: 'Ce créneau de retrait n’est plus disponible. Choisissez-en un autre.' }
  if (d.payOnline && !onlinePaymentAvailable()) return { ok: false, error: 'Le paiement en ligne n’est pas disponible.' }

  const payload = await getPayloadClient()
  const customerId = (await getCurrentCustomer())?.id ?? (await findOrCreateCustomer(payload, phone, d.name.split(' ')[0]))
  try {
    const order = await createOrder(payload, {
      type: 'emporter',
      serviceDate: d.date,
      items: d.items,
      note: d.note,
      customerId,
      scheduledFor: parisToUtc(d.date, d.startMin),
      contactName: d.name,
      contactPhone: phone,
      payOnline: d.payOnline,
    })
    const tracking = publicOrderUrl(order.id)
    if (d.payOnline) {
      return { ok: true, redirect: await startPayment(payload, order, { success: `${tracking}&paiement=ok`, cancel: `${tracking}&paiement=annule` }) }
    }
    return { ok: true, redirect: tracking }
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, error: err.message }
    payload.logger.error({ err, msg: 'Commande à emporter' })
    return { ok: false, error: 'La commande n’est pas passée. Réessayez ou appelez-nous.' }
  }
}
