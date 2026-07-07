import type { VercelRequest, VercelResponse } from '@vercel/node'

// Soglia anti-abuso per IP, in memoria di istanza (finestra fissa di 1 minuto).
// Non è un rate limit distribuito: si azzera ai cold start e ogni istanza lambda
// conta per sé. Basta però a tagliare burst e brute-force sui nostri volumi;
// il rate limiting vero per utente vive nei trigger del DB (schema v23).
const WINDOW_MS = 60_000
const MAX_TRACKED_IPS = 5000

const hits = new Map<string, { count: number; windowStart: number }>()

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  return first?.trim() || req.socket?.remoteAddress || 'unknown'
}

// Ritorna true se la richiesta è stata bloccata (risposta 429 già inviata).
export function rateLimited(req: VercelRequest, res: VercelResponse, maxPerMinute: number): boolean {
  const now = Date.now()

  if (hits.size > MAX_TRACKED_IPS) {
    for (const [ip, entry] of hits) {
      if (now - entry.windowStart >= WINDOW_MS) hits.delete(ip)
    }
  }

  const ip = clientIp(req)
  const entry = hits.get(ip)
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return false
  }

  entry.count++
  if (entry.count > maxPerMinute) {
    res.status(429).json({ error: 'Too Many Requests' })
    return true
  }
  return false
}
