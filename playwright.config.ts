import { defineConfig, devices } from '@playwright/test'

// Test end-to-end (roadmap v4, pilastro 04): smoke test sui flussi che una
// PWA autenticata via Supabase non permette di verificare senza credenziali
// reali — vedi e2e/README.md per lo scope esatto e cosa manca. `webServer`
// avvia Vite in dev (porta 5173, la stessa dello script `dev`) e aspetta che
// risponda prima di lanciare i test, sia in locale che in CI.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
