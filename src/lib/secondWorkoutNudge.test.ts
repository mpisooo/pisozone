import { describe, it, expect } from 'vitest'
import { secondWorkoutNudge } from './secondWorkoutNudge'
import type { Activity } from '../types'

const act = (partial: Partial<Activity>): Activity => ({
  id: Math.random().toString(36).slice(2), user_id: 'u', type: 'corsa', date: '2026-07-10T08:00:00',
  duration_min: 30, calories: null, distance_km: null, notes: null, created_at: '2026-07-10T08:00:00',
  credits_earned: 0, ...partial,
})

const NOW = new Date(2026, 6, 14, 12, 0)

describe('secondWorkoutNudge', () => {
  it('null senza attività', () => {
    expect(secondWorkoutNudge([], NOW)).toBeNull()
  })

  it('null oltre le 2 attività (non più nella finestra "fragile")', () => {
    const acts = [act({}), act({}), act({})]
    expect(secondWorkoutNudge(acts, NOW)).toBeNull()
  })

  it('null oltre la finestra di rischio di 7 giorni dalla prima attività', () => {
    const acts = [act({ date: '2026-07-01T08:00:00' })]
    expect(secondWorkoutNudge(acts, NOW)).toBeNull()
  })

  it('suggerisce di ripetere lo sport se non è GPS-trackable', () => {
    const acts = [act({ type: 'palestra' })]
    expect(secondWorkoutNudge(acts, NOW)).toEqual({ kind: 'repeat', activityType: 'palestra' })
  })

  it('suggerisce di provare il GPS se lo sport lo supporta ma non è stato tracciato', () => {
    const acts = [act({ type: 'corsa', gps_tracked: false })]
    expect(secondWorkoutNudge(acts, NOW)).toEqual({ kind: 'tryGps', activityType: 'corsa' })
  })

  it('suggerisce di ripetere se lo sport GPS-trackable è già stato tracciato col GPS', () => {
    const acts = [act({ type: 'corsa', gps_tracked: true })]
    expect(secondWorkoutNudge(acts, NOW)).toEqual({ kind: 'repeat', activityType: 'corsa' })
  })

  it('guarda all\'attività più recente tra le due registrate', () => {
    const acts = [act({ date: '2026-07-10T08:00:00', type: 'corsa', gps_tracked: true }), act({ date: '2026-07-12T08:00:00', type: 'palestra' })]
    expect(secondWorkoutNudge(acts, NOW)).toEqual({ kind: 'repeat', activityType: 'palestra' })
  })
})
