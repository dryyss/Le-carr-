import { randomInt } from 'crypto'
import type { Access, CollectionConfig } from 'payload'

import { isGerant, isGerantReq, isStaff, isStaffReq } from '@/access/roles'
import { launchPreorders } from '@/lib/bar'
import { notifyReservationCancelled, notifyReservationConfirmed } from '@/lib/notify'
import { toE164 } from '@/lib/phone'
import { addDays, isValidDate, parisToUtc, parseHHMM, todayParis } from '@/lib/time'

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const newReservationRef = () =>
  `LC-${Array.from({ length: 4 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join('')}`

/** Avant 6 h, une heure saisie appartient à la nuit de la date de service (00:30 => minute 1470). */
export function startMinFromTime(time: string): number {
  const m = parseHHMM(time)
  return m < 6 * 60 ? m + 1440 : m
}

/** Gérant : tout. Serveur : réservations de la veille (après minuit), du jour et du lendemain. */
const readReservations: Access = ({ req }) => {
  if (isGerantReq(req)) return true
  if (!isStaffReq(req)) return false
  const today = todayParis()
  return { date: { in: [addDays(today, -1), today, addDays(today, 1)] } }
}

export const Reservations: CollectionConfig = {
  slug: 'reservations',
  labels: { singular: 'Réservation', plural: 'Réservations' },
  admin: {
    useAsTitle: 'ref',
    defaultColumns: ['ref', 'date', 'startTime', 'name', 'partySize', 'tables', 'status'],
    group: 'Salle',
    listSearchableFields: ['ref', 'name', 'phone', 'email'],
    components: {
      beforeList: ['@/components/admin/ReservationQuickFilters#ReservationQuickFilters'],
    },
  },
  defaultSort: '-startsAt',
  access: {
    read: readReservations,
    create: isStaff,
    update: readReservations,
    delete: isGerant,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (!data.ref) data.ref = newReservationRef()
        if (data.phone) data.phone = toE164(data.phone) ?? data.phone
        if (data.date && data.startTime && isValidDate(data.date) && /^\d{2}:\d{2}$/.test(data.startTime)) {
          data.startMin = startMinFromTime(data.startTime)
          data.startsAt = parisToUtc(data.date, data.startMin).toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context.skipNotify) return doc
        try {
          if (operation === 'create' && doc.status === 'confirmee') {
            await notifyReservationConfirmed(req.payload, doc)
            await req.payload.update({
              collection: 'reservations',
              id: doc.id,
              data: { smsConfirmSentAt: new Date().toISOString() },
              context: { skipNotify: true },
              req,
            })
          }
          if (operation === 'update' && doc.status === 'annulee' && previousDoc?.status !== 'annulee') {
            await notifyReservationCancelled(req.payload, doc)
            // précommandes non lancées : annulées avec la réservation
            await req.payload.update({
              collection: 'orders',
              where: { reservation: { equals: doc.id }, status: { equals: 'programmee' } },
              data: { status: 'annulee' },
              req,
            })
          }
          if (operation === 'update' && doc.status === 'arrivee' && previousDoc?.status !== 'arrivee') {
            // le client est là : sa précommande part au bar, sur sa table
            const firstTable = (doc.tables ?? [])[0]
            const tableId = typeof firstTable === 'object' ? firstTable?.id : firstTable
            await launchPreorders(req.payload, doc.id, tableId ?? undefined, req)
          }
        } catch (err) {
          req.payload.logger.error({ err, msg: `Notification réservation ${doc.ref}` })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'ref', label: 'Référence', type: 'text', unique: true, index: true, admin: { readOnly: true } },
        {
          name: 'status',
          label: 'Statut',
          type: 'select',
          required: true,
          defaultValue: 'confirmee',
          index: true,
          options: [
            { label: 'En attente', value: 'en_attente' },
            { label: 'Confirmée', value: 'confirmee' },
            { label: 'Arrivée', value: 'arrivee' },
            { label: 'Terminée', value: 'terminee' },
            { label: 'Annulée', value: 'annulee' },
            { label: 'Absent (no show)', value: 'no_show' },
          ],
        },
        {
          name: 'source',
          label: 'Origine',
          type: 'select',
          defaultValue: 'telephone',
          options: [
            { label: 'Site web', value: 'web' },
            { label: 'Téléphone', value: 'telephone' },
            { label: 'Sur place', value: 'sur_place' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          label: 'Date de service',
          type: 'text',
          required: true,
          index: true,
          admin: { description: 'AAAA-MM-JJ. Une résa à 00:30 se met sur la date de la soirée.' },
          validate: (v: string | null | undefined) => (v && isValidDate(v) ? true : 'Date attendue : AAAA-MM-JJ'),
        },
        {
          name: 'startTime',
          label: 'Heure',
          type: 'text',
          required: true,
          validate: (v: string | null | undefined) =>
            v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? true : 'Heure attendue : HH:MM',
        },
        { name: 'durationMin', label: 'Durée (min)', type: 'number', required: true, defaultValue: 120, min: 15 },
        { name: 'partySize', label: 'Couverts', type: 'number', required: true, min: 1, max: 60 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nom', type: 'text', required: true },
        { name: 'phone', label: 'Téléphone', type: 'text', required: true, index: true },
        { name: 'email', label: 'E-mail', type: 'email' },
      ],
    },
    {
      name: 'tables',
      label: 'Tables',
      type: 'relationship',
      relationTo: 'tables',
      hasMany: true,
      admin: { description: 'Attribuées automatiquement pour les résas web. Modifiables à la main.' },
    },
    { name: 'customer', label: 'Client fidélité', type: 'relationship', relationTo: 'customers' },
    { name: 'event', label: 'Événement', type: 'relationship', relationTo: 'events' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    {
      name: 'startMin',
      type: 'number',
      admin: { hidden: true },
    },
    {
      name: 'startsAt',
      label: 'Début',
      type: 'date',
      index: true,
      admin: { readOnly: true, position: 'sidebar', date: { displayFormat: 'dd/MM/yyyy HH:mm' } },
    },
    {
      name: 'smsConfirmSentAt',
      label: 'Confirmation envoyée',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar', date: { displayFormat: 'dd/MM HH:mm' } },
    },
    {
      name: 'smsReminderSentAt',
      label: 'Rappel envoyé',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar', date: { displayFormat: 'dd/MM HH:mm' } },
    },
  ],
}
