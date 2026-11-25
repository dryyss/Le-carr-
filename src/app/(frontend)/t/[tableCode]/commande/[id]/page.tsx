import Link from 'next/link'
import { notFound } from 'next/navigation'

import { OrderSummary } from '@/components/order/OrderSummary'
import { OrderTracker } from '@/components/order/OrderTracker'
import { findTableByQr } from '@/lib/ordering'
import { getPayloadClient } from '@/lib/payload'
import { confirmIfPaid } from '@/lib/payment'
import { formatTimeFr } from '@/lib/time'

export const dynamic = 'force-dynamic'

export default async function CommandeTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ tableCode: string; id: string }>
  searchParams: Promise<{ k?: string; paiement?: string }>
}) {
  const { tableCode, id } = await params
  const { k, paiement } = await searchParams
  const payload = await getPayloadClient()
  const code = decodeURIComponent(tableCode)
  const table = await findTableByQr(payload, code, k)
  if (!table) notFound()
  let order = await payload.findByID({ collection: 'orders', id, depth: 0 }).catch(() => null)
  const orderTable = order && (typeof order.table === 'object' ? order.table?.id : order.table)
  if (!order || orderTable !== table.id) notFound()
  if (paiement === 'ok' && (await confirmIfPaid(payload, order))) order = await payload.findByID({ collection: 'orders', id, depth: 0 })

  const base = `/t/${encodeURIComponent(code)}`
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <p className="kicker mb-2">{table.label}</p>
      <h1 className="mb-1 text-5xl">Commande n° {order.number}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Passée à {formatTimeFr(order.createdAt)}</p>
      {paiement === 'annule' && order.paymentStatus !== 'payee' && (
        <p className="mb-6 border-l-2 border-brand-red pl-4 text-sm">Paiement interrompu. Vous pouvez le reprendre ou régler en caisse.</p>
      )}

      <OrderTracker
        id={order.id}
        type="table"
        auth={{ kind: 'table', tableCode: code, token: k! }}
        initialStatus={order.status}
        initialPayment={order.paymentStatus ?? 'a_regler'}
        returnPath={`${base}/commande/${order.id}?k=${encodeURIComponent(k!)}`}
      />
      <OrderSummary order={order} />

      <Link href={`${base}?k=${encodeURIComponent(k!)}`} className="mt-10 inline-block underline underline-offset-4">
        Revenir à la carte
      </Link>
    </div>
  )
}
