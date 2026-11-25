import type { Setting } from '@/payload-types'

import { DAYS } from '@/globals/Settings'

import { formatHourFr, parseHHMM } from './time'

type Hours = NonNullable<Setting['openingHours']>

/** Résumé lisible : « 7j/7, 18h à 2h » ou une ligne par plage. */
export function hoursSummary(hours: Hours | null | undefined): string[] {
  if (!hours?.length) return ['Horaires à venir']
  const label = (h: Hours[number]) => `${formatHourFr(parseHHMM(h.open))} à ${formatHourFr(parseHHMM(h.close))}`
  const days = new Set(hours.map((h) => h.day))
  const ranges = new Set(hours.map(label))
  if (days.size === 7 && ranges.size === 1) return [`7j/7, ${[...ranges][0]}`]
  return DAYS.flatMap((d) => {
    const forDay = hours.filter((h) => h.day === d.value)
    return forDay.length ? [`${d.label} : ${forDay.map(label).join(', ')}`] : [`${d.label} : fermé`]
  })
}

export function addressLine(s: Setting): string {
  const a = s.address
  return [a?.street, [a?.postalCode, a?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

export function mapsUrl(s: Setting): string {
  const q = s.geo?.lat && s.geo?.lng ? `${s.geo.lat},${s.geo.lng}` : `${s.name} ${addressLine(s)}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  google: 'Avis Google',
}
