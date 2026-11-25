import { cookies } from 'next/headers'

import type { Customer } from '@/payload-types'

import { getPayloadClient } from './payload'
import { safeEqual, sign } from './tokens'

const COOKIE = 'lc_client'
const MAX_AGE = 60 * 60 * 24 * 90 // 90 jours

function encode(customerId: number | string, exp: number) {
  const body = `${customerId}.${exp}`
  return `${body}.${sign(body, 'customer-session')}`
}

function decode(value: string | undefined): string | null {
  if (!value) return null
  const [id, exp, sig] = value.split('.')
  if (!id || !exp || !sig) return null
  if (!safeEqual(sign(`${id}.${exp}`, 'customer-session'), sig)) return null
  if (Number(exp) < Date.now() / 1000) return null
  return id
}

export async function setCustomerSession(customerId: number | string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  ;(await cookies()).set(COOKIE, encode(customerId, exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearCustomerSession() {
  ;(await cookies()).delete(COOKIE)
}

/** Client connecté (session par code SMS), sinon null. */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const id = decode((await cookies()).get(COOKIE)?.value)
  if (!id) return null
  const payload = await getPayloadClient()
  try {
    return await payload.findByID({ collection: 'customers', id, depth: 0 })
  } catch {
    return null
  }
}
