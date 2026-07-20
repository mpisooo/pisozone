import { describe, it, expect } from 'vitest'
import { predictRaceTimes, formatRaceTime, RACE_DISTANCES } from './racePredictor'
import type { Activity, ActivityType } from '../types'

const NOW = new Date(2026, 6, 15, 12, 0, 0)

let seq = 0
function act(type: ActivityType, date: string, distanceKm: number | null, durationMin: number): Activity {
  return {
    id: `a${++seq}`,
    user_id: 'u1',
    type,
    date,
    duration_min: durationMin,
    calories: null,
    distance_km: distanceKm,
    notes: null,
    created_at: date,
    credits_earned: 0,
  }
}

describe('predictRaceTimes', () => {
  it('è null senza corse comparabili', () => {
    expect(predictRaceTimes([], NOW)).toBeNull()
    expect(predictRaceTimes([act('bici', '2026-07-14', 20, 40)], NOW)).toBeNull()
    expect(predictRaceTimes([act('corsa', '2026-07-14', null, 30)], NOW)).toBeNull()
  })

  it('ignora le corse troppo vecchie (oltre 90 giorni)', () => {
    const old = act('corsa', '2026-01-01', 5, 25)
    expect(predictRaceTimes([old], NOW)).toBeNull()
  })

  it('usa il passo più veloce tra più corse comparabili', () => {
    const slow = act('corsa', '2026-07-10', 5, 30) // 6 min/km
    const fast = act('corsa', '2026-07-12', 5, 25) // 5 min/km
    const result = predictRaceTimes([slow, fast], NOW)
    expect(result!.referenceKm).toBe(5)
    expect(result!.referenceMinutes).toBe(25)
  })

  it('la stima sulla distanza di riferimento coincide col tempo reale', () => {
    const result = predictRaceTimes([act('corsa', '2026-07-14', 5, 25)], NOW)
    const fiveK = result!.predictions.find((p) => p.key === '5k')!
    expect(fiveK.minutes).toBeCloseTo(25, 6)
  })

  it('il passo previsto rallenta all\'aumentare della distanza (esponente di Riegel > 1)', () => {
    const result = predictRaceTimes([act('corsa', '2026-07-14', 5, 25)], NOW)!
    const paces = result.predictions.map((p) => p.minutes / p.km)
    for (let i = 1; i < paces.length; i++) {
      expect(paces[i]).toBeGreaterThan(paces[i - 1])
    }
  })

  it('espone tutte e 4 le distanze standard, in ordine crescente', () => {
    const result = predictRaceTimes([act('corsa', '2026-07-14', 5, 25)], NOW)!
    expect(result.predictions.map((p) => p.key)).toEqual(RACE_DISTANCES.map((d) => d.key))
    const minutes = result.predictions.map((p) => p.minutes)
    for (let i = 1; i < minutes.length; i++) {
      expect(minutes[i]).toBeGreaterThan(minutes[i - 1])
    }
  })
})

describe('formatRaceTime', () => {
  it('formatta sotto l\'ora come M:SS o MM:SS', () => {
    expect(formatRaceTime(22 + 14 / 60)).toBe('22:14')
  })

  it('formatta da un\'ora in su come H:MM:SS', () => {
    expect(formatRaceTime(66.5)).toBe('1:06:30')
  })
})
