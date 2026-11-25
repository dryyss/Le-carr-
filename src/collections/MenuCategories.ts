import type { CollectionConfig } from 'payload'

import { anyone, isGerant } from '@/access/roles'
import { assertNoTobacco, slugify } from '@/lib/content'

export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  labels: { singular: 'Catégorie de la carte', plural: 'Catégories de la carte' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'active'],
    group: 'Carte',
    description: 'Boissons, snacks et desserts uniquement. Aucun produit du tabac (loi Evin).',
  },
  defaultSort: 'order',
  access: { read: anyone, create: isGerant, update: isGerant, delete: isGerant },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (data.title) assertNoTobacco(data.title)
        if (data.title && !data.slug) data.slug = slugify(data.title)
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'note',
      label: 'Mention sous le titre',
      type: 'text',
      admin: { description: 'Ex. « Servis avec une boisson comprise ».' },
    },
    { name: 'order', label: 'Ordre', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'active', label: 'Visible', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
