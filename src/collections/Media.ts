import type { CollectionConfig } from 'payload'

import { anyone, isGerant } from '@/access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médias' },
  admin: {
    group: 'Contenu',
  },
  access: {
    read: anyone,
    create: isGerant,
    update: isGerant,
    delete: isGerant,
  },
  fields: [
    {
      name: 'alt',
      label: 'Texte alternatif',
      type: 'text',
      required: true,
      admin: {
        description: 'Décris l’image pour les lecteurs d’écran. Rappel : aucun produit du tabac mis en avant.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1920 },
    ],
    adminThumbnail: 'thumbnail',
  },
}
