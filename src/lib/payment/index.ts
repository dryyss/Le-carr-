import { createHmac } from 'crypto'
import type { Payload } from 'payload'

import type { Order } from '@/payload-types'

import { isDemo } from '@/lib/demo'
import { siteUrl } from '@/lib/site-url'
import { orderToken, safeEqual } from '@/lib/tokens'

export interface PaymentProvider {
  readonly name: 'stripe' | 'demo'
  /** Crée une session de paiement et renvoie l'URL où envoyer le client. */
  createCheckout(args: {
    orderId: number
    amount: number
    description: string
    successUrl: string
    cancelUrl: string
    phone?: string | null
  }): Promise<{ url: string; ref: string }>
  /** Vérifie auprès du prestataire qu'une session est payée. */
  isPaid(ref: string): Promise<boolean>
}

/** Stripe Checkout, via l'API REST (pas de SDK). */
class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const
  constructor(private key: string) {}

  private async call<T>(path: string, body?: URLSearchParams): Promise<T> {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { authorization: `Bearer ${this.key}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error(`Stripe ${res.status} : ${await res.text()}`)
    return (await res.json()) as T
  }

  async createCheckout(args: { orderId: number; amount: number; description: string; successUrl: string; cancelUrl: string }) {
    const p = new URLSearchParams({
      mode: 'payment',
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      locale: 'fr',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(args.amount),
      'line_items[0][price_data][product_data][name]': args.description,
      'metadata[orderId]': String(args.orderId),
      'payment_intent_data[metadata][orderId]': String(args.orderId),
    })
    const session = await this.call<{ id: string; url: string }>('/checkout/sessions', p)
    return { url: session.url, ref: session.id }
  }

  async isPaid(ref: string) {
    const s = await this.call<{ payment_status: string }>(`/checkout/sessions/${encodeURIComponent(ref)}`)
    return s.payment_status === 'paid'
  }
}

/** Démo : page de paiement simulée sur le site, aucun débit. */
class DemoProvider implements PaymentProvider {
  readonly name = 'demo' as const
  async createCheckout(args: { orderId: number; successUrl: string; cancelUrl: string }) {
    const ref = `demo_${args.orderId}_${Date.now()}`
    const q = new URLSearchParams({ t: orderToken(args.orderId), ok: args.successUrl, ko: args.cancelUrl })
    return { url: `${siteUrl}/paiement/demo/${args.orderId}?${q}`, ref }
  }
  async isPaid() {
    return false // confirmé uniquement par la page de démo
  }
}

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.STRIPE_SECRET_KEY
  if (isDemo() || !key) return new DemoProvider()
  return new StripeProvider(key)
}

export function onlinePaymentAvailable(): boolean {
  return isDemo() || Boolean(process.env.STRIPE_SECRET_KEY)
}

/** Lance le paiement d'une commande et renvoie l'URL de paiement. */
export async function startPayment(payload: Payload, order: Order, urls: { success: string; cancel: string }): Promise<string> {
  const provider = getPaymentProvider()
  const { url, ref } = await provider.createCheckout({
    orderId: order.id,
    amount: order.total ?? 0,
    description: `Le Carré, commande n° ${order.number}`,
    successUrl: urls.success,
    cancelUrl: urls.cancel,
    phone: order.contactPhone,
  })
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { paymentMethod: 'en_ligne', paymentStatus: 'en_attente', paymentProvider: provider.name, paymentRef: ref },
    context: { skipLoyalty: true },
  })
  return url
}

/** Marque une commande payée (idempotent). */
export async function markPaid(payload: Payload, orderId: number | string, ref?: string) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
  if (order.paymentStatus === 'payee') return order
  return payload.update({
    collection: 'orders',
    id: order.id,
    data: { paymentStatus: 'payee', paymentMethod: 'en_ligne', paidAt: new Date().toISOString(), ...(ref ? { paymentRef: ref } : {}) },
    context: { skipLoyalty: true },
  })
}

/** Au retour du client : revérifie auprès de Stripe (filet de sécurité si le webhook tarde). */
export async function confirmIfPaid(payload: Payload, order: Order): Promise<boolean> {
  if (order.paymentStatus === 'payee') return true
  if (order.paymentProvider !== 'stripe' || !order.paymentRef) return false
  const provider = getPaymentProvider()
  if (provider.name !== 'stripe') return false
  if (await provider.isPaid(order.paymentRef)) {
    await markPaid(payload, order.id)
    return true
  }
  return false
}

/** Vérifie la signature d'un webhook Stripe (en-tête Stripe-Signature, tolérance 5 min). */
export function verifyStripeSignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]))
  const t = Number(parts.t)
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
  return header
    .split(',')
    .filter((kv) => kv.startsWith('v1='))
    .some((kv) => safeEqual(kv.slice(3), expected))
}
