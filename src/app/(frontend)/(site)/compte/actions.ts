'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { clearCustomerSession, getCurrentCustomer } from '@/lib/customer-session'
import { getPayloadClient } from '@/lib/payload'

const profileSchema = z.object({
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide').max(120)]),
  birthdayDay: z.union([z.literal(''), z.coerce.number().int().min(1).max(31)]),
  birthdayMonth: z.union([z.literal(''), z.coerce.number().int().min(1).max(12)]),
})

export type ProfileState = { ok?: boolean; error?: string } | null

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/connexion')
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  const d = parsed.data
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: {
      firstName: d.firstName || null,
      lastName: d.lastName || null,
      email: d.email || null,
      birthdayDay: d.birthdayDay === '' ? null : d.birthdayDay,
      birthdayMonth: d.birthdayMonth === '' ? null : d.birthdayMonth,
      optInSms: formData.get('optInSms') === 'on',
      optInEmail: formData.get('optInEmail') === 'on',
    },
  })
  revalidatePath('/compte')
  return { ok: true }
}

export async function logout() {
  await clearCustomerSession()
  redirect('/')
}

/** RGPD : suppression du compte et de l'historique de points ; les commandes sont conservées sans lien. */
export async function deleteAccount(formData: FormData) {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/connexion')
  if (formData.get('confirm') !== 'SUPPRIMER') redirect('/compte?suppression=confirmer')
  const payload = await getPayloadClient()
  const byCustomer = { customer: { equals: customer.id } }
  await payload.delete({ collection: 'loyalty-transactions', where: byCustomer })
  await payload.update({ collection: 'orders', where: byCustomer, data: { customer: null } })
  await payload.update({ collection: 'reservations', where: byCustomer, data: { customer: null }, context: { skipNotify: true } })
  await payload.delete({ collection: 'customers', id: customer.id })
  await clearCustomerSession()
  redirect('/?compte=supprime')
}
