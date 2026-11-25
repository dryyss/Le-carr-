import { createHash, createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET manquant')
  return s
}

export function sign(value: string, purpose: string): string {
  return createHmac('sha256', `${purpose}:${secret()}`).update(value).digest('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Jeton court pour les liens de réservation (consultation / annulation). */
export function reservationToken(ref: string): string {
  return sign(ref, 'reservation').slice(0, 22)
}

export function verifyReservationToken(ref: string, token: string | null | undefined): boolean {
  return Boolean(token) && safeEqual(reservationToken(ref), String(token))
}

/** Jeton d'accès public à une commande (suivi, paiement). */
export function orderToken(orderId: number | string): string {
  return sign(String(orderId), 'order').slice(0, 22)
}

export function verifyOrderToken(orderId: number | string, token: string | null | undefined): boolean {
  return Boolean(token) && safeEqual(orderToken(orderId), String(token))
}

export function hashOtp(phone: string, code: string): string {
  return createHash('sha256').update(`${phone}:${code}:${secret()}`).digest('hex')
}
