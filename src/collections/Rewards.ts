import type { CollectionConfig } from 'payload'

import { anyone, isGerant } from '@/access/roles'
import { assertNoTobacco } from '@/lib/content'

export const Rewards: CollectionConfig = {
  slug: 'rewards',
  labels: { singular: 'Récompense', plural: 'Récompenses' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'pointsCost', 'active'], group: 'Fidélité' },
  defaultSort: 'pointsCost',
  access: { read: anyone, create: isGerant, update: isGerant, delete: isGerant },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title) assertNoTobacco(data.title)
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'pointsCost', label: 'Coût en points', type: 'number', required: true, min: 1 },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
  ],
}
