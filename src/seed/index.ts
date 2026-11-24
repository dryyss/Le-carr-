/**
 * Seed de démo. Lancer avec : npm run seed
 * Idempotent : ne recrée pas un compte qui existe déjà et ne réécrit les paramètres que s'ils sont vides.
 */
import config from '@payload-config'
import { randomBytes } from 'crypto'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const staff = [
  {
    name: 'Gérant [À REMPLACER]',
    email: 'gerant@lecarre.example',
    role: 'gerant' as const,
    envPassword: process.env.SEED_GERANT_PASSWORD,
  },
  {
    name: 'Serveur [À REMPLACER]',
    email: 'serveur@lecarre.example',
    role: 'serveur' as const,
    envPassword: process.env.SEED_SERVEUR_PASSWORD,
  },
]

for (const member of staff) {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: member.email } },
    limit: 1,
  })
  if (existing.totalDocs > 0) {
    payload.logger.info(`Compte déjà présent : ${member.email}`)
    continue
  }
  const password = member.envPassword || randomBytes(9).toString('base64url')
  await payload.create({
    collection: 'users',
    data: { name: member.name, email: member.email, role: member.role, password },
  })
  payload.logger.info(
    `Compte créé : ${member.email} (${member.role})${member.envPassword ? '' : ` mot de passe : ${password}`}`,
  )
}

const settings = await payload.findGlobal({ slug: 'settings' })
if (!settings.openingHours?.length) {
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      name: 'Le Carré',
      address: {
        street: '1 rue de l’Exemple [À REMPLACER]',
        postalCode: '95350',
        city: 'Saint-Brice-sous-Forêt',
      },
      phone: '+33100000000',
      email: 'contact@lecarre.example',
      geo: { lat: 48.9986, lng: 2.3582 },
      socials: [{ network: 'instagram', url: 'https://instagram.com/lecarre [À REMPLACER]' }],
      // [À REMPLACER] horaires réels
      openingHours: [
        { day: '1', open: '17:00', close: '01:00' },
        { day: '2', open: '17:00', close: '01:00' },
        { day: '3', open: '17:00', close: '01:00' },
        { day: '4', open: '17:00', close: '01:00' },
        { day: '5', open: '17:00', close: '02:00' },
        { day: '6', open: '15:00', close: '02:00' },
        { day: '0', open: '15:00', close: '00:00' },
      ],
      slotIntervalMin: 30,
      defaultDurationMin: 120,
      maxPartySizeOnline: 10,
      bookingCutoffMin: 60,
      orderingEnabled: true,
      loyalty: { pointsPerEuro: 1, birthdayBonus: 50, pointsValidityMonths: 12 },
    },
  })
  payload.logger.info('Paramètres de démo enregistrés.')
}

process.exit(0)
