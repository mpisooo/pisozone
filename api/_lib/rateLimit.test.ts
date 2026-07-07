import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimited } from './rateLimit'

// NB: il limiter tiene lo stato in una Map a livello di modulo che persiste
// tra i test — ogni test usa un IP diverso per non interferire con gli altri.
let ipCounter = 0
function mkReq(ip?: string): VercelRequest {
  return {
    headers: ip ? { 'x-forwarded-for': ip } : {},
    socket: { remoteAddress: '10.0.0.1' },
  } as unknown as VercelRequest
}

function mkRes() {
  const calls: { status?: number; body?: unknown } = {}
  const res = {
    status(code: number) { calls.status = code; return res },
    json(body: unknown) { calls.body = body; return res },
  } as unknown as VercelResponse
  return { res, calls }
}

function uniqueIp() {
  ipCounter++
  return `192.0.2.${ipCounter}`
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('rateLimited', () => {
  it('lascia passare fino alla soglia e blocca oltre, rispondendo 429', () => {
    const ip = uniqueIp()
    const { res, calls } = mkRes()
    for (let i = 0; i < 3; i++) {
      expect(rateLimited(mkReq(ip), res, 3)).toBe(false)
    }
    expect(rateLimited(mkReq(ip), res, 3)).toBe(true)
    expect(calls.status).toBe(429)
  })

  it('tiene conteggi separati per IP diversi', () => {
    const ipA = uniqueIp()
    const ipB = uniqueIp()
    const { res } = mkRes()
    expect(rateLimited(mkReq(ipA), res, 1)).toBe(false)
    expect(rateLimited(mkReq(ipA), res, 1)).toBe(true)
    // ipB non è influenzato dal blocco di ipA
    expect(rateLimited(mkReq(ipB), res, 1)).toBe(false)
  })

  it('azzera il conteggio allo scadere della finestra di 1 minuto', () => {
    const ip = uniqueIp()
    const { res } = mkRes()
    expect(rateLimited(mkReq(ip), res, 1)).toBe(false)
    expect(rateLimited(mkReq(ip), res, 1)).toBe(true)
    vi.advanceTimersByTime(61_000)
    expect(rateLimited(mkReq(ip), res, 1)).toBe(false)
  })

  it('usa il primo IP della catena x-forwarded-for', () => {
    const ip = uniqueIp()
    const { res } = mkRes()
    const req = mkReq(`${ip}, 203.0.113.9`)
    expect(rateLimited(req, res, 1)).toBe(false)
    // Stessa origine anche se il resto della catena cambia
    const req2 = mkReq(`${ip}, 198.51.100.7`)
    expect(rateLimited(req2, res, 1)).toBe(true)
  })
})
