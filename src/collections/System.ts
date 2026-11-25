import type { CollectionConfig } from 'payload'

import { hiddenUnlessGerant, isGerant, nobody } from '@/access/roles'

/** Codes de connexion à usage unique (stockés hachés). Jamais exposés. */
export const OtpCodes: CollectionConfig = {
  slug: 'otp-codes',
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'consumed', type: 'checkbox', defaultValue: false },
  ],
}

/** Journal de tous les SMS (suivi de la consommation facturée au client). */
export const SmsLogs: CollectionConfig = {
  slug: 'sms-logs',
  labels: { singular: 'SMS envoyé', plural: 'Journal SMS' },
  admin: {
    useAsTitle: 'to',
    defaultColumns: ['createdAt', 'to', 'type', 'category', 'status', 'segments'],
    group: 'Réglages',
    hidden: hiddenUnlessGerant,
  },
  defaultSort: '-createdAt',
  access: { read: isGerant, create: nobody, update: nobody, delete: isGerant },
  fields: [
    { name: 'to', label: 'Destinataire', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Confirmation', value: 'confirmation' },
        { label: 'Rappel', value: 'rappel' },
        { label: 'Annulation', value: 'annulation' },
        { label: 'Code de connexion', value: 'otp' },
        { label: 'Anniversaire', value: 'anniversaire' },
        { label: 'Offre', value: 'offre' },
      ],
    },
    {
      name: 'category',
      label: 'Catégorie',
      type: 'select',
      options: [
        { label: 'Transactionnel', value: 'transactional' },
        { label: 'Marketing', value: 'marketing' },
      ],
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { label: 'Envoyé', value: 'envoye' },
        { label: 'Échec', value: 'echec' },
        { label: 'Démo (non envoyé)', value: 'demo' },
      ],
    },
    { name: 'segments', label: 'Segments', type: 'number' },
    { name: 'content', label: 'Contenu', type: 'textarea' },
    { name: 'providerId', label: 'ID fournisseur', type: 'text' },
    { name: 'error', label: 'Erreur', type: 'textarea' },
  ],
}
