import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Customers } from './collections/Customers'
import { Events } from './collections/Events'
import { LoyaltyTransactions } from './collections/LoyaltyTransactions'
import { Media } from './collections/Media'
import { MenuCategories } from './collections/MenuCategories'
import { MenuItems } from './collections/MenuItems'
import { Orders } from './collections/Orders'
import { PrivatizationRequests } from './collections/PrivatizationRequests'
import { Reservations } from './collections/Reservations'
import { Rewards } from './collections/Rewards'
import { OtpCodes, SmsLogs } from './collections/System'
import { Tables } from './collections/Tables'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { Settings } from './globals/Settings'
import { siteUrl } from './lib/site-url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: siteUrl,
  admin: {
    user: Users.slug,
    theme: 'dark',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Le Carré',
      icons: [{ rel: 'icon', type: 'image/png', url: '/brand/logo.png' }],
    },
    dateFormat: 'dd/MM/yyyy HH:mm',
    components: {
      graphics: {
        Logo: '@/components/admin/Brand#AdminLogo',
        Icon: '@/components/admin/Brand#AdminIcon',
      },
      beforeLogin: ['@/components/admin/DemoLoginHint#DemoLoginHint'],
      beforeDashboard: ['@/components/admin/Dashboard#Dashboard'],
      afterNavLinks: ['@/components/admin/BarLink#BarLink'],
    },
  },
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },
  collections: [
    Reservations,
    Orders,
    Tables,
    PrivatizationRequests,
    MenuCategories,
    MenuItems,
    Customers,
    LoyaltyTransactions,
    Rewards,
    Events,
    Media,
    Users,
    SmsLogs,
    OtpCodes,
  ],
  globals: [Homepage, Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // DATABASE_URL : nom injecté par l'intégration Neon de Vercel
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Jamais de synchro automatique du schéma : tout passe par les migrations (dev comme prod),
    // sinon `payload migrate` bloque le build Vercel sur une question interactive.
    push: false,
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
