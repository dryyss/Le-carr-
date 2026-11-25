import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { OrderSummary } from '@/components/order/OrderSummary'
import { Button } from '@/components/ui/button'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { confirmIfPaid } from '@/lib/payment'
import { addressLine, mapsUrl } from '@/lib/site'
import { formatDateFr } from '@/lib/time'
import { orderToken, verifyReservationToken } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Réservation confirmée', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PAYMENT: Record<string, string> = {
  a_regler: 'À régler sur place',
  en_attente: 'Paiement en ligne en attente',
  payee: 'Payée en ligne',
  remboursee: 'Remboursée',
}

const STATUS: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  arrivee: 'Vous êtes arrivés',
  terminee: 'Terminée',
  annulee: 'Annulée',
  no_show: 'Non honorée',
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ t?: string; paiement?: string }>
}) {
  const { ref } = await params
  const { t, paiement } = await searchParams
  if (!verifyReservationToken(ref, t)) notFound()

  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'reservations', where: { ref: { equals: ref } }, limit: 1, depth: 1 })
  const r = docs[0]
  if (!r) notFound()
  const settings = await getSettings()
  const cancelled = r.status === 'annulee'
  const event = typeof r.event === 'object' ? r.event : null
  const orders = await payload.find({ collection: 'orders', where: { reservation: { equals: r.id } }, depth: 0, limit: 5 })
  const preorders = await Promise.all(
    orders.docs.map(async (o) => (paiement === 'ok' && (await confirmIfPaid(payload, o)) ? payload.findByID({ collection: 'orders', id: o.id, depth: 0 }) : o)),
  )

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      {!cancelled && (
        <div className="mb-8 inline-flex size-14 items-center justify-center rounded-full border border-foreground">
          <Check className="size-7" aria-hidden />
        </div>
      )}
      <p className="kicker mb-3">Réservation {r.ref}</p>
      <h1 className="mb-8 text-5xl">{cancelled ? 'Réservation annulée' : 'C’est réservé !'}</h1>

      <dl className="frame divide-y divide-border border border-border">
        {[
          ['Statut', STATUS[r.status]],
          ['Date', formatDateFr(r.date)],
          ['Heure', r.startTime.replace(':', 'h')],
          ['Personnes', String(r.partySize)],
          ['Au nom de', r.name],
          ...(event ? [['Événement', event.title]] : []),
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right capitalize-first">{v}</dd>
          </div>
        ))}
      </dl>

      {preorders.map((o) => (
        <section key={o.id} className="mt-10" aria-label="Précommande">
          <h2 className="text-3xl">Votre précommande</h2>
          <p className={`mt-1 text-sm ${o.paymentStatus === 'payee' ? 'text-success' : 'text-muted-foreground'}`}>
            {PAYMENT[o.paymentStatus ?? 'a_regler']} · lancée à votre arrivée
          </p>
          {paiement === 'annule' && o.paymentStatus !== 'payee' && (
            <p className="mt-3 border-l-2 border-brand-red pl-4 text-sm">Paiement interrompu : vous pourrez régler sur place.</p>
          )}
          <OrderSummary order={o} />
          <Link href={`/commande/${o.id}?t=${orderToken(o.id)}`} className="mt-3 inline-block text-sm underline underline-offset-4">
            Suivre ou payer la précommande
          </Link>
        </section>
      ))}

      {!cancelled && (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            Un SMS de confirmation vient de partir, et un rappel arrivera 3 h avant. Le Carré,{' '}
            <a href={mapsUrl(settings)} target="_blank" rel="noopener" className="underline">
              {addressLine(settings)}
            </a>
            .
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/carte">Découvrir la carte</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/reserver/annuler/${r.ref}?t=${t}`}>Annuler</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
