'use server'

import { z } from 'zod'

import { getPayloadClient } from '@/lib/payload'
import { toE164 } from '@/lib/phone'
import { isValidDate, todayParis } from '@/lib/time'

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom').max(80),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const e = toE164(v)
      if (!e) ctx.addIssue({ code: 'custom', message: 'Numéro de téléphone invalide' })
      return e ?? ''
    }),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide').max(120)]),
  date: z
    .string()
    .refine(isValidDate, 'Date invalide')
    .refine((d) => d >= todayParis(), 'La date doit être à venir'),
  guests: z.coerce.number().int('Nombre d’invités invalide').min(2, 'Au moins 2 personnes').max(300),
  occasion: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(),
})

export type PrivState = { ok: boolean; error?: string } | null

export async function submitPrivatization(_: PrivState, formData: FormData): Promise<PrivState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  const { website, ...data } = parsed.data
  if (website) return { ok: true } // robot : on ne dit rien
  const payload = await getPayloadClient()
  await payload.create({
    collection: 'privatization-requests',
    data: { ...data, email: data.email || undefined, status: 'nouvelle' },
  })
  return { ok: true }
}
