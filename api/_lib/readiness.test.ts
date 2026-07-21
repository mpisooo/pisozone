import { describe, it, expect } from 'vitest'
import { computeReadiness as computeReadinessServer } from './readiness'
import { computeReadiness as computeReadinessClient } from '../../src/lib/readiness'
import type { Activity, RecoveryLog } from '../../src/types'

// Confronta il gemello server (./readiness.ts) con l'originale client
// (src/lib/readiness.ts) sugli stessi dati: se la formula lato client cambia
// senza rispecchiare la copia qui, questo test fallisce — stesso principio
// di seasonalPodium.test.ts per SEASONAL_WINDOWS.

const NOW = new Date('2026-07-21T12:00:00Z')

function activity(date: string, durationMin: number, rpe: number | null): Activity {
  return {
    id: 'a', user_id: 'u', type: 'corsa', date, duration_min: durationMin,
    calories: null, distance_km: null, notes: null, created_at: date,
    credits_earned: 0, rpe,
  }
}

function recovery(day: string, sleepHours: number | null, rest: boolean): RecoveryLog {
  return { id: 'r', user_id: 'u', day, rest, water_ml: null, sleep_hours: sleepHours }
}

describe('computeReadiness — server twin vs client originale', () => {
  it('nessun dato: entrambi null', () => {
    expect(computeReadinessServer([], [], NOW)).toBeNull()
    expect(computeReadinessClient([], [], NOW)).toBeNull()
  })

  it('solo carico settimanale disponibile', () => {
    const acts = [
      activity('2026-07-20T08:00:00Z', 45, 6),
      activity('2026-07-13T08:00:00Z', 40, 5),
    ]
    expect(computeReadinessServer(acts, [], NOW)).toEqual(computeReadinessClient(acts, [], NOW))
  })

  it('tutti i fattori disponibili — buona prontezza', () => {
    const acts = [
      activity('2026-07-20T08:00:00Z', 30, 3),
      activity('2026-07-18T08:00:00Z', 30, 3),
      activity('2026-07-13T08:00:00Z', 60, 6),
    ]
    const logs = [
      recovery('2026-07-21', 7.5, true),
      recovery('2026-07-20', 7, false),
      recovery('2026-07-19', 8, false),
      recovery('2026-07-10', 7, false),
    ]
    const server = computeReadinessServer(acts, logs, NOW)
    const client = computeReadinessClient(acts, logs, NOW)
    expect(server).toEqual(client)
    expect(server?.advice).toBe('push')
  })

  it('tutti i fattori disponibili — prontezza bassa (poco sonno, carico in salita, RPE alto)', () => {
    const acts = [
      activity('2026-07-20T08:00:00Z', 90, 10),
      activity('2026-07-19T08:00:00Z', 90, 10),
      activity('2026-07-18T08:00:00Z', 90, 10),
      activity('2026-07-06T08:00:00Z', 15, 2),
    ]
    const logs = [
      recovery('2026-07-21', 4, false),
      recovery('2026-07-20', 4, false),
      recovery('2026-07-19', 4, false),
      recovery('2026-07-10', 4, false),
    ]
    const server = computeReadinessServer(acts, logs, NOW)
    const client = computeReadinessClient(acts, logs, NOW)
    expect(server).toEqual(client)
    expect(server?.score).toBeLessThan(40)
    expect(server?.advice).toBe('rest')
  })

  it('recovery_logs presenti ma fuori dalla finestra del sonno (solo il fattore riposo conta)', () => {
    const logs = [recovery('2026-07-08', 8, true)]
    expect(computeReadinessServer([], logs, NOW)).toEqual(computeReadinessClient([], logs, NOW))
  })
})
