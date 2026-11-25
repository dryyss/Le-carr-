import { expect, test, type Page } from '@playwright/test'
import { Client } from 'pg'

/**
 * Parcours complets sur mobile 375 px, en mode démo (aucun SMS, paiement simulé).
 * Prérequis : base seedée (npm run seed avec DEMO_MODE=true).
 */

// numéros réservés à la fiction (ARCEP 06 39 98), un par exécution pour ne pas buter sur les limites anti-abus
const runPhone = () => `06 39 98 ${String(10 + Math.floor(Math.random() * 89))} ${String(10 + Math.floor(Math.random() * 89))}`

async function tableToken(code: string): Promise<string> {
  const db = new Client({ connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL })
  await db.connect()
  const { rows } = await db.query<{ qr_token: string }>('select qr_token from tables where code = $1', [code])
  await db.end()
  return rows[0].qr_token
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'pas de défilement horizontal à 375 px').toBeLessThanOrEqual(1)
}

test.describe('Vitrine', () => {
  test('accueil complet, sans débordement à 375 px', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Le Carré/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Le Carré/i)
    for (const h of ['Sur place, à table ou à emporter', 'Nos incontournables', 'Prochains événements', 'Venir au Carré', 'Bon à savoir']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible()
    }
    await noHorizontalScroll(page)
  })

  test('la carte affiche les produits, sans aucun produit du tabac', async ({ page }) => {
    await page.goto('/carte')
    await expect(page.getByText('Burger mix')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mocktails' })).toBeVisible()
    expect((await page.content()).toLowerCase()).not.toMatch(/chicha|narguil|tabac/)
    await noHorizontalScroll(page)
  })

  test('événements et données structurées', async ({ page }) => {
    await page.goto('/evenements')
    await page.getByRole('link', { name: /Soirée Ligue des champions/ }).click()
    await expect(page.getByRole('link', { name: 'Réserver pour cet événement' })).toBeVisible()
    await page.goto('/')
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(JSON.parse(ld ?? '{}')['@type']).toBe('BarOrPub')
  })

  test('demande de privatisation', async ({ page }) => {
    await page.goto('/privatisation')
    await page.getByLabel('Nom', { exact: true }).fill('Test e2e')
    await page.getByLabel('Téléphone', { exact: true }).fill(runPhone())
    const d = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10)
    await page.getByLabel('Date souhaitée').fill(d)
    await page.getByLabel('Nombre d’invités').fill('30')
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click()
    await expect(page.getByText('Demande envoyée')).toBeVisible()
  })
})

test.describe('Réservation', () => {
  async function startBooking(page: Page) {
    await page.goto('/reserver')
    await page.getByRole('button', { name: '2', exact: true }).click()
    // dans 3 jours : toujours des créneaux, quelle que soit l'heure du test
    await page.locator('fieldset').nth(1).getByRole('button').nth(3).click()
    await page.locator('fieldset').nth(2).getByRole('button', { name: /^\d\d:\d\d$/ }).and(page.locator(':enabled')).first().click()
    await noHorizontalScroll(page)
    await page.getByLabel('Nom', { exact: true }).fill('Client e2e')
    await page.getByLabel('Téléphone mobile').fill(runPhone())
  }

  test('réserver une table : confirmation immédiate', async ({ page }) => {
    await startBooking(page)
    await page.getByRole('button', { name: /^Réserver pour 2/ }).click()
    await page.waitForURL(/\/reserver\/confirmation\//)
    await expect(page.getByRole('heading', { name: 'C’est réservé !' })).toBeVisible()
    await expect(page.getByText('Confirmée')).toBeVisible()

    // annulation par le lien du SMS
    await page.getByRole('link', { name: 'Annuler' }).click()
    await page.getByRole('button', { name: 'Oui, annuler' }).click()
    await expect(page.getByRole('heading', { name: 'Réservation annulée' })).toBeVisible()
  })

  test('réserver avec précommande payée en ligne', async ({ page }) => {
    await startBooking(page)
    await page.getByText('Choisir dès maintenant plats et boissons').click()
    await page.getByRole('button', { name: 'Ajouter Ocean Blue', exact: true }).click()
    await page.getByRole('button', { name: 'Ajouter Burger mix', exact: true }).click()
    await page.getByLabel('Payer en ligne').check()
    await page.getByRole('button', { name: /^Réserver et payer/ }).click()

    await page.waitForURL(/\/paiement\/demo\//)
    await page.getByRole('button', { name: /^Payer/ }).click()
    await page.waitForURL(/\/reserver\/confirmation\/.*paiement=ok/)
    await expect(page.getByRole('heading', { name: 'Votre précommande' })).toBeVisible()
    await expect(page.getByText(/Payée en ligne/)).toBeVisible()
  })

  test('au-delà de 10 personnes : renvoi vers la privatisation', async ({ page }) => {
    await page.goto('/reserver')
    await page.getByLabel('Plus de 8 personnes').selectOption('plus')
    await expect(page.getByRole('link', { name: 'faites une demande de privatisation' })).toBeVisible()
  })
})

test.describe('Commande', () => {
  test('à emporter, payée en ligne, sans alcool proposé', async ({ page }) => {
    await page.goto('/commander')
    await expect(page.getByText('Heineken')).toHaveCount(0)
    await page.getByRole('button', { name: 'Ajouter Burger mix', exact: true }).click()
    await page.getByRole('button', { name: 'Ajouter Tiramisu', exact: true }).click()
    await page.locator('#valider').getByRole('button', { name: /^\d\d:\d\d$/ }).first().click()
    await page.getByLabel('Nom', { exact: true }).fill('Client e2e')
    await page.getByLabel('Téléphone', { exact: true }).fill(runPhone())
    await noHorizontalScroll(page)
    await page.getByRole('button', { name: /^Payer/ }).click()

    await page.waitForURL(/\/paiement\/demo\//)
    await page.getByRole('button', { name: /^Payer/ }).click()
    await page.waitForURL(/\/commande\/\d+.*paiement=ok/)
    await expect(page.getByText('Paiement reçu, merci !')).toBeVisible()
    await expect(page.getByText('Payée en ligne')).toBeVisible()
  })

  test('QR invalide : page d’erreur propre', async ({ page }) => {
    await page.goto('/t/T01?k=faux-jeton')
    await expect(page.getByRole('heading', { name: 'QR code non reconnu' })).toBeVisible()
  })

  test('à table par QR code : la commande part au bar', async ({ page, browser }) => {
    const token = await tableToken('T06')
    await page.goto(`/t/T06?k=${token}`)
    await expect(page.getByText('Table 6')).toBeVisible()
    await noHorizontalScroll(page)

    const closed = await page.getByText(/Nous sommes fermés|momentanément suspendue/).count()
    test.skip(closed > 0, 'Établissement fermé à l’heure du test : la commande à table est désactivée (comportement attendu).')

    await page.getByRole('button', { name: 'Ajouter Virgin mojito', exact: true }).click()
    await page.getByLabel('Fraise').check()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
    await page.getByRole('button', { name: /Voir le panier/ }).click()
    await page.getByLabel('Une précision pour le bar ? (facultatif)').fill('Test e2e')
    await page.getByRole('button', { name: /^Envoyer la commande/ }).click()
    await page.waitForURL(/\/t\/T06\/commande\/\d+/)
    await expect(page.getByText('Reçue au bar')).toBeVisible()
    const number = (await page.getByRole('heading', { level: 1 }).textContent())?.match(/\d+/)?.[0]

    // le serveur la voit sur l'écran bar
    const staff = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await staff.goto('/admin/login')
    await staff.fill('#field-email', 'serveur@lecarre.example')
    await staff.fill('#field-password', 'demo-serveur')
    await staff.click('button[type="submit"]')
    await staff.waitForURL(/\/admin$/)
    await staff.goto('/bar')
    const card = staff.locator('li', { hasText: `n° ${number}` }).filter({ hasText: 'Table 6' })
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: 'Préparer' }).click()
    await expect(staff.getByRole('region', { name: 'En préparation' }).getByText(`n° ${number}`)).toBeVisible()
    await staff.close()

    // et le client voit le statut évoluer (rafraîchi toutes les 5 s)
    await expect(page.getByText('En préparation')).toBeVisible()
  })
})

test.describe('Fidélité', () => {
  test('connexion par code SMS (affiché en démo) puis espace compte', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel('Téléphone mobile').fill(runPhone())
    await page.getByRole('button', { name: 'Recevoir mon code' }).click()
    const code = (await page.locator('strong.font-mono').textContent())?.trim()
    expect(code).toMatch(/^\d{6}$/)

    await page.getByLabel('Code à 6 chiffres').fill('000000' === code ? '111111' : '000000')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByText(/Code incorrect/)).toBeVisible()

    await page.getByLabel('Code à 6 chiffres').fill(code!)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL(/\/compte/)
    await expect(page.getByRole('heading', { name: 'Votre solde' })).toBeVisible()
    await expect(page.getByLabel('Recevoir les offres et soirées par SMS')).not.toBeChecked()
  })
})

test.describe('Back-office et sécurité', () => {
  test('le gérant voit le tableau de bord', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/admin/login')
    await expect(page.getByText('Mode démo')).toBeVisible()
    await page.fill('#field-email', 'gerant@lecarre.example')
    await page.fill('#field-password', 'demo-gerant')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Ce soir au Carré' })).toBeVisible()
    await expect(page.getByText('Top 5 produits (30 jours)')).toBeVisible()

    // depuis le navigateur (cookie de session de l'admin)
    const pdf = await page.evaluate(async () => {
      const res = await fetch('/api/qr?format=pdf')
      return { status: res.status, type: res.headers.get('content-type') }
    })
    expect(pdf).toEqual({ status: 200, type: 'application/pdf' })
  })

  test('les routes protégées refusent un visiteur anonyme', async ({ request }) => {
    expect((await request.get('/api/qr?format=pdf')).status()).toBe(401)
    expect((await request.get('/api/bar/stream')).status()).toBe(401)
    expect((await request.get('/api/cron/rappels')).status()).toBe(401)
    expect((await request.get('/api/cron/quotidien')).status()).toBe(401)
    for (const col of ['orders', 'customers', 'reservations', 'loyalty-transactions', 'otp-codes', 'sms-logs']) {
      const res = await request.get(`/api/${col}`)
      expect(res.status(), `/api/${col}`).toBe(403)
    }
    // la carte reste publique
    expect((await request.get('/api/menu-items?limit=1')).status()).toBe(200)
  })

  test('l’écran bar redirige vers la connexion', async ({ page }) => {
    await page.goto('/bar')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
