import { test, expect } from '@playwright/test'

// Guardia di ProtectedRoute (src/components/ProtectedRoute.tsx): senza
// sessione, ogni rotta interna riporta a /auth invece di renderizzare.
test.describe('Rotte protette', () => {
  for (const path of ['/', '/log', '/stats', '/profile']) {
    test(`${path} senza sessione reindirizza a /auth`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth$/)
      await expect(page.getByRole('heading', { name: 'PISOZONE' })).toBeVisible()
    })
  }
})
