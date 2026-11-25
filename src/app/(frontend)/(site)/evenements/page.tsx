import type { Metadata } from 'next'
import Link from 'next/link'

import { EventCard } from '@/components/site/EventCard'
import { getUpcomingEvents } from '@/lib/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Événements',
  description: 'Soirées à thème, matchs et événements au Carré, à Saint-Brice-sous-Forêt.',
}

export default async function EvenementsPage() {
  const events = await getUpcomingEvents(24)
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="kicker mb-3">Agenda</p>
      <h1 className="mb-10 text-5xl sm:text-6xl">Événements</h1>
      {events.length === 0 ? (
        <p className="text-muted-foreground">
          Pas d’événement programmé pour l’instant. Suivez-nous sur les réseaux, ou{' '}
          <Link href="/privatisation" className="underline">
            organisez le vôtre
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}
