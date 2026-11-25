/**
 * Helpers de date en heure de Paris. Les serveurs Vercel tournent en UTC :
 * toute logique métier (créneaux, ouverture, anniversaires) passe par ici.
 *
 * Conventions :
 * - une date de service est une chaîne 'YYYY-MM-DD' (jour d'ouverture, même après minuit)
 * - une heure est un nombre de minutes depuis minuit de la date de service (peut dépasser 1440)
 */
export const TZ = 'Europe/Paris'

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function zonedParts(d: Date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(d).map((x) => [x.type, x.value]))
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Date et minutes (heure de Paris) d'un instant. */
export function parisNow(d: Date = new Date()): { date: string; minutes: number } {
  const p = zonedParts(d)
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, minutes: p.hour * 60 + p.minute }
}

export function todayParis(d: Date = new Date()): string {
  return parisNow(d).date
}

function ymd(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number)
  return [y, m, d]
}

/** Nombre de jours depuis l'epoch (sert à comparer des dates de service entre elles). */
export function dayNumber(date: string): number {
  const [y, m, d] = ymd(date)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = ymd(date)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** 0 = dimanche … 6 = samedi */
export function weekdayOf(date: string): number {
  const [y, m, d] = ymd(date)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Minutes absolues (référentiel commun à toutes les dates). */
export function absMinutes(date: string, minutes: number): number {
  return dayNumber(date) * 1440 + minutes
}

function offsetMinutes(at: Date): number {
  const p = zonedParts(at)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - at.getTime()) / 60_000)
}

/** Instant UTC correspondant à « date de service + minutes » à Paris. */
export function parisToUtc(date: string, minutes: number): Date {
  const [y, m, d] = ymd(date)
  const naive = Date.UTC(y, m - 1, d, 0, minutes)
  let guess = new Date(naive - offsetMinutes(new Date(naive)) * 60_000)
  // second passage pour les changements d'heure
  guess = new Date(naive - offsetMinutes(guess) * 60_000)
  return guess
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

export function formatMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** « 18h », « 18h30 », « 2h » */
export function formatHourFr(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h}h${pad(mm)}` : `${h}h`
}

export function formatDateFr(date: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const [y, m, d] = ymd(date)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...opts,
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

export function formatDateTimeFr(d: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  }).format(typeof d === 'string' ? new Date(d) : d)
}

export function formatTimeFr(d: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(
    typeof d === 'string' ? new Date(d) : d,
  )
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [y, m, d] = ymd(date)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}
