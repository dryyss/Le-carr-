import type { Access, CollectionConfig } from 'payload'

import { isGerant, isStaffReq } from '@/access/roles'
import { slugify } from '@/lib/content'

const readEvents: Access = ({ req }) => (isStaffReq(req) ? true : { published: { equals: true } })

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Événement', plural: 'Événements' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'startsAt', 'bookable', 'published'],
    group: 'Contenu',
  },
  defaultSort: '-startsAt',
  access: { read: readEvents, create: isGerant, update: isGerant, delete: isGerant },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data.slug) data.slug = slugify(data.title)
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'soiree_theme',
      options: [
        { label: 'Soirée à thème', value: 'soiree_theme' },
        { label: 'Match', value: 'match' },
        { label: 'Autre', value: 'autre' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          label: 'Début',
          type: 'date',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm', timeFormat: 'HH:mm' } },
        },
        {
          name: 'endsAt',
          label: 'Fin',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm', timeFormat: 'HH:mm' } },
        },
      ],
    },
    { name: 'excerpt', label: 'Accroche', type: 'textarea', maxLength: 200 },
    { name: 'cover', label: 'Visuel', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Description', type: 'richText' },
    {
      type: 'row',
      fields: [
        { name: 'bookable', label: 'Réservable en ligne', type: 'checkbox', defaultValue: false },
        {
          name: 'capacity',
          label: 'Capacité (couverts)',
          type: 'number',
          min: 1,
          admin: { condition: (_, s) => Boolean(s?.bookable) },
        },
      ],
    },
    { name: 'published', label: 'Publié', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
