import { randomBytes } from 'crypto'
import type { CollectionConfig } from 'payload'

import { isGerant, isGerantReq, isStaff } from '@/access/roles'

export const newQrToken = () => randomBytes(12).toString('base64url')

export const Tables: CollectionConfig = {
  slug: 'tables',
  labels: { singular: 'Table', plural: 'Tables' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['code', 'label', 'zone', 'capacityMin', 'capacityMax', 'active'],
    group: 'Salle',
    components: {
      beforeListTable: ['@/components/admin/PrintQrButton#PrintQrButton'],
    },
  },
  defaultSort: 'code',
  access: {
    read: isStaff,
    create: isGerant,
    update: isGerant,
    delete: isGerant,
  },
  endpoints: [
    {
      path: '/:id/regenerate-qr',
      method: 'post',
      handler: async (req) => {
        if (!isGerantReq(req)) return Response.json({ error: 'Accès refusé' }, { status: 403 })
        const id = req.routeParams?.id as string
        const doc = await req.payload.update({
          collection: 'tables',
          id,
          data: { qrToken: newQrToken() },
          req,
        })
        return Response.json({ qrToken: doc.qrToken })
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (data.code) data.code = String(data.code).trim().toUpperCase()
        if (!data.qrToken) data.qrToken = newQrToken()
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          label: 'Code',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { description: 'Court, utilisé dans l’URL du QR (ex. T07).' },
          validate: (v: string | null | undefined) =>
            !v || /^[A-Za-z0-9-]{1,8}$/.test(v) ? true : 'Lettres, chiffres ou tiret, 8 caractères max.',
        },
        { name: 'label', label: 'Nom affiché', type: 'text', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'zone',
          label: 'Zone',
          type: 'select',
          required: true,
          defaultValue: 'salle',
          options: [
            { label: 'Salle', value: 'salle' },
            { label: 'Terrasse', value: 'terrasse' },
            { label: 'VIP', value: 'vip' },
            { label: 'Étage', value: 'etage' },
          ],
        },
        { name: 'capacityMin', label: 'Couverts min', type: 'number', required: true, defaultValue: 1, min: 1 },
        { name: 'capacityMax', label: 'Couverts max', type: 'number', required: true, defaultValue: 4, min: 1 },
      ],
    },
    { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    {
      name: 'qrToken',
      label: 'Jeton du QR',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Vérifié en plus du code pour qu’on ne puisse pas deviner les URL. Régénérer invalide les anciens QR.',
      },
    },
    {
      name: 'qrTools',
      type: 'ui',
      admin: {
        components: { Field: '@/components/admin/TableQrField#TableQrField' },
      },
    },
  ],
}
