import type { Metadata } from 'next'

import { toSectionViews } from '@/lib/menu-view'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { onlinePaymentAvailable } from '@/lib/payment'
import { getMenu } from '@/lib/queries'
import { eventWindow } from '@/lib/reservations'
import { formatDateTimeFr, todayParis } from '@/lib/time'

import { ReservationForm } from './ReservationForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Réserver une table',
  description: 'Réservez votre table au Carré en quelques secondes. Confirmation immédiate par SMS.',
}

export default async function ReserverPage({ searchParams }: { searchParams: Promise<{ evenement?: string }> }) {
  const { evenement } = await searchParams
  const [settings, menu] = await Promise.all([getSettings(), getMenu()])
  const payload = await getPayloadClient()

  let event: { slug: string; title: string; date: string; when: string } | null = null
  if (evenement) {
    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: evenement }, published: { equals: true }, bookable: { equals: true } },
      limit: 1,
      depth: 0,
    })
    if (docs[0]) {
      event = { slug: docs[0].slug!, title: docs[0].title, date: eventWindow(docs[0]).date, when: formatDateTimeFr(docs[0].startsAt) }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="kicker mb-3">Réservation</p>
      <h1 className="mb-3 text-5xl">Réserver une table</h1>
      <p className="mb-10 text-muted-foreground">Confirmation immédiate par SMS. Vous pourrez annuler en un clic.</p>
      <ReservationForm
        today={todayParis()}
        openingHours={settings.openingHours ?? []}
        closures={(settings.closures ?? []).map((c) => ({ date: String(c.date).slice(0, 10) }))}
        maxPartySize={settings.maxPartySizeOnline}
        event={event}
        sections={toSectionViews(menu)}
        onlinePayment={onlinePaymentAvailable()}
      />
    </div>
  )
}
