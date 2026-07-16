import { describe, it, expect } from 'vitest'
import { detectGpsRecords } from './workoutRecap'
import type { Activity, ActivityType } from '../types'

let seq = 0
function act(over: Partial<Activity> = {}): Activity {
  seq++
  return {
    id: `a${seq}`,
    user_id: 'u1',
    type: 'corsa' as ActivityType,
    date: '2026-07-01T09:00:00',
    duration_min: 30,
    calories: null,
    distance_km: 5,
    notes: null,
    created_at: '2026-07-01T09:00:00',
    credits_earned: 0,
    ...over,
  }
}

describe('detectGpsRecords', () => {
  it('sotto il km non annuncia nulla, nemmeno la prima volta', () => {
    expect(detectGpsRecords([], { type: 'corsa', distanceKm: 0.4, durationMin: 5 })).toEqual([])
  })

  it('senza storico dello sport è la prima volta', () => {
    const history = [act({ type: 'palestra', distance_km: null })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 5, durationMin: 30 })
    expect(records).toEqual([{ kind: 'firstOfSport', value: 5 }])
  })

  it('lo storico di un altro sport non conta', () => {
    const history = [act({ type: 'bici', distance_km: 40 })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 3, durationMin: 20 })
    expect(records).toEqual([{ kind: 'firstOfSport', value: 3 }])
  })

  it('distanza oltre il massimo storico = record', () => {
    const history = [act({ distance_km: 8, duration_min: 40 }), act({ distance_km: 10, duration_min: 55 })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 12, durationMin: 70 })
    expect(records.map((r) => r.kind)).toContain('longestDistance')
  })

  it('eguagliare il massimo non è un record', () => {
    const history = [act({ distance_km: 10, duration_min: 45 })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 10, durationMin: 60 })
    expect(records).toEqual([])
  })

  it('passo migliore dello storico = record, anche su distanza inferiore', () => {
    // storico: 10 km in 55 min (5,5 min/km) — oggi: 5 km in 25 min (5,0 min/km)
    const history = [act({ distance_km: 10, duration_min: 55 })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 5, durationMin: 25 })
    expect(records).toEqual([{ kind: 'fastestPace', value: 5 }])
  })

  it('distanza e passo possono arrivare insieme', () => {
    const history = [act({ distance_km: 5, duration_min: 30 })]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 6, durationMin: 33 })
    expect(records.map((r) => r.kind).sort()).toEqual(['fastestPace', 'longestDistance'])
  })

  it('le attività sotto il km nello storico non fanno da metro per il passo', () => {
    // 0,5 km in 2 min = 4 min/km: se contasse, il 5 min/km di oggi non sarebbe record
    const history = [
      act({ distance_km: 0.5, duration_min: 2 }),
      act({ distance_km: 10, duration_min: 55 }),
    ]
    const records = detectGpsRecords(history, { type: 'corsa', distanceKm: 5, durationMin: 25 })
    expect(records).toEqual([{ kind: 'fastestPace', value: 5 }])
  })

  it("esclude l'attività appena salvata dal confronto (update ottimistico)", () => {
    const saved = act({ id: 'just-saved', distance_km: 12, duration_min: 60 })
    const history = [act({ distance_km: 8, duration_min: 48 }), saved]
    const records = detectGpsRecords(history, {
      id: 'just-saved', type: 'corsa', distanceKm: 12, durationMin: 60,
    })
    expect(records.map((r) => r.kind).sort()).toEqual(['fastestPace', 'longestDistance'])
  })
})
