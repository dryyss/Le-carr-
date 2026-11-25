import { currentServiceDate, serviceWindows, type OpeningSettings } from './opening'
import { absMinutes, addDays, formatMinutes, parisNow } from './time'

export const PICKUP_STEP_MIN = 15
export const PICKUP_LEAD_MIN = 30

export type PickupDay = { date: string; times: { startMin: number; label: string }[] }

/**
 * Créneaux de retrait à emporter : par quart d'heure, au moins 30 min après maintenant,
 * jusqu'à 30 min avant la fermeture. Soirée en cours puis prochaine ouverture (2 jours max).
 */
export function pickupSlots(settings: OpeningSettings, at: Date = new Date(), maxDays = 2): PickupDay[] {
  const now = parisNow(at)
  const earliest = absMinutes(now.date, now.minutes) + PICKUP_LEAD_MIN
  const days: PickupDay[] = []
  const first = currentServiceDate(settings, at)
  for (let d = 0; d < 8 && days.length < maxDays; d++) {
    const date = addDays(first, d)
    const times: PickupDay['times'] = []
    for (const w of serviceWindows(settings, date)) {
      for (let m = Math.ceil(w.start / PICKUP_STEP_MIN) * PICKUP_STEP_MIN; m <= w.end - PICKUP_LEAD_MIN; m += PICKUP_STEP_MIN) {
        if (absMinutes(date, m) >= earliest) times.push({ startMin: m, label: formatMinutes(m) })
      }
    }
    if (times.length) days.push({ date, times })
  }
  return days
}

export function isValidPickup(settings: OpeningSettings, date: string, startMin: number, at: Date = new Date()): boolean {
  return pickupSlots(settings, at, 3).some((d) => d.date === date && d.times.some((t) => t.startMin === startMin))
}
