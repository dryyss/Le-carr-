import type { GlobalConfig } from 'payload'

import { anyone, isGerant } from '@/access/roles'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Page d’accueil',
  admin: { group: 'Contenu' },
  access: { read: anyone, update: isGerant },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'En-tête',
          fields: [
            { name: 'heroKicker', label: 'Sur-titre', type: 'text', defaultValue: 'Restaurant lounge' },
            { name: 'heroTitle', label: 'Titre', type: 'text', defaultValue: 'Le Carré' },
            {
              name: 'heroSubtitle',
              label: 'Sous-titre',
              type: 'textarea',
              defaultValue: 'Cuisine, mocktails et soirées à Saint-Brice-sous-Forêt. Ouvert 7j/7 de 18h à 2h.',
            },
            {
              name: 'heroImage',
              label: 'Photo plein cadre',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Ambiance du lieu uniquement, aucun produit du tabac (loi Evin).' },
            },
          ],
        },
        {
          label: 'Ambiance',
          fields: [
            {
              name: 'ambiance',
              label: 'Sections ambiance',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'title', label: 'Titre', type: 'text', required: true },
                { name: 'text', label: 'Texte', type: 'textarea', required: true },
                { name: 'image', label: 'Photo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: 'Galerie',
          fields: [
            {
              name: 'gallery',
              label: 'Galerie',
              type: 'array',
              maxRows: 12,
              fields: [{ name: 'image', label: 'Photo', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Avis',
          fields: [
            {
              name: 'reviews',
              label: 'Avis clients',
              type: 'array',
              maxRows: 6,
              fields: [
                { name: 'author', label: 'Auteur', type: 'text', required: true },
                { name: 'text', label: 'Avis', type: 'textarea', required: true },
                { name: 'rating', label: 'Note', type: 'number', min: 1, max: 5, defaultValue: 5 },
              ],
            },
          ],
        },
        {
          label: 'Appel à réserver',
          fields: [
            { name: 'ctaTitle', label: 'Titre', type: 'text', defaultValue: 'Votre table vous attend' },
            {
              name: 'ctaText',
              label: 'Texte',
              type: 'textarea',
              defaultValue: 'Réservez en quelques secondes, confirmation immédiate par SMS.',
            },
          ],
        },
      ],
    },
  ],
}
