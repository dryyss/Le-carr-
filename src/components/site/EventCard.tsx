import Image from 'next/image'
import Link from 'next/link'

import { SpotlightCard } from '@/components/motion/SpotlightCard'
import type { Event } from '@/payload-types'

import { formatDateTimeFr } from '@/lib/time'
import { eventCoverImage } from '@/lib/visuals'

const TYPE_LABEL: Record<Event['type'], string> = {
  soiree_theme: 'Soirée',
  match: 'Match',
  autre: 'Événement',
}

export function EventCard({ event }: { event: Event }) {
  const cover = eventCoverImage(event.type, event.cover)
  return (
    <SpotlightCard cursorLabel="VOIR" className="reveal frame border border-border bg-card">
      <Link href={`/evenements/${event.slug}`} className="group block">
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent opacity-70" />
        </div>
        <div className="space-y-2 p-5">
          <p className="kicker text-accent">{TYPE_LABEL[event.type]}</p>
          <h3 className="text-2xl transition-colors group-hover:text-foreground">{event.title}</h3>
          <p className="text-sm capitalize text-muted-foreground">{formatDateTimeFr(event.startsAt)}</p>
          {event.excerpt && <p className="text-sm text-muted-foreground">{event.excerpt}</p>}
        </div>
      </Link>
    </SpotlightCard>
  )
}
