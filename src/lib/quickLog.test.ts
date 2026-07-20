import { describe, it, expect } from 'vitest'
import { prefillFromActivity, lastActivityOfType } from './quickLog'
import type { Activity } from '../types'

function act(partial: Partial<Activity>): Activity {
  return {
    id: 'a1',
    user_id: 'u1',
    type: 'corsa',
    date: '2026-07-10T18:00:00+02:00',
    duration_min: 45,
    calories: 400,
    distance_km: 7.5,
    notes: 'giro del parco',
    created_at: '2026-07-10T19:00:00Z',
    credits_earned: 4,
    ...partial,
  }
}

describe('prefillFromActivity', () => {
  it('ricopia sport, durata, distanza, indoor e dislivello', () => {
    expect(prefillFromActivity(act({ indoor: true, elevation_gain_m: 320 }))).toEqual({
      type: 'corsa',
      durationMin: 45,
      distanceKm: 7.5,
      indoor: true,
      elevationGainM: 320,
    })
  })

  it('normalizza a null i campi assenti (pre-migrazione o mai compilati)', () => {
    const p = prefillFromActivity(act({ distance_km: null, indoor: undefined, elevation_gain_m: undefined }))
    expect(p.distanceKm).toBeNull()
    expect(p.indoor).toBeNull()
    expect(p.elevationGainM).toBeNull()
  })
})

describe('lastActivityOfType', () => {
  const activities = [
    act({ id: 'a', type: 'corsa', date: '2026-07-10T18:00:00+02:00' }),
    act({ id: 'b', type: 'palestra', date: '2026-07-12T18:00:00+02:00' }),
    act({ id: 'c', type: 'corsa', date: '2026-07-14T07:30:00+02:00' }),
  ]

  it('trova la più recente dello sport richiesto anche se la lista non è ordinata', () => {
    expect(lastActivityOfType(activities, 'corsa')?.id).toBe('c')
    expect(lastActivityOfType([...activities].reverse(), 'corsa')?.id).toBe('c')
  })

  it('ritorna null se lo sport non è mai stato registrato', () => {
    expect(lastActivityOfType(activities, 'nuoto')).toBeNull()
    expect(lastActivityOfType([], 'corsa')).toBeNull()
  })
})
