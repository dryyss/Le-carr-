import { isAuthorizedCron } from '@/lib/cron'
import { getPayloadClient } from '@/lib/payload'
import { sendSms } from '@/lib/sms'
import { todayParis } from '@/lib/time'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Tâches quotidiennes (Vercel Cron, une fois par jour) :
 * - bonus anniversaire (une fois par an) + SMS si le client a accepté les offres
 * - expiration des points sans activité depuis la durée de validité
 * - purge des codes de connexion expirés
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response('Non autorisé', { status: 401 })
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings' })
  const today = todayParis()
  const [year, month, day] = today.split('-').map(Number)
  const bonus = settings.loyalty?.birthdayBonus ?? 0

  // anniversaires
  let birthdays = 0
  if (bonus > 0) {
    const { docs } = await payload.find({
      collection: 'customers',
      where: {
        birthdayDay: { equals: day },
        birthdayMonth: { equals: month },
        or: [{ lastBirthdayBonusYear: { exists: false } }, { lastBirthdayBonusYear: { less_than: year } }],
      },
      limit: 500,
      depth: 0,
      pagination: false,
    })
    for (const c of docs) {
      await payload.update({ collection: 'customers', id: c.id, data: { lastBirthdayBonusYear: year } })
      await payload.create({
        collection: 'loyalty-transactions',
        data: { customer: c.id, type: 'bonus_anniversaire', points: bonus, reason: `Anniversaire ${year}` },
      })
      if (c.optInSms) {
        await sendSms(payload, {
          to: c.phone,
          type: 'anniversaire',
          content: `Joyeux anniversaire${c.firstName ? ` ${c.firstName}` : ''} ! Le Carré vous offre ${bonus} points de fidélité, à utiliser sur place.`,
        })
      }
      birthdays++
    }
  }

  // expiration des points
  let expired = 0
  const months = settings.loyalty?.pointsValidityMonths ?? 0
  if (months > 0) {
    const limitDate = new Date()
    limitDate.setMonth(limitDate.getMonth() - months)
    const { docs } = await payload.find({
      collection: 'customers',
      where: { points: { greater_than: 0 }, lastActivityAt: { less_than: limitDate.toISOString() } },
      limit: 500,
      depth: 0,
      pagination: false,
    })
    for (const c of docs) {
      await payload.create({
        collection: 'loyalty-transactions',
        data: { customer: c.id, type: 'ajustement', points: -(c.points ?? 0), reason: `Points expirés (${months} mois sans activité)` },
      })
      expired++
    }
  }

  const purged = await payload.delete({
    collection: 'otp-codes',
    where: { expiresAt: { less_than: new Date(Date.now() - 86_400_000).toISOString() } },
  })

  return Response.json({ birthdays, expired, otpPurged: purged.docs.length })
}
