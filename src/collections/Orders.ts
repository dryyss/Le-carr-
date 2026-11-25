import type { CollectionConfig } from 'payload'

import { isGerant, isStaff } from '@/access/roles'
import { pointsForAmount } from '@/lib/loyalty'

type ItemLine = { qty?: number | null; unitPrice?: number | null }

export const ORDER_STATUSES = [
  { label: 'Programmée (précommande)', value: 'programmee' },
  { label: 'Reçue', value: 'recue' },
  { label: 'En préparation', value: 'en_preparation' },
  { label: 'Servie / remise', value: 'servie' },
  { label: 'Annulée', value: 'annulee' },
] as const

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  admin: {
    useAsTitle: 'number',
    defaultColumns: ['number', 'type', 'table', 'total', 'status', 'paymentStatus', 'createdAt'],
    group: 'Salle',
    description: 'Les commandes se suivent en direct sur l’écran bar (/bar).',
  },
  defaultSort: '-createdAt',
  access: {
    read: isStaff,
    // créées uniquement par les parcours clients (Server Actions, Local API)
    create: isGerant,
    update: isStaff,
    delete: isGerant,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // total toujours recalculé côté serveur depuis les lignes figées à la commande
        const items = (data.items ?? originalDoc?.items ?? []) as ItemLine[]
        data.total = items.reduce((sum, i) => sum + (i.qty ?? 0) * (i.unitPrice ?? 0), 0)
        if (data.status === 'servie' && originalDoc?.status !== 'servie') data.servedAt = new Date().toISOString()
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipLoyalty) return doc
        const becameServed = doc.status === 'servie' && previousDoc?.status !== 'servie'
        const customerId = typeof doc.customer === 'object' ? doc.customer?.id : doc.customer
        if (!becameServed || !customerId || doc.pointsAwarded) return doc

        const settings = await req.payload.findGlobal({ slug: 'settings', req })
        const points = pointsForAmount(doc.total ?? 0, settings.loyalty?.pointsPerEuro ?? 1)
        if (points <= 0) return doc

        await req.payload.create({
          collection: 'loyalty-transactions',
          data: { customer: customerId, type: 'gain', points, order: doc.id, reason: `Commande n° ${doc.number}` },
          req,
        })
        await req.payload.update({
          collection: 'orders',
          id: doc.id,
          data: { pointsAwarded: points },
          context: { skipLoyalty: true },
          req,
        })
        return { ...doc, pointsAwarded: points }
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', label: 'N°', type: 'number', required: true, admin: { readOnly: true } },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          defaultValue: 'table',
          index: true,
          options: [
            { label: 'À table', value: 'table' },
            { label: 'Précommande (réservation)', value: 'precommande' },
            { label: 'À emporter', value: 'emporter' },
          ],
        },
        {
          name: 'status',
          label: 'Statut',
          type: 'select',
          required: true,
          defaultValue: 'recue',
          index: true,
          options: [...ORDER_STATUSES],
        },
        { name: 'serviceDate', label: 'Date de service', type: 'text', index: true, admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'table', label: 'Table', type: 'relationship', relationTo: 'tables', index: true },
        { name: 'reservation', label: 'Réservation', type: 'relationship', relationTo: 'reservations', index: true },
        { name: 'customer', label: 'Client fidélité', type: 'relationship', relationTo: 'customers' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'scheduledFor',
          label: 'Prévue pour',
          type: 'date',
          index: true,
          admin: {
            readOnly: true,
            description: 'Heure d’arrivée (précommande) ou de retrait (à emporter).',
            date: { displayFormat: 'dd/MM HH:mm' },
          },
        },
        { name: 'contactName', label: 'Nom', type: 'text' },
        { name: 'contactPhone', label: 'Téléphone', type: 'text' },
      ],
    },
    {
      name: 'items',
      label: 'Articles',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 30,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'menuItem', label: 'Produit', type: 'relationship', relationTo: 'menu-items' },
            { name: 'title', label: 'Libellé', type: 'text', required: true },
            { name: 'qty', label: 'Qté', type: 'number', required: true, min: 1, max: 30 },
            { name: 'unitPrice', label: 'Prix unitaire (centimes)', type: 'number', required: true, min: 0 },
          ],
        },
        { name: 'options', label: 'Options', type: 'text' },
        { name: 'note', label: 'Note', type: 'text' },
      ],
    },
    { name: 'note', label: 'Note du client', type: 'textarea', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'total', label: 'Total (centimes)', type: 'number', admin: { readOnly: true } },
        {
          name: 'paymentMethod',
          label: 'Paiement',
          type: 'select',
          defaultValue: 'caisse',
          options: [
            { label: 'En caisse', value: 'caisse' },
            { label: 'En ligne', value: 'en_ligne' },
          ],
        },
        {
          name: 'paymentStatus',
          label: 'État du paiement',
          type: 'select',
          defaultValue: 'a_regler',
          index: true,
          options: [
            { label: 'À régler en caisse', value: 'a_regler' },
            { label: 'Paiement en ligne en attente', value: 'en_attente' },
            { label: 'Payée', value: 'payee' },
            { label: 'Remboursée', value: 'remboursee' },
          ],
        },
        { name: 'pointsAwarded', label: 'Points crédités', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Paiement en ligne',
      admin: { initCollapsed: true },
      fields: [
        { name: 'paymentProvider', label: 'Prestataire', type: 'text', admin: { readOnly: true } },
        { name: 'paymentRef', label: 'Référence de paiement', type: 'text', index: true, admin: { readOnly: true } },
        { name: 'paidAt', label: 'Payée le', type: 'date', admin: { readOnly: true } },
      ],
    },
    { name: 'servedAt', label: 'Servie à', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
