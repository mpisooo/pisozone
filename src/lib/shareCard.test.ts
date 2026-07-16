import { describe, it, expect } from 'vitest'
import { buildActivityShareData, buildWrappedShareData } from './shareCard'
import { buildWrapped } from './wrapped'
import type { Activity, ActivityType } from '../types'

let seq = 0
function act(date: string, over: Partial<Activity> = {}): Activity {
  seq++
  return {
    id: `a${seq}`,
    user_id: 'u1',
    type: 'corsa' as ActivityType,
    date,
    duration_min: 75,
    calories: 640,
    distance_km: 10.5,
    notes: null,
    created_at: date,
    credits_earned: 0,
    ...over,
  }
}

describe('buildActivityShareData', () => {
  it('compone titolo, data e le tre statistiche di una corsa', () => {
    const data = buildActivityShareData(act('2026-07-12T09:30:00'))
    expect(data.title).toBe('CORSA')
    expect(data.subtitle).toBe('Domenica 12 luglio 2026')
    expect(data.stats).toEqual([
      { value: '1h 15m', label: 'Durata' },
      { value: '640 kcal', label: 'Calorie' },
      { value: '10,5 km', label: 'Distanza' },
    ])
  })

  it('omette calorie e distanza quando mancano', () => {
    const data = buildActivityShareData(
      act('2026-07-12T09:30:00', { type: 'palestra', duration_min: 45, calories: null, distance_km: null }),
    )
    expect(data.title).toBe('PALESTRA')
    expect(data.stats).toEqual([{ value: '45m', label: 'Durata' }])
  })

  it('con un percorso GPS la card porta con sé sagoma e split (2.0)', () => {
    const route = [
      { lat: 45.0, lng: 9.0 },
      { lat: 45.01, lng: 9.0 },
    ]
    const splits = [
      { index: 1, distanceKm: 1, durationMs: 300000, paceMinPerKm: 5, partial: false },
    ]
    const data = buildActivityShareData(act('2026-07-12T09:30:00'), { route, splits })
    expect(data.route).toEqual(route)
    expect(data.splits).toEqual(splits)
  })

  it('con meno di 2 punti il percorso non entra nella card', () => {
    const data = buildActivityShareData(act('2026-07-12T09:30:00'), {
      route: [{ lat: 45.0, lng: 9.0 }],
      splits: [],
    })
    expect(data.route).toBeUndefined()
    expect(data.splits).toBeUndefined()
  })
})

describe('buildWrappedShareData', () => {
  it('per un mese con km sceglie sessioni, tempo, calorie e km', () => {
    const w = buildWrapped(
      [
        act('2026-06-01T10:00:00', { duration_min: 60, calories: 500, distance_km: 8 }),
        act('2026-06-02T10:00:00', { duration_min: 70, calories: 600, distance_km: 9 }),
      ],
      { kind: 'month', year: 2026, month: 6 },
    )!
    const data = buildWrappedShareData(w)
    expect(data.title).toBe('GIUGNO 2026')
    expect(data.subtitle).toBe('Il mio mese in movimento')
    expect(data.stats.map((s) => s.label)).toEqual(['Sessioni', 'Tempo totale', 'Calorie', 'Chilometri'])
    expect(data.stats[0].value).toBe('2')
    expect(data.stats[1].value).toBe('2h 10m')
  })

  it('senza km al loro posto entrano i giorni attivi', () => {
    const w = buildWrapped(
      [act('2026-06-01T10:00:00', { type: 'palestra', calories: 400, distance_km: null })],
      { kind: 'month', year: 2026, month: 6 },
    )!
    const labels = buildWrappedShareData(w).stats.map((s) => s.label)
    expect(labels).toEqual(['Sessioni', 'Tempo totale', 'Calorie', 'Giorni attivi'])
  })
})
