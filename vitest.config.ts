import { defineConfig } from 'vitest/config'

// Config separata da vite.config.ts: i test non hanno bisogno del plugin
// Sentry né del define delle env var, e così girano anche senza .env.local.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
})
