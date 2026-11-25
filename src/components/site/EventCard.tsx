import Image from 'next/image'
import Link from 'next/link'

import type { Event } from '@/payload-types'

import { mediaOf } from '@/lib/queries'
import { formatDateTimeFr } from '@/lib/time'

const TYPE_LABEL: Record<Event['type'], string> = {
  soiree_theme: 'Soirée',
  match: 'Match',
  autre: 'Événement',
}

export function EventCard({ event }: { event: Event }) {
  const cover = mediaOf(event.cover)
  return (
    <Link href={`/evenements/${event.slug}`} className="group frame block border border-border bg-card transition-colors hover:border-foreground/40">
      <div className="relative aspect-16/10 overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover.url!}
            alt={cover.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl font-light uppercase tracking-[0.2em] text-foreground/15">{TYPE_LABEL[event.type]}</span>
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <p className="kicker text-accent">{TYPE_LABEL[event.type]}</p>
        <h3 className="text-2xl">{event.title}</h3>
        <p className="text-sm capitalize text-muted-foreground">{formatDateTimeFr(event.startsAt)}</p>
        {event.excerpt && <p className="text-sm text-muted-foreground">{event.excerpt}</p>}
      </div>
    </Link>
  )
}
