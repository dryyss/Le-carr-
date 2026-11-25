import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import type { Setting } from '@/payload-types'

export const getPayloadClient = (): Promise<Payload> => getPayload({ config })

export const getSettings = cache(async (): Promise<Setting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'settings', depth: 0 })
})

/** Membre du staff connecté à l'admin (gérant ou serveur), sinon null. */
export async function getStaffUser() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.collection !== 'users') return null
  return user.role === 'gerant' || user.role === 'serveur' ? user : null
}
