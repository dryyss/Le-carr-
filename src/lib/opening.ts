import { absMinutes, addDays, parisNow, parseHHMM, weekdayOf } from './time'

export type OpeningHour = { day: string; open: string; close: string }
export type Closure = { date: string }

export type OpeningSettings = {
  openingHours?: OpeningHour[] | null
  closures?: Closure[] | null
}

/** Plage d'ouverture d'une date de service, en minutes depuis minuit de cette date. */
export type Window = { start: number; end: number }

function closureDates(settings: OpeningSettings): Set<string> {
  return new Set((settings.closures ?? []).map((c) => String(c.date).slice(0, 10)))
}

/**
 * Plages d'ouverture d'une date de service.
 * Une fermeture inférieure ou égale à l'ouverture passe minuit (18:00 à 02:00 => 1080 à 1560).
 */
export function serviceWindows(settings: OpeningSettings, date: string): Window[] {
  if (closureDates(settings).has(date)) return []
  const weekday = String(weekdayOf(date))
  return (settings.openingHours ?? [])
    .filter((h) => h.day === weekday)
    .map((h) => {
      const start = parseHHMM(h.open)
      let end = parseHHMM(h.close)
      if (end <= start) end += 1440
      return { start, end }
    })
    .sort((a, b) => a.start - b.start)
}

/** Ouvert à l'instant donné ? Tient compte de la plage de la veille qui déborde après minuit. */
export function isOpenAt(settings: OpeningSettings, at: Date = new Date()): boolean {
  const now = parisNow(at)
  const nowAbs = absMinutes(now.date, now.minutes)
  for (const date of [addDays(now.date, -1), now.date]) {
    for (const w of serviceWindows(settings, date)) {
      if (nowAbs >= absMinutes(date, w.start) && nowAbs < absMinutes(date, w.end)) return true
    }
  }
  return false
}

/** Date de service en cours (la veille si on est après minuit dans une plage de la veille). */
export function currentServiceDate(settings: OpeningSettings, at: Date = new Date()): string {
  const now = parisNow(at)
  const nowAbs = absMinutes(now.date, now.minutes)
  const yesterday = addDays(now.date, -1)
  for (const w of serviceWindows(settings, yesterday)) {
    if (nowAbs < absMinutes(yesterday, w.end)) return yesterday
  }
  return now.date
}
