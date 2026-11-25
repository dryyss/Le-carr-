import type { CollectionConfig } from 'payload'

import { anyone, gerantOnly, isGerant, isStaff } from '@/access/roles'
import { assertNoTobacco } from '@/lib/content'

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Produit', plural: 'Produits' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'available'],
    group: 'Carte',
    description: 'Le serveur peut seulement passer un produit en rupture. Aucun produit du tabac (loi Evin).',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: isGerant,
    // le serveur peut modifier, mais seul le champ « disponible » lui est ouvert (voir gerantOnly)
    update: isStaff,
    delete: isGerant,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title) assertNoTobacco(data.title)
        if (data?.description) assertNoTobacco(data.description)
        return data
      },
    ],
  },
  fields: [
    ...gerantOnly([
      { name: 'title', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      {
        type: 'row',
        fields: [
          {
            name: 'price',
            label: 'Prix (centimes)',
            type: 'number',
            required: true,
            min: 0,
            admin: { description: 'En centimes : 850 = 8,50 €' },
          },
          { name: 'category', label: 'Catégorie', type: 'relationship', relationTo: 'menu-categories', required: true },
        ],
      },
      { name: 'image', label: 'Photo', type: 'upload', relationTo: 'media' },
      {
        name: 'tags',
        label: 'Étiquettes',
        type: 'select',
        hasMany: true,
        options: [
          { label: 'Nouveau', value: 'nouveau' },
          { label: 'Signature', value: 'signature' },
          { label: 'Sans alcool', value: 'sans_alcool' },
          { label: 'Végétarien', value: 'vegetarien' },
          { label: 'Contient de l’alcool', value: 'alcool' },
        ],
      },
      {
        name: 'options',
        label: 'Options',
        type: 'array',
        labels: { singular: 'Option', plural: 'Options' },
        admin: { description: 'Choix proposés à la commande (parfum, supplément…).' },
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'name', label: 'Nom', type: 'text', required: true },
              {
                name: 'supplement',
                label: 'Supplément (centimes)',
                type: 'number',
                defaultValue: 0,
                min: 0,
              },
            ],
          },
        ],
      },
      { name: 'order', label: 'Ordre', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    ]),
    {
      name: 'available',
      label: 'Disponible',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar', description: 'Décoché : le produit disparaît de la carte (rupture).' },
    },
  ],
}
