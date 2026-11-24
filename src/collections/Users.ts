import type { CollectionConfig } from 'payload'

import { isGerant, isGerantField, isGerantOrSelf, isStaffReq } from '@/access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Membre de l’équipe', plural: 'Équipe' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Réglages',
  },
  auth: {
    tokenExpiration: 60 * 60 * 12, // 12 h : couvre un service du soir
  },
  access: {
    // Seuls les comptes staff entrent dans /admin (les clients auront leur propre collection)
    admin: ({ req }) => isStaffReq(req),
    read: isGerantOrSelf,
    create: isGerant,
    update: isGerantOrSelf,
    delete: isGerant,
  },
  hooks: {
    beforeChange: [
      // Le tout premier compte créé est forcément gérant, sinon personne ne pourrait administrer
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) return { ...data, role: 'gerant' }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Nom',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'Rôle',
      type: 'select',
      required: true,
      defaultValue: 'serveur',
      saveToJWT: true,
      options: [
        { label: 'Gérant', value: 'gerant' },
        { label: 'Serveur / bar', value: 'serveur' },
      ],
      access: {
        create: isGerantField,
        update: isGerantField,
      },
      admin: {
        description: 'Le serveur accède seulement à l’écran bar et aux commandes et réservations du jour.',
      },
    },
  ],
}
