import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { anyone, isGerant } from '@/access/roles'

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

const validateTime: TextFieldSingleValidation = (value) =>
  !value || HHMM.test(value) ? true : 'Format attendu : HH:MM (ex. 18:00)'

export const DAYS = [
  { label: 'Lundi', value: '1' },
  { label: 'Mardi', value: '2' },
  { label: 'Mercredi', value: '3' },
  { label: 'Jeudi', value: '4' },
  { label: 'Vendredi', value: '5' },
  { label: 'Samedi', value: '6' },
  { label: 'Dimanche', value: '0' },
]

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Paramètres',
  admin: { group: 'Réglages' },
  access: {
    read: anyone,
    update: isGerant,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Établissement',
          fields: [
            { name: 'name', label: 'Nom', type: 'text', required: true, defaultValue: 'Le Carré' },
            {
              name: 'address',
              label: 'Adresse',
              type: 'group',
              fields: [
                { name: 'street', label: 'Rue', type: 'text' },
                { name: 'postalCode', label: 'Code postal', type: 'text' },
                { name: 'city', label: 'Ville', type: 'text', defaultValue: 'Saint-Brice-sous-Forêt' },
              ],
            },
            { name: 'phone', label: 'Téléphone', type: 'text' },
            { name: 'email', label: 'E-mail de contact', type: 'email' },
            {
              name: 'geo',
              label: 'Coordonnées GPS',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'lat', label: 'Latitude', type: 'number' },
                    { name: 'lng', label: 'Longitude', type: 'number' },
                  ],
                },
              ],
            },
            {
              name: 'socials',
              label: 'Réseaux sociaux',
              type: 'array',
              labels: { singular: 'Réseau', plural: 'Réseaux' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'network',
                      label: 'Réseau',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'TikTok', value: 'tiktok' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'Snapchat', value: 'snapchat' },
                        { label: 'Google', value: 'google' },
                      ],
                    },
                    { name: 'url', label: 'Lien', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Horaires',
          fields: [
            {
              name: 'openingHours',
              label: 'Horaires d’ouverture',
              type: 'array',
              labels: { singular: 'Plage', plural: 'Plages' },
              admin: {
                description:
                  'Une fermeture plus tôt que l’ouverture signifie après minuit (ex. 18:00 à 02:00). La plage appartient au jour d’ouverture.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'day', label: 'Jour', type: 'select', required: true, options: DAYS },
                    { name: 'open', label: 'Ouverture', type: 'text', required: true, validate: validateTime },
                    { name: 'close', label: 'Fermeture', type: 'text', required: true, validate: validateTime },
                  ],
                },
              ],
            },
            {
              name: 'closures',
              label: 'Fermetures exceptionnelles',
              type: 'array',
              labels: { singular: 'Fermeture', plural: 'Fermetures' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'date',
                      label: 'Date',
                      type: 'date',
                      required: true,
                      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                    },
                    { name: 'reason', label: 'Motif', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Réservations',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'slotIntervalMin', label: 'Intervalle des créneaux (min)', type: 'number', required: true, defaultValue: 30, min: 5 },
                { name: 'defaultDurationMin', label: 'Durée par défaut (min)', type: 'number', required: true, defaultValue: 120, min: 30 },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'maxPartySizeOnline',
                  label: 'Couverts max en ligne',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                  min: 1,
                  admin: { description: 'Au-delà, le client est renvoyé vers la demande de privatisation.' },
                },
                {
                  name: 'bookingCutoffMin',
                  label: 'Délai minimum avant créneau (min)',
                  type: 'number',
                  required: true,
                  defaultValue: 60,
                  min: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Commande à table',
          fields: [
            {
              name: 'orderingEnabled',
              label: 'Commande à table activée',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Coupure d’urgence : décoché, la carte reste consultable mais plus personne ne peut commander.',
              },
            },
          ],
        },
        {
          label: 'Fidélité',
          fields: [
            {
              name: 'loyalty',
              label: 'Programme de fidélité',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'pointsPerEuro', label: 'Points par euro', type: 'number', required: true, defaultValue: 1, min: 0 },
                    { name: 'birthdayBonus', label: 'Bonus anniversaire (points)', type: 'number', required: true, defaultValue: 50, min: 0 },
                    {
                      name: 'pointsValidityMonths',
                      label: 'Validité des points (mois)',
                      type: 'number',
                      required: true,
                      defaultValue: 12,
                      min: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
