import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getPayloadClient } from '@/lib/payload'
import { formatDateFr } from '@/lib/time'
import { verifyReservationToken } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Annuler ma réservation', robots: { index: false } }

const CANCELLABLE = ['en_attente', 'confirmee']

async function findReservation(ref: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'reservations', where: { ref: { equals: ref } }, limit: 1, depth: 0 })
  return { payload, r: docs[0] }
}

export default async function AnnulerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { ref } = await params
  const { t } = await searchParams
  if (!verifyReservationToken(ref, t)) notFound()
  const { r } = await findReservation(ref)
  if (!r) notFound()

  async function cancel() {
    'use server'
    if (!verifyReservationToken(ref, t)) return
    const { payload, r: current } = await findReservation(ref)
    if (current && CANCELLABLE.includes(current.status)) {
      // le hook de la collection envoie le SMS et le mail d'annulation
      await payload.update({ collection: 'reservations', id: current.id, data: { status: 'annulee' } })
    }
    redirect(`/reserver/confirmation/${ref}?t=${t}`)
  }

  const cancellable = CANCELLABLE.includes(r.status)

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <p className="kicker mb-3">Réservation {r.ref}</p>
      <h1 className="mb-6 text-5xl">Annuler ma réservation</h1>
      {cancellable ? (
        <>
          <p className="mb-8 text-lg text-muted-foreground">
            Table pour {r.partySize}, <span className="capitalize-first">{formatDateFr(r.date)}</span> à {r.startTime.replace(':', 'h')}.
            Merci de nous prévenir, ça libère la table pour quelqu’un d’autre.
          </p>
          <form action={cancel} className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" variant="destructive">
              Oui, annuler
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/reserver/confirmation/${ref}?t=${t}`}>Garder ma réservation</Link>
            </Button>
          </form>
        </>
      ) : (
        <p className="text-lg text-muted-foreground">Cette réservation ne peut plus être annulée en ligne. Appelez-nous si besoin.</p>
      )}
    </div>
  )
}
