import { serviceWindows, type OpeningSettings } from './opening'
import { absMinutes, formatMinutes, parisNow } from './time'

export type TableId = number | string

export type TableLite = {
  id: TableId
  zone: string
  capacityMin: number
  capacityMax: number
}

/** Réservation qui occupe des tables (statuts en_attente, confirmee, arrivee). */
export type BookingLite = {
  date: string
  startMin: number
  durationMin: number
  tableIds: TableId[]
}

export type SlotSettings = OpeningSettings & {
  slotIntervalMin: number
  defaultDurationMin: number
  bookingCutoffMin: number
}

export type Slot = {
  time: string
  startMin: number
  available: boolean
  tableIds: TableId[] | null
}

/** Statuts qui bloquent une table. */
export const BLOCKING_STATUSES = ['en_attente', 'confirmee', 'arrivee'] as const

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/** Tables occupées (au moins en partie) sur l'intervalle absolu donné. */
function busyTables(bookings: BookingLite[], start: number, end: number): Set<string> {
  const busy = new Set<string>()
  for (const b of bookings) {
    const bStart = absMinutes(b.date, b.startMin)
    if (overlaps(start, end, bStart, bStart + b.durationMin)) {
      for (const id of b.tableIds) busy.add(String(id))
    }
  }
  return busy
}

/**
 * Choisit les tables pour un groupe : la plus petite table qui convient,
 * sinon la combinaison de 2 tables de la même zone avec la plus petite capacité totale.
 */
export function pickTables(free: TableLite[], partySize: number): TableId[] | null {
  const singles = free
    .filter((t) => t.capacityMin <= partySize && partySize <= t.capacityMax)
    .sort((a, b) => a.capacityMax - b.capacityMax || a.capacityMin - b.capacityMin)
  if (singles.length) return [singles[0].id]

  let best: { ids: TableId[]; cap: number } | null = null
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      const a = free[i]
      const b = free[j]
      if (a.zone !== b.zone) continue
      const cap = a.capacityMax + b.capacityMax
      // une combinaison n'a de sens que si aucune des deux tables ne suffit seule
      if (cap < partySize || a.capacityMax >= partySize || b.capacityMax >= partySize) continue
      if (!best || cap < best.cap) best = { ids: [a.id, b.id], cap }
    }
  }
  return best?.ids ?? null
}

export function findTablesFor(args: {
  tables: TableLite[]
  bookings: BookingLite[]
  date: string
  startMin: number
  durationMin: number
  partySize: number
}): TableId[] | null {
  const start = absMinutes(args.date, args.startMin)
  const busy = busyTables(args.bookings, start, start + args.durationMin)
  const free = args.tables.filter((t) => !busy.has(String(t.id)))
  return pickTables(free, args.partySize)
}

/**
 * Créneaux d'une date de service. Un créneau est proposé s'il démarre dans une plage d'ouverture,
 * se termine avant la fermeture et respecte le délai minimum (bookingCutoffMin).
 * `window` permet de restreindre aux horaires d'un événement.
 */
export function getSlots(args: {
  settings: SlotSettings
  date: string
  partySize: number
  tables: TableLite[]
  bookings: BookingLite[]
  now?: Date
  durationMin?: number
  window?: { start: number; end: number }
}): Slot[] {
  const { settings, date, partySize } = args
  const duration = args.durationMin ?? settings.defaultDurationMin
  const step = Math.max(5, settings.slotIntervalMin)
  const now = parisNow(args.now ?? new Date())
  const earliest = absMinutes(now.date, now.minutes) + settings.bookingCutoffMin

  const slots: Slot[] = []
  for (const w of serviceWindows(settings, date)) {
    // dernier départ possible : la réservation doit finir avant la fermeture
    // (et, pour un événement, commencer avant la fin de l'événement)
    const from = args.window ? Math.max(w.start, args.window.start) : w.start
    const lastStart = args.window ? Math.min(w.end - duration, args.window.end - 1) : w.end - duration
    for (let start = from; start <= lastStart; start += step) {
      if (absMinutes(date, start) < earliest) continue
      const tableIds = findTablesFor({
        tables: args.tables,
        bookings: args.bookings,
        date,
        startMin: start,
        durationMin: duration,
        partySize,
      })
      slots.push({ time: formatMinutes(start), startMin: start, available: Boolean(tableIds), tableIds })
    }
  }
  return slots
}
