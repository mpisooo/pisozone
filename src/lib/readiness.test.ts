import { describe, it, expect } from 'vitest'
import { computeReadiness } from './readiness'
import type { Activity, RecoveryLog } from '../types'

// 2026-07-15 è mercoledì: la settimana corrente va dal 13 al 19 luglio,
// la precedente dal 6 al 12 (stesso fixture di trainingLoad.test.ts).
const NOW = new Date(2026, 6, 15, 12, 0, 0)

let actSeq = 0
function act(date: string, durationMin: number, rpe: number | null | undefined): Activity {
  return {
    id: `a${++actSeq}`,
    user_id: 'u1',
    type: 'corsa',
    date,
    duration_min: durationMin,
    calories: null,
    distance_km: null,
    notes: null,
    created_at: date,
    credits_earned: 0,
    rpe,
  }
}

let logSeq = 0
function log(day: string, opts: { sleep_hours?: number | null; rest?: boolean }): RecoveryLog {
  return {
    id: `r${++logSeq}`,
    user_id: 'u1',
    day,
    rest: opts.rest ?? false,
    water_ml: null,
    sleep_hours: opts.sleep_hours ?? null,
  }
}

describe('computeReadiness', () => {
  it('è null senza alcun dato', () => {
    expect(computeReadiness([], [], NOW)).toBeNull()
  })

  it('senza attività, sonno e riposo bastano a dare un punteggio alto', () => {
    const logs = [log('2026-07-14', { sleep_hours: 8 }), log('2026-07-15', { sleep_hours: 8, rest: true })]
    const result = computeReadiness([], logs, NOW)
    expect(result).not.toBeNull()
    expect(result!.factors.load).toBeNull()
    expect(result!.factors.rpe).toBeNull()
    expect(result!.factors.sleep).toBe(100)
    expect(result!.factors.rest).toBe(100)
    expect(result!.score).toBe(100)
    expect(result!.advice).toBe('push')
  })

  it('sonno scarso e nessun riposo recente abbassano il punteggio', () => {
    const logs = [log('2026-07-14', { sleep_hours: 4 }), log('2026-07-15', { sleep_hours: 4 })]
    const result = computeReadiness([], logs, NOW)
    expect(result!.factors.sleep).toBe(0)
    expect(result!.factors.rest).toBe(55)
    expect(result!.score).toBe(18)
    expect(result!.advice).toBe('rest')
  })

  it('un salto di carico e un RPE recente alto abbassano il punteggio anche senza dati di recupero', () => {
    const activities = [
      act('2026-07-07T10:00:00', 60, 3), // settimana precedente: 180
      act('2026-07-14T10:00:00', 90, 9), // settimana corrente: 810 — salto oltre la soglia
    ]
    const result = computeReadiness(activities, [], NOW)
    expect(result!.factors.load).toBe(15)
    expect(result!.factors.rpe).toBe(44)
    expect(result!.factors.sleep).toBeNull()
    expect(result!.factors.rest).toBeNull()
    expect(result!.score).toBe(28)
    expect(result!.advice).toBe('rest')
  })

  it('senza una settimana precedente di riferimento il carico non penalizza', () => {
    const activities = [act('2026-07-14T10:00:00', 30, 2)]
    const logs = [log('2026-07-14', { sleep_hours: 8 }), log('2026-07-15', { sleep_hours: 8, rest: true })]
    const result = computeReadiness(activities, logs, NOW)
    expect(result!.factors.load).toBe(100)
    expect(result!.factors.rpe).toBe(89)
    expect(result!.score).toBe(97)
    expect(result!.advice).toBe('push')
  })

  it('la soglia "mantieni" copre la fascia intermedia', () => {
    // Sonno moderato (né scarso né ottimo) e nessun riposo recente
    const logs = [log('2026-07-14', { sleep_hours: 6 }), log('2026-07-15', { sleep_hours: 6 })]
    const result = computeReadiness([], logs, NOW)
    expect(result!.advice).toBe('steady')
    expect(result!.score).toBeGreaterThanOrEqual(40)
    expect(result!.score).toBeLessThan(70)
  })
})
