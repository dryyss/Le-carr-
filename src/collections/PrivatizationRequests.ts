import type { CollectionConfig } from 'payload'

import { hiddenUnlessGerant, isGerant } from '@/access/roles'
import { notifyManager } from '@/lib/notify'
import { formatPhoneFr } from '@/lib/phone'
import { formatDateFr } from '@/lib/time'

export const PrivatizationRequests: CollectionConfig = {
  slug: 'privatization-requests',
  labels: { singular: 'Demande de privatisation', plural: 'Privatisations' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'guests', 'occasion', 'status', 'createdAt'],
    group: 'Salle',
    hidden: hiddenUnlessGerant,
  },
  defaultSort: '-createdAt',
  access: { read: isGerant, create: isGerant, update: isGerant, delete: isGerant },
  hooks: {
    afterChange: [
      async ({ doc, operation, req, context }) => {
        if (operation !== 'create' || context.skipNotify) return doc
        await notifyManager(req.payload, `Nouvelle demande de privatisation : ${doc.name}`, [
          `${doc.name}, ${formatPhoneFr(doc.phone)}${doc.email ? `, ${doc.email}` : ''}`,
          `Date souhaitée : ${formatDateFr(doc.date)}, ${doc.guests} personnes`,
          `Occasion : ${doc.occasion || 'non précisée'}`,
          doc.message ? `Message : ${doc.message}` : '',
        ]).catch((err) => req.payload.logger.error({ err, msg: 'Notification privatisation' }))
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nom', type: 'text', required: true },
        { name: 'phone', label: 'Téléphone', type: 'text', required: true },
        { name: 'email', label: 'E-mail', type: 'email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'date', label: 'Date souhaitée', type: 'text', required: true },
        { name: 'guests', label: 'Invités', type: 'number', required: true, min: 1 },
        { name: 'occasion', label: 'Occasion', type: 'text' },
      ],
    },
    { name: 'message', label: 'Message', type: 'textarea' },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      defaultValue: 'nouvelle',
      index: true,
      options: [
        { label: 'Nouvelle', value: 'nouvelle' },
        { label: 'En discussion', value: 'en_discussion' },
        { label: 'Acceptée', value: 'acceptee' },
        { label: 'Refusée', value: 'refusee' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
