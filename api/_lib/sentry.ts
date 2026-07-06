import * as Sentry from '@sentry/node'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Come sul client: senza SENTRY_DSN tutte le chiamate sono no-op.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? 'development',
  })
}

// Logga e riporta a Sentry un errore non fatale (la richiesta prosegue).
// Il flush avviene a fine richiesta dentro withSentry.
export function captureError(err: unknown, extra?: Record<string, unknown>) {
  console.error(err)
  Sentry.captureException(err, extra ? { extra } : undefined)
}

type Handler = (req: VercelRequest, res: VercelResponse) => unknown

// Avvolge un handler Vercel: cattura le eccezioni non gestite, risponde 500 e
// svuota la coda eventi prima che la lambda venga congelata (senza flush gli
// eventi andrebbero persi).
export function withSentry(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      return await handler(req, res)
    } catch (err) {
      console.error('Unhandled error in API handler:', err)
      Sentry.captureException(err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' })
      }
      return undefined
    } finally {
      await Sentry.flush(2000)
    }
  }
}
