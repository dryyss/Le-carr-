import { expect, test } from '@playwright/test'

test.describe('Vitrine', () => {
  test('affiche la page d’accueil', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Le Carré/)
    await expect(page.locator('h1').first()).toHaveText('Le Carré')
  })
})
