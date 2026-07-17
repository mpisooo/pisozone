import { describe, it, expect } from 'vitest'
import { computeStats } from './achievementStats'
import type { Activity } from '../types'

let seq = 0
function act(partial: Partial<Activity>): Activity {
  return {
    id: `a${++seq}`,
    user_id: 'u1',
    type: 'corsa',
    date: '2026-07-10T18:00:00+02:00',
    duration_min: 45,
    calories: null,
    distance_km: null,
    notes: null,
    created_at: '2026-07-10T19:00:00Z',
    credits_earned: 0,
    ...partial,
  }
}

// Le statistiche delle medaglie della montagna (roadmap v3, pilastro 03):
// km col GPS e D+ cumulato. Le altre voci di computeStats sono coperte
// indirettamente dalle medaglie storiche, qui si blindano le due nuove.
describe('computeStats — medaglie della montagna', () => {
  it('totalGpsKm somma la distanza delle sole attività tracciate col GPS', () => {
    const stats = computeStats([
      act({ type: 'corsa', distance_km: 8, gps_tracked: true }),
      act({ type: 'bici', distance_km: 20, gps_tracked: true }),
      act({ type: 'corsa', distance_km: 10 }), // inserita a mano: non conta
      act({ type: 'palestra' }),
    ], 3)
    expect(stats.totalGpsKm).toBe(28)
    // Il totale generale invece conta anche i km manuali
    expect(stats.totalAllKm).toBe(38)
  })

  it('totalElevationGainM somma il D+ ignorando attività senza (pre-v44, manuali o null)', () => {
    const stats = computeStats([
      act({ gps_tracked: true, distance_km: 5, elevation_gain_m: 320 }),
      act({ gps_tracked: true, distance_km: 7, elevation_gain_m: 110 }),
      act({ gps_tracked: true, distance_km: 4, elevation_gain_m: null }), // quota assente
      act({ gps_tracked: true, distance_km: 3 }), // pre-v44: campo undefined
    ], 3)
    expect(stats.totalElevationGainM).toBe(430)
  })

  it('senza attività GPS entrambe le statistiche restano a zero', () => {
    const stats = computeStats([act({ type: 'corsa', distance_km: 12 })], 3)
    expect(stats.totalGpsKm).toBe(0)
    expect(stats.totalElevationGainM).toBe(0)
  })
})
