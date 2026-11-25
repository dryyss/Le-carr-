'use server'

import { z } from 'zod'

import type { Event } from '@/payload-types'

import { withLock } from '@/lib/db-lock'
import { notifyReservationConfirmed } from '@/lib/notify'
import { cartItemsSchema } from '@/lib/ordering'
import { createOrder, OrderError } from '@/lib/orders'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { onlinePaymentAvailable, startPayment } from '@/lib/payment'
import { toE164 } from '@/lib/phone'
import { priceLines, PricingError } from '@/lib/pricing'
import { computeSlots, eventCoversTaken } from '@/lib/reservations'
import { siteUrl } from '@/lib/site-url'
import { isValidDate, parisToUtc, todayParis } from '@/lib/time'
import { reservationToken } from '@/lib/tokens'

const MAX_PER_PHONE_PER_DAY = 5

async function findEvent(slug: string | undefined | null): Promise<Event | null> {
  if (!slug) return null
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug }, published: { equals: true }, bookable: { equals: true } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

const slotsInput = z.object({
  date: z.string().refine(isValidDate),
  partySize: z.number().int().min(1).max(60),
  eventSlug: z.string().max(100).optional().nullable(),
})

export type SlotView = { time: string; available: boolean }

export async function getSlotsAction(input: z.input<typeof slotsInput>): Promise<{ slots: SlotView[]; error?: string }> {
  const parsed = slotsInput.safeParse(input)
  if (!parsed.success) return { slots: [], error: 'Demande invalide.' }
  const { date, partySize, eventSlug } = parsed.data
  const settings = await getSettings()
  if (partySize > settings.maxPartySizeOnline) return { slots: [], error: 'Groupe trop important pour une réservation en ligne.' }
  if (date < todayParis()) return { slots: [] }
  const payload = await getPayloadClient()
  const event = await findEvent(eventSlug)
  const slots = await computeSlots({ payload, settings, date, partySize, event })
  return { slots: slots.map((s) => ({ time: s.time, available: s.available })) }
}

const reservationInput = z.object({
  date: z.string().refine(isValidDate, 'Date invalide'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide'),
  partySize: z.coerce.number().int().min(1).max(60),
  name: z.string().trim().min(2, 'Indiquez votre nom').max(80),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const e = toE164(v)
      if (!e) ctx.addIssue({ code: 'custom', message: 'Numéro de téléphone invalide' })
      return e ?? ''
    }),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide').max(120)]).optional(),
  notes: z.string().trim().max(500).optional(),
  eventSlug: z.string().max(100).optional().nullable(),
  optInSms: z.boolean().default(false),
  optInEmail: z.boolean().default(false),
  website: z.string().max(0).optional(), // honeypot : doit rester vide
  // précommande facultative
  items: cartItemsSchema.optional(),
  payOnline: z.boolean().default(false),
})

export type ReservationResult = { ok: true; redirect: string } | { ok: false; error: string }

export async function createReservationAction(input: z.input<typeof reservationInput>): Promise<ReservationResult> {
  const parsed = reservationInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  const d = parsed.data
  if (d.website) return { ok: false, error: 'Réservation impossible.' }

  const settings = await getSettings()
  if (d.partySize > settings.maxPartySizeOnline) {
    return { ok: false, error: `Au-delà de ${settings.maxPartySizeOnline} personnes, faites une demande de privatisation.` }
  }

  const payload = await getPayloadClient()
  const since = parisToUtc(todayParis(), 0).toISOString()
  const recent = await payload.count({
    collection: 'reservations',
    where: { phone: { equals: d.phone }, createdAt: { greater_than_equal: since } },
  })
  if (recent.totalDocs >= MAX_PER_PHONE_PER_DAY) {
    return { ok: false, error: 'Trop de réservations aujourd’hui avec ce numéro. Appelez-nous directement.' }
  }

  const event = await findEvent(d.eventSlug)

  // précommande : on vérifie le panier avant de bloquer la table
  if (d.items?.length) {
    if (d.payOnline && !onlinePaymentAvailable()) return { ok: false, error: 'Le paiement en ligne n’est pas disponible.' }
    const ids = [...new Set(d.items.map((i) => i.menuItemId))]
    const { docs: products } = await payload.find({ collection: 'menu-items', where: { id: { in: ids } }, limit: ids.length, depth: 0, pagination: false })
    try {
      priceLines(products, d.items)
    } catch (e) {
      if (e instanceof PricingError) return { ok: false, error: e.message }
      throw e
    }
  }

  // client fidélité existant (ou créé si la personne accepte les offres)
  const existing = await payload.find({ collection: 'customers', where: { phone: { equals: d.phone } }, limit: 1, depth: 0 })
  let customerId = existing.docs[0]?.id
  if (!customerId && (d.optInSms || d.optInEmail)) {
    const [firstName, ...rest] = d.name.split(' ')
    const c = await payload.create({
      collection: 'customers',
      data: { phone: d.phone, firstName, lastName: rest.join(' ') || undefined, email: d.email || undefined, optInSms: d.optInSms, optInEmail: d.optInEmail },
    })
    customerId = c.id
  }

  try {
    const reservation = await withLock(payload, 'reservations', async (req) => {
      const slots = await computeSlots({ payload, settings, date: d.date, partySize: d.partySize, event, req })
      const slot = slots.find((s) => s.time === d.time)
      if (!slot?.available || !slot.tableIds) throw new UserError('Ce créneau vient d’être pris. Choisissez-en un autre.')
      if (event?.capacity) {
        const taken = await eventCoversTaken(payload, event.id, req)
        if (taken + d.partySize > event.capacity) throw new UserError('L’événement est complet pour ce nombre de personnes.')
      }
      return payload.create({
        collection: 'reservations',
        data: {
          date: d.date,
          startTime: d.time,
          durationMin: settings.defaultDurationMin,
          partySize: d.partySize,
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          notes: d.notes || undefined,
          tables: slot.tableIds.map(Number),
          status: 'confirmee',
          source: 'web',
          event: event?.id,
          customer: customerId,
        },
        context: { skipNotify: true },
        req,
      })
    })

    // notifications après validation de la transaction
    await notifyReservationConfirmed(payload, reservation)
    await payload.update({
      collection: 'reservations',
      id: reservation.id,
      data: { smsConfirmSentAt: new Date().toISOString() },
      context: { skipNotify: true },
    })
    const confirmation = `${siteUrl}/reserver/confirmation/${reservation.ref}?t=${reservationToken(reservation.ref!)}`

    if (d.items?.length) {
      const order = await createOrder(payload, {
        type: 'precommande',
        serviceDate: d.date,
        items: d.items,
        customerId,
        reservationId: reservation.id,
        scheduledFor: reservation.startsAt ? new Date(reservation.startsAt) : undefined,
        contactName: d.name,
        contactPhone: d.phone,
        note: d.notes,
        payOnline: d.payOnline,
      })
      if (d.payOnline) {
        return { ok: true, redirect: await startPayment(payload, order, { success: `${confirmation}&paiement=ok`, cancel: `${confirmation}&paiement=annule` }) }
      }
    }
    return { ok: true, redirect: confirmation }
  } catch (err) {
    if (err instanceof UserError || err instanceof OrderError) return { ok: false, error: err.message }
    payload.logger.error({ err, msg: 'Création de réservation' })
    return { ok: false, error: 'Une erreur est survenue. Réessayez ou appelez-nous.' }
  }
}

class UserError extends Error {}
