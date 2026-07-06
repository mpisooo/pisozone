import * as Sentry from '@sentry/react'

// Monitoraggio errori in produzione. Si attiva solo se il DSN è configurato:
// senza VITE_SENTRY_DSN (es. in sviluppo locale) tutte le chiamate Sentry
// diventano no-op e l'app si comporta come prima.
const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Solo error monitoring (niente tracing/replay): bundle più leggero e
    // quota free di sentry.io usata solo per gli errori veri.
    sendDefaultPii: false,
  })
}
