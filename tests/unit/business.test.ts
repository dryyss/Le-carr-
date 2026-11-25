import { createHmac } from 'crypto'
import { beforeAll, describe, expect, it } from 'vitest'

import { containsTobacco, formatPrice, slugify } from '@/lib/content'
import { applyPoints, pointsForAmount } from '@/lib/loyalty'
import { formatPhoneFr, maskPhone, toE164 } from '@/lib/phone'
import { isValidPickup, pickupSlots } from '@/lib/pickup'
import { priceLines, PricingError, type ProductForPricing } from '@/lib/pricing'
import { eventWindow } from '@/lib/reservations'
import { hoursSummary } from '@/lib/site'
import { parisToUtc } from '@/lib/time'

beforeAll(() => {
  process.env.PAYLOAD_SECRET = 'secret-de-test'
})

const products: ProductForPricing[] = [
  { id: 1, title: 'Burger mix', price: 1450, tags: ['signature'] },
  {
    id: 2,
    title: 'Milkshake à composer',
    price: 750,
    options: [
      { name: 'Oreo', supplement: 0 },
      { name: '2e ingrédient', supplement: 200 },
    ],
  },
  { id: 3, title: 'Heineken', price: 1000, tags: ['alcool'] },
  { id: 4, title: 'Tiramisu', price: 500, available: false },
]

describe('calcul des prix (côté serveur)', () => {
  it('additionne prix, options et quantités', () => {
    const { lines, total } = priceLines(products, [
      { menuItemId: 1, qty: 2, options: [] },
      { menuItemId: 2, qty: 1, options: ['Oreo', '2e ingrédient'] },
    ])
    expect(lines[1].unitPrice).toBe(950)
    expect(lines[1].options).toBe('Oreo, 2e ingrédient')
    expect(total).toBe(2 * 1450 + 950)
  })

  it('ignore tout prix envoyé par le navigateur : seule la carte fait foi', () => {
    const { total } = priceLines(products, [{ menuItemId: 1, qty: 1, options: [], price: 1 } as never])
    expect(total).toBe(1450)
  })

  it('refuse un produit en rupture, une option inconnue, un panier vide', () => {
    expect(() => priceLines(products, [{ menuItemId: 4, qty: 1, options: [] }])).toThrow(PricingError)
    expect(() => priceLines(products, [{ menuItemId: 2, qty: 1, options: ['Caviar'] }])).toThrow(/Option inconnue/)
    expect(() => priceLines(products, [])).toThrow(/vide/)
  })

  it('limite à 30 articles par commande', () => {
    expect(() => priceLines(products, [{ menuItemId: 1, qty: 31, options: [] }])).toThrow(/30 articles/)
  })

  it('refuse l’alcool à emporter', () => {
    expect(() => priceLines(products, [{ menuItemId: 3, qty: 1, options: [] }], { excludeAlcohol: true })).toThrow(/alcoolisée/)
    expect(priceLines(products, [{ menuItemId: 3, qty: 1, options: [] }]).total).toBe(1000)
  })
})

describe('fidélité', () => {
  it('1 point par euro, arrondi à l’inférieur', () => {
    expect(pointsForAmount(2350, 1)).toBe(23)
    expect(pointsForAmount(999, 1)).toBe(9)
    expect(pointsForAmount(0, 1)).toBe(0)
    expect(pointsForAmount(1000, 2)).toBe(20)
  })

  it('refuse un solde négatif', () => {
    expect(applyPoints(100, -60)).toBe(40)
    expect(() => applyPoints(50, -60)).toThrow(/Solde insuffisant/)
  })
})

describe('téléphones', () => {
  it('normalise au format E.164', () => {
    expect(toE164('06 12 34 56 78')).toBe('+33612345678')
    expect(toE164('06.12.34.56.78')).toBe('+33612345678')
    expect(toE164('0033612345678')).toBe('+33612345678')
    expect(toE164('+33 6 12 34 56 78')).toBe('+33612345678')
    expect(toE164('12')).toBeNull()
    expect(toE164('bonjour')).toBeNull()
  })

  it('formate et masque', () => {
    expect(formatPhoneFr('+33612345678')).toBe('06 12 34 56 78')
    expect(maskPhone('+33612345678')).toContain('78')
    expect(maskPhone('+33612345678')).not.toContain('3456')
  })
})

describe('jetons signés', () => {
  it('valide le bon jeton, refuse un jeton modifié ou absent', async () => {
    const { reservationToken, verifyReservationToken, orderToken, verifyOrderToken } = await import('@/lib/tokens')
    const t = reservationToken('LC-AB12')
    expect(verifyReservationToken('LC-AB12', t)).toBe(true)
    expect(verifyReservationToken('LC-AB13', t)).toBe(false)
    expect(verifyReservationToken('LC-AB12', `${t}x`)).toBe(false)
    expect(verifyReservationToken('LC-AB12', null)).toBe(false)
    expect(verifyOrderToken(42, orderToken(42))).toBe(true)
    expect(verifyOrderToken(43, orderToken(42))).toBe(false)
    // un jeton de réservation ne vaut pas pour une commande
    expect(verifyOrderToken('LC-AB12', t)).toBe(false)
  })
})

describe('signature des webhooks Stripe', () => {
  it('accepte une signature valide et récente, refuse le reste', async () => {
    const { verifyStripeSignature } = await import('@/lib/payment')
    const body = '{"type":"checkout.session.completed"}'
    const t = Math.floor(Date.now() / 1000)
    const sig = createHmac('sha256', 'whsec_test').update(`${t}.${body}`).digest('hex')
    expect(verifyStripeSignature(body, `t=${t},v1=${sig}`, 'whsec_test')).toBe(true)
    expect(verifyStripeSignature(body, `t=${t},v1=${sig}`, 'autre_secret')).toBe(false)
    expect(verifyStripeSignature(`${body} `, `t=${t},v1=${sig}`, 'whsec_test')).toBe(false)
    const old = t - 3600
    const oldSig = createHmac('sha256', 'whsec_test').update(`${old}.${body}`).digest('hex')
    expect(verifyStripeSignature(body, `t=${old},v1=${oldSig}`, 'whsec_test')).toBe(false)
    expect(verifyStripeSignature(body, null, 'whsec_test')).toBe(false)
  })
})

const everyDay = {
  openingHours: (['0', '1', '2', '3', '4', '5', '6'] as const).map((day) => ({ day, open: '18:00', close: '02:00' })),
  closures: [],
}

describe('créneaux de retrait à emporter', () => {
  it('commencent 30 min après maintenant, par quart d’heure, et finissent 30 min avant la fermeture', () => {
    const now = parisToUtc('2026-12-04', 19 * 60 + 7) // 19:07
    const days = pickupSlots(everyDay, now)
    expect(days[0].date).toBe('2026-12-04')
    expect(days[0].times[0].label).toBe('19:45')
    expect(days[0].times.at(-1)?.label).toBe('01:30')
    expect(isValidPickup(everyDay, '2026-12-04', 19 * 60 + 45, now)).toBe(true)
    expect(isValidPickup(everyDay, '2026-12-04', 19 * 60 + 15, now)).toBe(false)
  })

  it('à 1 h du matin, propose la fin de soirée puis la prochaine ouverture', () => {
    const now = parisToUtc('2026-12-05', 60) // samedi 01:00, plage du vendredi
    const days = pickupSlots(everyDay, now)
    expect(days[0].date).toBe('2026-12-04')
    expect(days[0].times.map((t) => t.label)).toEqual(['01:30'])
    expect(days[1].date).toBe('2026-12-05')
    expect(days[1].times[0].label).toBe('18:00')
  })
})

describe('événements', () => {
  it('fenêtre en minutes de la date de service', () => {
    const w = eventWindow({ startsAt: parisToUtc('2026-12-04', 21 * 60).toISOString(), endsAt: parisToUtc('2026-12-05', 60).toISOString() })
    expect(w).toEqual({ date: '2026-12-04', start: 21 * 60, end: 25 * 60 })
  })

  it('un événement qui démarre après minuit appartient à la soirée de la veille', () => {
    const w = eventWindow({ startsAt: parisToUtc('2026-12-05', 30).toISOString(), endsAt: null })
    expect(w.date).toBe('2026-12-04')
    expect(w.start).toBe(24 * 60 + 30)
  })
})

describe('contenus', () => {
  it('loi Evin : détecte les produits du tabac', () => {
    expect(containsTobacco('Chicha pomme')).toBe(true)
    expect(containsTobacco('Formule narguilé')).toBe(true)
    expect(containsTobacco('Tarte au daim')).toBe(false)
    expect(containsTobacco('Ocean Blue')).toBe(false)
  })

  it('slug et prix', () => {
    expect(slugify('Pâtes & Burgers !')).toBe('pates-burgers')
    expect(formatPrice(1450).replace(/\s/g, ' ')).toBe('14,50 €')
  })

  it('résumé des horaires', () => {
    expect(hoursSummary(everyDay.openingHours)).toEqual(['7j/7, 18h à 2h'])
    expect(hoursSummary([])).toEqual(['Horaires à venir'])
  })
})
