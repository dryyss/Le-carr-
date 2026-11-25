import type { CollectionConfig } from 'payload'

import { isGerant, isStaff } from '@/access/roles'
import { toE164 } from '@/lib/phone'

/**
 * Clients finaux. Connexion par code SMS à usage unique (voir lib/customer-session.ts),
 * pas de mot de passe. Les points ne s'écrivent que via LoyaltyTransactions.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Client', plural: 'Clients fidélité' },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'phone', 'points', 'visits', 'optInSms', 'createdAt'],
    group: 'Fidélité',
    listSearchableFields: ['displayName', 'phone', 'email'],
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isGerant,
    delete: isGerant,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (data.phone) data.phone = toE164(data.phone) ?? data.phone
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        const first = data.firstName ?? originalDoc?.firstName
        const last = data.lastName ?? originalDoc?.lastName
        const phone = data.phone ?? originalDoc?.phone
        data.displayName = [first, last].filter(Boolean).join(' ') || phone
        const optedIn = (data.optInSms ?? originalDoc?.optInSms) || (data.optInEmail ?? originalDoc?.optInEmail)
        const wasOptedIn = originalDoc?.optInSms || originalDoc?.optInEmail
        if (optedIn && !wasOptedIn) data.optInDate = new Date().toISOString()
        if (!optedIn) data.optInDate = null
        return data
      },
    ],
  },
  fields: [
    { name: 'displayName', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'firstName', label: 'Prénom', type: 'text' },
        { name: 'lastName', label: 'Nom', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phone',
          label: 'Téléphone',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          validate: (v: string | null | undefined) => (v && toE164(v) ? true : 'Numéro invalide'),
        },
        { name: 'email', label: 'E-mail', type: 'email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'birthdayDay', label: 'Anniversaire : jour', type: 'number', min: 1, max: 31 },
        { name: 'birthdayMonth', label: 'Anniversaire : mois', type: 'number', min: 1, max: 12 },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'points',
          label: 'Points',
          type: 'number',
          defaultValue: 0,
          access: { create: () => false, update: () => false },
          admin: { readOnly: true, description: 'Modifiable uniquement par une transaction de fidélité.' },
        },
        { name: 'visits', label: 'Visites', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Consentements (RGPD)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'optInSms', label: 'Accepte les SMS d’offres', type: 'checkbox', defaultValue: false },
            { name: 'optInEmail', label: 'Accepte les mails d’offres', type: 'checkbox', defaultValue: false },
            { name: 'optInDate', label: 'Date du consentement', type: 'date', admin: { readOnly: true } },
          ],
        },
      ],
    },
    {
      name: 'lastBirthdayBonusYear',
      type: 'number',
      admin: { hidden: true },
      access: { read: () => true },
    },
    { name: 'lastActivityAt', label: 'Dernière activité', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'history',
      label: 'Historique',
      type: 'join',
      collection: 'loyalty-transactions',
      on: 'customer',
      admin: { defaultColumns: ['type', 'points', 'reason', 'createdAt'] },
    },
  ],
  timestamps: true,
}
