import { describe, expect, it } from 'vitest'

import { findTablesFor, getSlots, pickTables, type SlotSettings, type TableLite } from '@/lib/availability'
import { currentServiceDate, isOpenAt, serviceWindows } from '@/lib/opening'
import { parisToUtc } from '@/lib/time'

// 2026-12-04 est un vendredi
const FRIDAY = '2026-12-04'
const SATURDAY = '2026-12-05'

const settings: SlotSettings = {
  openingHours: [
    { day: '5', open: '18:00', close: '02:00' },
    { day: '6', open: '18:00', close: '02:00' },
  ],
  closures: [{ date: '2026-12-25' }],
  slotIntervalMin: 30,
  defaultDurationMin: 120,
  bookingCutoffMin: 60,
}

const tables: TableLite[] = [
  { id: 1, zone: 'salle', capacityMin: 1, capacityMax: 2 },
  { id: 2, zone: 'salle', capacityMin: 2, capacityMax: 4 },
  { id: 3, zone: 'salle', capacityMin: 2, capacityMax: 4 },
  { id: 4, zone: 'terrasse', capacityMin: 4, capacityMax: 6 },
]

// « maintenant » bien avant la date testée, pour ne pas être gêné par le délai minimum
const EARLY = new Date('2026-12-01T10:00:00Z')

describe('horaires', () => {
  it('une fermeture après minuit appartient à la date d’ouverture', () => {
    expect(serviceWindows(settings, FRIDAY)).toEqual([{ start: 18 * 60, end: 26 * 60 }])
  })

  it('fermeture exceptionnelle : aucune plage', () => {
    expect(serviceWindows(settings, '2026-12-25')).toEqual([])
  })

  it('samedi 01:30 : encore ouvert sur la plage du vendredi', () => {
    const at = parisToUtc(SATURDAY, 90)
    expect(isOpenAt(settings, at)).toBe(true)
    expect(currentServiceDate(settings, at)).toBe(FRIDAY)
  })

  it('samedi 03:00 : fermé, et la date de service est samedi', () => {
    const at = parisToUtc(SATURDAY, 180)
    expect(isOpenAt(settings, at)).toBe(false)
    expect(currentServiceDate(settings, at)).toBe(SATURDAY)
  })
})

describe('créneaux', () => {
  it('génère les créneaux de 18:00 à 00:00 (durée 2 h, fermeture 02:00)', () => {
    const slots = getSlots({ settings, date: FRIDAY, partySize: 2, tables, bookings: [], now: EARLY })
    expect(slots[0].time).toBe('18:00')
    expect(slots.at(-1)?.time).toBe('00:00')
    expect(slots.at(-1)?.startMin).toBe(24 * 60)
    expect(slots).toHaveLength(13)
  })

  it('respecte le délai minimum avant le créneau', () => {
    const now = parisToUtc(FRIDAY, 19 * 60 + 10) // 19:10, délai 60 min
    const slots = getSlots({ settings, date: FRIDAY, partySize: 2, tables, bookings: [], now })
    expect(slots[0].time).toBe('20:30')
  })

  it('jour fermé : aucun créneau', () => {
    expect(getSlots({ settings, date: '2026-12-07', partySize: 2, tables, bookings: [], now: EARLY })).toEqual([])
  })

  it('fenêtre d’événement : limite les départs', () => {
    const slots = getSlots({
      settings,
      date: FRIDAY,
      partySize: 2,
      tables,
      bookings: [],
      now: EARLY,
      window: { start: 21 * 60, end: 22 * 60 },
    })
    expect(slots.map((s) => s.time)).toEqual(['21:00', '21:30'])
  })
})

describe('attribution des tables', () => {
  it('choisit la plus petite table qui convient', () => {
    expect(pickTables(tables, 2)).toEqual([1])
    expect(pickTables(tables, 3)).toEqual([2])
    expect(pickTables(tables, 5)).toEqual([4])
  })

  it('combine 2 tables de la même zone si aucune ne suffit seule', () => {
    expect(pickTables(tables, 8)).toEqual([2, 3])
  })

  it('ne combine jamais deux zones différentes', () => {
    const t: TableLite[] = [
      { id: 1, zone: 'salle', capacityMin: 2, capacityMax: 4 },
      { id: 2, zone: 'terrasse', capacityMin: 2, capacityMax: 4 },
    ]
    expect(pickTables(t, 7)).toBeNull()
  })

  it('refuse une table occupée par une réservation qui chevauche', () => {
    const bookings = [{ date: FRIDAY, startMin: 20 * 60, durationMin: 120, tableIds: [1] }]
    expect(
      findTablesFor({ tables, bookings, date: FRIDAY, startMin: 21 * 60, durationMin: 120, partySize: 2 }),
    ).toEqual([2])
  })

  it('accepte une table libérée pile à l’heure (pas de chevauchement bord à bord)', () => {
    const bookings = [{ date: FRIDAY, startMin: 18 * 60, durationMin: 120, tableIds: [1] }]
    expect(
      findTablesFor({ tables, bookings, date: FRIDAY, startMin: 20 * 60, durationMin: 120, partySize: 2 }),
    ).toEqual([1])
  })

  it('tient compte d’une réservation de la veille qui déborde après minuit', () => {
    // résa du vendredi à 00:00 (minute 1440) : bloque un créneau du vendredi à 23:30 sur la même table
    const bookings = [{ date: FRIDAY, startMin: 24 * 60, durationMin: 120, tableIds: [1] }]
    expect(
      findTablesFor({ tables, bookings, date: FRIDAY, startMin: 23 * 60 + 30, durationMin: 120, partySize: 2 }),
    ).toEqual([2])
  })

  it('compare correctement deux dates de service différentes', () => {
    // une résa « samedi 00:30 » saisie sur la date du samedi minute 30 chevauche le vendredi minute 1470
    const bookings = [{ date: SATURDAY, startMin: 30, durationMin: 60, tableIds: [1] }]
    expect(
      findTablesFor({ tables, bookings, date: FRIDAY, startMin: 24 * 60, durationMin: 120, partySize: 2 }),
    ).toEqual([2])
  })

  it('créneau indisponible quand tout est pris', () => {
    const bookings = [{ date: FRIDAY, startMin: 18 * 60, durationMin: 480, tableIds: [1, 2, 3, 4] }]
    const slots = getSlots({ settings, date: FRIDAY, partySize: 2, tables, bookings, now: EARLY })
    expect(slots.every((s) => !s.available)).toBe(true)
  })
})
