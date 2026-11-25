import type { Payload, PayloadRequest } from 'payload'

import type { Event, Setting } from '@/payload-types'

import { BLOCKING_STATUSES, getSlots, type BookingLite, type Slot, type TableLite } from './availability'
import { addDays, parisNow } from './time'

export type EventWindow = { date: string; start: number; end: number }

/** Date de service et fenêtre (minutes) d'un événement, en heure de Paris. */
export function eventWindow(event: Pick<Event, 'startsAt' | 'endsAt'>): EventWindow {
  const s = parisNow(new Date(event.startsAt))
  let date = s.date
  let start = s.minutes
  if (start < 6 * 60) {
    // événement qui démarre après minuit : rattaché à la soirée de la veille
    date = addDays(date, -1)
    start += 1440
  }
  let end = start + 240
  if (event.endsAt) {
    const e = parisNow(new Date(event.endsAt))
    const diffDays = Math.round((Date.parse(`${e.date}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000)
    end = diffDays * 1440 + e.minutes
  }
  return { date, start, end: Math.max(end, start + 30) }
}

export async function loadBookingContext(payload: Payload, date: string, req?: PayloadRequest) {
  const [tablesRes, resRes] = await Promise.all([
    payload.find({ collection: 'tables', where: { active: { equals: true } }, limit: 500, depth: 0, pagination: false, req }),
    payload.find({
      collection: 'reservations',
      where: { date: { in: [addDays(date, -1), date, addDays(date, 1)] }, status: { in: [...BLOCKING_STATUSES] } },
      limit: 2000,
      depth: 0,
      pagination: false,
      req,
    }),
  ])
  const tables: TableLite[] = tablesRes.docs.map((t) => ({
    id: t.id,
    zone: t.zone,
    capacityMin: t.capacityMin,
    capacityMax: t.capacityMax,
  }))
  const bookings: BookingLite[] = resRes.docs.map((r) => ({
    date: r.date,
    startMin: r.startMin ?? 0,
    durationMin: r.durationMin,
    tableIds: (r.tables ?? []).map((t) => (typeof t === 'object' ? t.id : t)),
  }))
  return { tables, bookings, reservations: resRes.docs }
}

/** Couverts déjà réservés sur un événement. */
export async function eventCoversTaken(payload: Payload, eventId: number, req?: PayloadRequest): Promise<number> {
  const { docs } = await payload.find({
    collection: 'reservations',
    where: { event: { equals: eventId }, status: { in: [...BLOCKING_STATUSES] } },
    limit: 2000,
    depth: 0,
    pagination: false,
    select: { partySize: true },
    req,
  })
  return docs.reduce((s, r) => s + (r.partySize ?? 0), 0)
}

export async function computeSlots(args: {
  payload: Payload
  settings: Setting
  date: string
  partySize: number
  event?: Event | null
  req?: PayloadRequest
}): Promise<Slot[]> {
  const { tables, bookings } = await loadBookingContext(args.payload, args.date, args.req)
  const win = args.event ? eventWindow(args.event) : undefined
  if (win && win.date !== args.date) return []
  return getSlots({
    settings: {
      openingHours: args.settings.openingHours,
      closures: args.settings.closures,
      slotIntervalMin: args.settings.slotIntervalMin,
      defaultDurationMin: args.settings.defaultDurationMin,
      bookingCutoffMin: args.settings.bookingCutoffMin,
    },
    date: args.date,
    partySize: args.partySize,
    tables,
    bookings,
    window: win ? { start: win.start, end: win.end } : undefined,
  })
}
