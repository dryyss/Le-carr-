import { Lock } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { isDemo } from '@/lib/demo'
import { getPayloadClient } from '@/lib/payload'
import { markPaid } from '@/lib/payment'
import { siteUrl } from '@/lib/site-url'
import { verifyOrderToken } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Paiement (démo)', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** n'accepte que des URL de retour du site lui-même */
function safeReturn(url: string | undefined, fallback: string): string {
  if (!url) return fallback
  try {
    const u = new URL(url, siteUrl)
    return u.origin === new URL(siteUrl).origin ? u.toString() : fallback
  } catch {
    return fallback
  }
}

async function payDemo(id: string, token: string | undefined, success: string) {
  'use server'
  if (!isDemo() || !verifyOrderToken(id, token)) return
  await markPaid(await getPayloadClient(), id, `demo_${id}`)
  redirect(success)
}

/** Page de paiement simulée (mode démo uniquement) : aucune carte n'est débitée. */
export default async function DemoPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string; ok?: string; ko?: string }>
}) {
  if (!isDemo()) notFound()
  const { id } = await params
  const { t, ok, ko } = await searchParams
  if (!verifyOrderToken(id, t)) notFound()
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id, depth: 0 }).catch(() => null)
  if (!order) notFound()
  const fallback = `${siteUrl}/commande/${id}?t=${t}`
  const success = safeReturn(ok, fallback)
  const cancel = safeReturn(ko, fallback)

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <p className="mb-6 border-l-2 border-brand-red pl-4 text-sm">Démo : paiement simulé, aucune carte n’est débitée. En production, cette étape passe par Stripe.</p>
      <p className="kicker mb-2">Paiement sécurisé</p>
      <h1 className="mb-2 text-4xl">Le Carré</h1>
      <p className="mb-8 text-muted-foreground">Commande n° {order.number}</p>

      <div className="frame space-y-5 border border-border p-6">
        <div className="flex justify-between text-2xl">
          <span>Montant</span>
          <span className="font-display tabular-nums">{formatPrice(order.total ?? 0)}</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground" aria-hidden>
          <div className="rounded-md border border-border px-4 py-3 font-mono">4242 4242 4242 4242</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border px-4 py-3 font-mono">12 / 30</div>
            <div className="rounded-md border border-border px-4 py-3 font-mono">123</div>
          </div>
        </div>
        {order.paymentStatus === 'payee' ? (
          <p className="text-success">Cette commande est déjà payée.</p>
        ) : (
          <form action={payDemo.bind(null, id, t, success)}>
            <Button type="submit" size="lg" className="w-full">
              <Lock /> Payer {formatPrice(order.total ?? 0)}
            </Button>
          </form>
        )}
        <a href={cancel} className="block text-center text-sm text-muted-foreground underline">
          Annuler et revenir
        </a>
      </div>
    </div>
  )
}
