import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { isGerantReq, isStaff, nobody, staffUser } from '@/access/roles'
import { applyPoints } from '@/lib/loyalty'

/**
 * Registre des points (immuable). Seul chemin pour modifier Customers.points.
 * Le serveur peut enregistrer l'utilisation d'une récompense ; le reste est réservé au gérant ou aux hooks.
 */
export const LoyaltyTransactions: CollectionConfig = {
  slug: 'loyalty-transactions',
  labels: { singular: 'Mouvement de points', plural: 'Mouvements de points' },
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['customer', 'type', 'points', 'reason', 'createdAt'],
    group: 'Fidélité',
    description: 'Pour utiliser une récompense : type « Utilisation », choisir le client et la récompense.',
  },
  defaultSort: '-createdAt',
  access: {
    read: isStaff,
    create: isStaff,
    update: nobody,
    delete: nobody,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const user = staffUser(req)
        if (user) {
          data.createdBy = user.id
          if (!isGerantReq(req) && data.type !== 'utilisation') {
            throw new ValidationError({
              errors: [{ path: 'type', message: 'Le serveur peut seulement enregistrer l’utilisation d’une récompense.' }],
            })
          }
        }
        if (data.type === 'utilisation' && data.reward) {
          const rewardId = typeof data.reward === 'object' ? data.reward.id : data.reward
          const reward = await req.payload.findByID({ collection: 'rewards', id: rewardId, req })
          data.points = -Math.abs(reward.pointsCost)
          data.reason = data.reason || `Récompense : ${reward.title}`
        }
        if (data.type === 'utilisation') data.points = -Math.abs(data.points ?? 0)
        if (!data.points) {
          throw new ValidationError({ errors: [{ path: 'points', message: 'Le nombre de points ne peut pas être nul.' }] })
        }
        const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer
        const customer = await req.payload.findByID({ collection: 'customers', id: customerId, req })
        try {
          applyPoints(customer.points ?? 0, data.points)
        } catch (e) {
          throw new ValidationError({ errors: [{ path: 'points', message: (e as Error).message }] })
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
        const customer = await req.payload.findByID({ collection: 'customers', id: customerId, req })
        await req.payload.update({
          collection: 'customers',
          id: customerId,
          data: {
            points: applyPoints(customer.points ?? 0, doc.points),
            lastActivityAt: doc.points > 0 ? new Date().toISOString() : customer.lastActivityAt,
          },
          overrideAccess: true,
          req,
        })
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'customer', label: 'Client', type: 'relationship', relationTo: 'customers', required: true, index: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          defaultValue: 'utilisation',
          options: [
            { label: 'Gain', value: 'gain' },
            { label: 'Utilisation', value: 'utilisation' },
            { label: 'Bonus anniversaire', value: 'bonus_anniversaire' },
            { label: 'Ajustement', value: 'ajustement' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'reward', label: 'Récompense', type: 'relationship', relationTo: 'rewards' },
        {
          name: 'points',
          label: 'Points',
          type: 'number',
          admin: { description: 'Positif ou négatif. Calculé automatiquement pour une récompense.' },
        },
      ],
    },
    { name: 'reason', label: 'Motif', type: 'text' },
    { name: 'order', label: 'Commande', type: 'relationship', relationTo: 'orders' },
    { name: 'createdBy', label: 'Saisi par', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
