import * as Sentry from '@sentry/react'

// Monitoraggio errori in produzione. Si attiva solo se il DSN è configurato:
// senza VITE_SENTRY_DSN (es. in sviluppo locale) tutte le chiamate Sentry
// diventano no-op e l'app si comporta come prima.
const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Niente replay (pesante e non serve): browserTracingIntegration è
    // già incluso in @sentry/react (nessuna dipendenza nuova) e cattura da
    // solo i Web Vitals (LCP/CLS/INP/TTFB) sulla transazione di pageload.
    // tracesSampleRate basso apposta: sono transazioni, non errori, e la
    // quota free di sentry.io va spesa con parsimonia.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  })
}
