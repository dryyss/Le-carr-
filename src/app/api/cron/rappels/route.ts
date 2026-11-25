import { isAuthorizedCron } from '@/lib/cron'
import { sendReservationReminder } from '@/lib/notify'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const REMINDER_BEFORE_MS = 3 * 3600_000

/**
 * Rappel SMS 3 h avant chaque réservation confirmée. À appeler toutes les 15 min.
 * Idempotent : smsReminderSentAt est posé à l'envoi, une résa n'est jamais rappelée deux fois.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response('Non autorisé', { status: 401 })
  const payload = await getPayloadClient()
  const now = Date.now()
  const { docs } = await payload.find({
    collection: 'reservations',
    where: {
      status: { equals: 'confirmee' },
      smsReminderSentAt: { exists: false },
      startsAt: { greater_than: new Date(now).toISOString(), less_than_equal: new Date(now + REMINDER_BEFORE_MS).toISOString() },
    },
    limit: 200,
    depth: 0,
    pagination: false,
  })

  let sent = 0
  for (const r of docs) {
    // on marque d'abord : si deux exécutions se croisent, la seconde ne renverra pas
    await payload.update({
      collection: 'reservations',
      id: r.id,
      data: { smsReminderSentAt: new Date().toISOString() },
      context: { skipNotify: true },
    })
    if (await sendReservationReminder(payload, r)) sent++
  }
  return Response.json({ checked: docs.length, sent })
}
