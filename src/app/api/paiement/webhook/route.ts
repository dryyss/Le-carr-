import { getPayloadClient } from '@/lib/payload'
import { markPaid, verifyStripeSignature } from '@/lib/payment'

export const dynamic = 'force-dynamic'

/**
 * Webhook Stripe : confirme le paiement d'une commande (checkout.session.completed).
 * À déclarer dans le tableau de bord Stripe, secret dans STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook non configuré', { status: 503 })
  const body = await request.text()
  if (!verifyStripeSignature(body, request.headers.get('stripe-signature'), secret)) {
    return new Response('Signature invalide', { status: 400 })
  }

  const event = JSON.parse(body) as {
    type: string
    data: { object: { id: string; payment_status?: string; metadata?: { orderId?: string } } }
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (orderId && session.payment_status === 'paid') {
      const payload = await getPayloadClient()
      await markPaid(payload, orderId, session.id)
    }
  }
  return Response.json({ received: true })
}
