import { describe, it, expect } from 'vitest'
import { buildWrapped, defaultWrappedPeriods, prevPeriod, wrappedTitle } from './wrapped'
import type { Activity, ActivityType } from '../types'

let seq = 0
function act(date: string, over: Partial<Activity> = {}): Activity {
  seq++
  return {
    id: `a${seq}`,
    user_id: 'u1',
    type: 'palestra' as ActivityType,
    date,
    duration_min: 60,
    calories: 300,
    distance_km: null,
    notes: null,
    created_at: date,
    credits_earned: 0,
    ...over,
  }
}

describe('defaultWrappedPeriods', () => {
  it('a luglio propone giugno e l\'anno precedente', () => {
    const { month, year } = defaultWrappedPeriods(new Date(2026, 6, 14))
    expect(month).toEqual({ kind: 'month', year: 2026, month: 6 })
    expect(year).toEqual({ kind: 'year', year: 2025 })
  })

  it('a gennaio propone dicembre dell\'anno prima', () => {
    const { month, year } = defaultWrappedPeriods(new Date(2026, 0, 5))
    expect(month).toEqual({ kind: 'month', year: 2025, month: 12 })
    expect(year).toEqual({ kind: 'year', year: 2025 })
  })

  it('a dicembre l\'anno corrente diventa disponibile (stile Spotify)', () => {
    const { month, year } = defaultWrappedPeriods(new Date(2026, 11, 10))
    expect(month).toEqual({ kind: 'month', year: 2026, month: 11 })
    expect(year).toEqual({ kind: 'year', year: 2026 })
  })
})

describe('prevPeriod', () => {
  it('scavalca il capodanno per i mesi', () => {
    expect(prevPeriod({ kind: 'month', year: 2026, month: 1 }))
      .toEqual({ kind: 'month', year: 2025, month: 12 })
  })
})

describe('wrappedTitle', () => {
  it('capitalizza il mese italiano', () => {
    expect(wrappedTitle({ kind: 'month', year: 2026, month: 6 })).toBe('Giugno 2026')
  })

  it('per l\'anno è solo l\'anno', () => {
    expect(wrappedTitle({ kind: 'year', year: 2025 })).toBe('2025')
  })
})

describe('buildWrapped', () => {
  const JUNE = { kind: 'month', year: 2026, month: 6 } as const

  it('restituisce null senza attività nel periodo', () => {
    expect(buildWrapped([act('2026-07-01T10:00:00')], JUNE)).toBeNull()
    expect(buildWrapped([], JUNE)).toBeNull()
  })

  it('aggrega i totali del solo periodo richiesto', () => {
    const acts = [
      act('2026-06-01T10:00:00', { type: 'corsa', duration_min: 30, calories: 300, distance_km: 5 }),
      act('2026-06-02T10:00:00', { type: 'corsa', duration_min: 40, calories: 400, distance_km: 7.5 }),
      act('2026-06-02T18:00:00', { type: 'palestra', duration_min: 50, calories: 250 }),
      // fuori periodo: non devono contare
      act('2026-05-31T23:00:00'),
      act('2026-07-01T00:30:00'),
    ]
    const w = buildWrapped(acts, JUNE)!
    expect(w.sessions).toBe(3)
    expect(w.minutes).toBe(120)
    expect(w.calories).toBe(950)
    expect(w.km).toBe(12.5)
    expect(w.activeDays).toBe(2)
    expect(w.distinctSports).toBe(2)
    expect(w.title).toBe('Giugno 2026')
  })

  it('trova sport preferito, giorno più carico e sessione più lunga', () => {
    const acts = [
      act('2026-06-01T10:00:00', { type: 'corsa', duration_min: 30 }),
      act('2026-06-03T10:00:00', { type: 'corsa', duration_min: 45 }),
      act('2026-06-05T10:00:00', { type: 'palestra', duration_min: 90 }),
      act('2026-06-05T18:00:00', { type: 'corsa', duration_min: 30 }),
    ]
    const w = buildWrapped(acts, JUNE)!
    expect(w.topSport).toMatchObject({ type: 'corsa', label: 'Corsa', sessions: 3 })
    expect(w.busiestDay).toEqual({ date: '2026-06-05', minutes: 120 })
    expect(w.longestSessionMin).toBe(90)
  })

  it('calcola lo streak migliore dentro il periodo', () => {
    const acts = [
      act('2026-06-01T10:00:00'), act('2026-06-02T10:00:00'), act('2026-06-03T10:00:00'),
      act('2026-06-10T10:00:00'), act('2026-06-11T10:00:00'),
      // due attività lo stesso giorno non allungano lo streak
      act('2026-06-11T18:00:00'),
    ]
    expect(buildWrapped(acts, JUNE)!.bestStreak).toBe(3)
  })

  it('conta le sessioni del periodo precedente per il confronto', () => {
    const acts = [
      act('2026-06-10T10:00:00'),
      act('2026-05-05T10:00:00'), act('2026-05-20T10:00:00'),
    ]
    expect(buildWrapped(acts, JUNE)!.prevSessions).toBe(2)
  })

  it('individua la zona di intensità dominante', () => {
    const acts = [
      act('2026-06-01T10:00:00', { type: 'corsa', duration_min: 100 }), // zona 4
      act('2026-06-02T10:00:00', { type: 'yoga', duration_min: 20 }),   // zona 1
    ]
    const w = buildWrapped(acts, JUNE)!
    expect(w.topZone?.zoneId).toBe(4)
  })

  it('il periodo annuale copre tutto l\'anno', () => {
    const acts = [
      act('2025-01-15T10:00:00'), act('2025-12-31T23:00:00'), act('2026-01-01T00:10:00'),
    ]
    const w = buildWrapped(acts, { kind: 'year', year: 2025 })!
    expect(w.sessions).toBe(2)
    expect(w.title).toBe('2025')
  })
})
