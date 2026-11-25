'use server'

import { randomInt } from 'crypto'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { setCustomerSession } from '@/lib/customer-session'
import { isDemo } from '@/lib/demo'
import { sendOtp } from '@/lib/notify'
import { getPayloadClient } from '@/lib/payload'
import { toE164 } from '@/lib/phone'
import { hashOtp, safeEqual } from '@/lib/tokens'

const OTP_TTL_MS = 10 * 60_000
const MAX_ATTEMPTS = 5
const MAX_CODES_PER_WINDOW = 3

export type OtpState =
  | { step: 'phone'; error?: string }
  | { step: 'code'; phone: string; demoCode?: string; error?: string }

async function requestOtp(_: OtpState, formData: FormData): Promise<OtpState> {
  const phone = toE164(String(formData.get('phone') ?? ''))
  if (!phone) return { step: 'phone', error: 'Numéro de téléphone invalide.' }

  const payload = await getPayloadClient()
  const recent = await payload.count({
    collection: 'otp-codes',
    where: { phone: { equals: phone }, createdAt: { greater_than_equal: new Date(Date.now() - OTP_TTL_MS).toISOString() } },
  })
  if (recent.totalDocs >= MAX_CODES_PER_WINDOW) {
    return { step: 'phone', error: 'Trop de demandes. Réessayez dans quelques minutes.' }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await payload.create({
    collection: 'otp-codes',
    data: { phone, codeHash: hashOtp(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), attempts: 0 },
  })
  await sendOtp(payload, phone, code)
  return { step: 'code', phone, demoCode: isDemo() ? code : undefined }
}

const verifySchema = z.object({ phone: z.string(), code: z.string().regex(/^\d{6}$/), next: z.string().optional() })

async function verifyOtp(prev: OtpState, formData: FormData): Promise<OtpState> {
  const parsed = verifySchema.safeParse(Object.fromEntries(formData))
  const phone = toE164(String(formData.get('phone') ?? ''))
  if (!phone) return { step: 'phone', error: 'Numéro invalide.' }
  const base = { step: 'code' as const, phone, demoCode: prev.step === 'code' ? prev.demoCode : undefined }
  if (!parsed.success) return { ...base, error: 'Le code contient 6 chiffres.' }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'otp-codes',
    where: { phone: { equals: phone }, consumed: { equals: false }, expiresAt: { greater_than: new Date().toISOString() } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  const otp = docs[0]
  if (!otp) return { step: 'phone', error: 'Code expiré. Demandez-en un nouveau.' }
  if ((otp.attempts ?? 0) >= MAX_ATTEMPTS) return { step: 'phone', error: 'Trop d’essais. Demandez un nouveau code.' }

  if (!safeEqual(otp.codeHash, hashOtp(phone, parsed.data.code))) {
    await payload.update({ collection: 'otp-codes', id: otp.id, data: { attempts: (otp.attempts ?? 0) + 1 } })
    const left = MAX_ATTEMPTS - (otp.attempts ?? 0) - 1
    return left > 0 ? { ...base, error: `Code incorrect. ${left} essai(s) restant(s).` } : { step: 'phone', error: 'Trop d’essais. Demandez un nouveau code.' }
  }

  await payload.update({ collection: 'otp-codes', id: otp.id, data: { consumed: true } })
  const existing = await payload.find({ collection: 'customers', where: { phone: { equals: phone } }, limit: 1, depth: 0 })
  const customer = existing.docs[0] ?? (await payload.create({ collection: 'customers', data: { phone } }))
  await setCustomerSession(customer.id)

  const next = parsed.data.next
  redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/compte')
}

/** Point d'entrée unique du formulaire : demande de code, vérification ou retour au numéro. */
export async function otpAction(prev: OtpState, formData: FormData): Promise<OtpState> {
  const intent = formData.get('intent')
  if (intent === 'verify') return verifyOtp(prev, formData)
  if (intent === 'reset') return { step: 'phone' }
  return requestOtp(prev, formData)
}
