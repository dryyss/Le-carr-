import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OrderSummary } from '@/components/order/OrderSummary'
import { OrderTracker } from '@/components/order/OrderTracker'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { confirmIfPaid } from '@/lib/payment'
import { addressLine } from '@/lib/site'
import { formatDateTimeFr } from '@/lib/time'
import { verifyOrderToken } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Ma commande', robots: { index: false } }
export const dynamic = 'force-dynamic'

const TITLE = { table: 'Commande à table', precommande: 'Précommande', emporter: 'Commande à emporter' } as const

export default async function CommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string; paiement?: string }>
}) {
  const { id } = await params
  const { t, paiement } = await searchParams
  if (!verifyOrderToken(id, t)) notFound()
  const payload = await getPayloadClient()
  let order = await payload.findByID({ collection: 'orders', id, depth: 1 }).catch(() => null)
  if (!order) notFound()
  if (paiement === 'ok' && (await confirmIfPaid(payload, order))) order = await payload.findByID({ collection: 'orders', id, depth: 1 })
  const settings = await getSettings()
  const reservation = typeof order.reservation === 'object' ? order.reservation : null

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <p className="kicker mb-2">{TITLE[order.type]}</p>
      <h1 className="mb-2 text-5xl">Commande n° {order.number}</h1>
      {order.scheduledFor && (
        <p className="mb-8 text-muted-foreground">
          {order.type === 'emporter' ? 'Retrait prévu ' : 'Pour votre arrivée '}
          <span className="capitalize-first">{formatDateTimeFr(order.scheduledFor)}</span>
          {order.type === 'emporter' && <> au {addressLine(settings)}</>}
          {reservation && <> (réservation {reservation.ref})</>}
        </p>
      )}
      {paiement === 'ok' && order.paymentStatus === 'payee' && (
        <p className="mb-6 border-l-2 border-success pl-4 text-sm" role="status">
          Paiement reçu, merci !
        </p>
      )}
      {paiement === 'annule' && order.paymentStatus !== 'payee' && (
        <p className="mb-6 border-l-2 border-brand-red pl-4 text-sm">Paiement interrompu. Vous pouvez le reprendre ou régler sur place.</p>
      )}

      <OrderTracker
        id={order.id}
        type={order.type}
        auth={{ kind: 'order', token: t! }}
        initialStatus={order.status}
        initialPayment={order.paymentStatus ?? 'a_regler'}
        returnPath={`/commande/${order.id}?t=${t}`}
      />
      <OrderSummary order={order} />
    </div>
  )
}
