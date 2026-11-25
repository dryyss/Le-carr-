import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.local' })
config()

/**
 * Tests de parcours (e2e), sur mobile 375 px comme l'exige le brief.
 * Prérequis : base seedée en mode démo (DEMO_MODE=true), puis `npm run build`.
 * Lancer : npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    {
      name: 'mobile-375',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'npm run start',
    reuseExistingServer: true,
    url: 'http://localhost:3000',
    timeout: 120_000,
  },
})
