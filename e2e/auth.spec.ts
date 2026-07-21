import { test, expect } from '@playwright/test'

// Form di login/registrazione: solo rendering e validazione client-side, mai
// un accesso vero (nessun account di test seminato — vedi e2e/README.md).
// "Accedi" compare due volte in pagina (tab attiva + bottone submit): dove
// serve univocità si usa il selettore su type="submit", non il testo.
test.describe('Auth', () => {
  test('mostra il form di login di default', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: 'PISOZONE' })).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toHaveText('Accedi')
    await expect(page.getByPlaceholder('il_tuo_username')).toBeVisible()
  })

  test('passa alla scheda di registrazione', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Registrati' }).click()
    await expect(page.locator('button[type="submit"]')).toHaveText('Crea account')
  })

  test('blocca il submit del login con i campi vuoti', async ({ page }) => {
    await page.goto('/auth')
    await page.locator('button[type="submit"]').click()
    // I campi restano required lato browser: nessuna richiesta di rete parte,
    // il form (e non un'altra pagina) resta quello visibile.
    await expect(page.getByPlaceholder('il_tuo_username')).toBeVisible()
  })
})
