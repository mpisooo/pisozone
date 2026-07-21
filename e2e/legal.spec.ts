import { test, expect } from '@playwright/test'

// Pagine pubbliche (fuori da ProtectedRoute per definizione, CLAUDE.md):
// devono restare raggiungibili senza sessione.
test.describe('Pagine legali pubbliche', () => {
  test('/privacy è raggiungibile senza login', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: 'PRIVACY POLICY' })).toBeVisible()
  })

  test('/termini è raggiungibile senza login', async ({ page }) => {
    await page.goto('/termini')
    await expect(page.getByRole('heading', { name: 'TERMINI DI SERVIZIO' })).toBeVisible()
  })
})
