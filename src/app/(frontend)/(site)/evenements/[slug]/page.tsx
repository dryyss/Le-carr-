import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Button } from '@/components/ui/button'
import { getPayloadClient } from '@/lib/payload'
import { mediaOf } from '@/lib/queries'
import { eventCoversTaken } from '@/lib/reservations'
import { formatDateTimeFr, formatTimeFr } from '@/lib/time'
import { eventCoverImage } from '@/lib/visuals'

export const revalidate = 60

const getEvent = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = await getEvent((await params).slug)
  if (!event) return {}
  const cover = mediaOf(event.cover)
  return {
    title: event.title,
    description: event.excerpt ?? `${event.title} au Carré, ${formatDateTimeFr(event.startsAt)}.`,
    openGraph: cover ? { images: [{ url: cover.url!, alt: cover.alt }] } : undefined,
  }
}

function hasEnded(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEvent((await params).slug)
  if (!event) notFound()
  const cover = eventCoverImage(event.type, event.cover)
  const past = hasEnded(event.endsAt ?? event.startsAt)

  let full = false
  if (event.bookable && event.capacity) {
    const payload = await getPayloadClient()
    full = (await eventCoversTaken(payload, event.id)) >= event.capacity
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/evenements" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">
        ← Tous les événements
      </Link>
      <h1 className="mb-3 mt-6 text-5xl sm:text-6xl">{event.title}</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        <span className="capitalize-first">{formatDateTimeFr(event.startsAt)}</span>
        {event.endsAt && ` jusqu’à ${formatTimeFr(event.endsAt)}`}
      </p>
      <div className="frame relative mb-10 aspect-16/9 overflow-hidden">
        <Image src={cover.url} alt={cover.alt} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
      </div>
      {event.description && (
        <div className="prose-lc space-y-4 text-lg leading-relaxed text-foreground/90">
          <RichText data={event.description} />
        </div>
      )}
      <div className="mt-12 flex flex-wrap gap-3">
        {event.bookable && !past && !full && (
          <Button asChild size="lg">
            <Link href={`/reserver?evenement=${event.slug}`}>Réserver pour cet événement</Link>
          </Button>
        )}
        {full && <p className="text-accent">Complet en ligne. Appelez-nous pour la liste d’attente.</p>}
        {!event.bookable && !past && (
          <Button asChild size="lg" variant="outline">
            <Link href="/reserver">Réserver une table</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
