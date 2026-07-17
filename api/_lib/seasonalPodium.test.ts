import { describe, it, expect } from 'vitest'
import {
  SEASONAL_WINDOWS,
  plusDays,
  seasonalEventsToAnnounce,
  computeSeasonalPodium,
} from './seasonalPodium'
import { SEASONAL_EVENTS } from '../../src/lib/seasonalEvents'

// Il patto dei gemelli: il catalogo server (solo finestre) deve rispecchiare
// SEASONAL_EVENTS voce per voce — chi aggiunge un evento lato client senza
// aggiornare il cron rompe questo test, non il podio in produzione.
describe('allineamento col catalogo client', () => {
  it('stesse chiavi, metriche, sport e finestre di SEASONAL_EVENTS', () => {
    expect(SEASONAL_WINDOWS.map((w) => w.key)).toEqual(SEASONAL_EVENTS.map((e) => e.key))
    for (const w of SEASONAL_WINDOWS) {
      const e = SEASONAL_EVENTS.find((ev) => ev.key === w.key)!
      expect(w.metric).toBe(e.metric)
      expect(w.activityType).toBe(e.activityType)
      expect(w.startsOn).toBe(e.startsOn)
      expect(w.endsOn).toBe(e.endsOn)
    }
  })
})

describe('plusDays', () => {
  it('somma e sottrae giorni di calendario, cambi di mese inclusi', () => {
    expect(plusDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(plusDays('2026-09-01', -3)).toBe('2026-08-29')
    expect(plusDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('seasonalEventsToAnnounce', () => {
  it('propone un evento appena chiuso, entro i giorni di ripescaggio', () => {
    expect(seasonalEventsToAnnounce('2026-09-01').map((e) => e.key)).toEqual(['estate-2026'])
    expect(seasonalEventsToAnnounce('2026-09-03').map((e) => e.key)).toEqual(['estate-2026'])
  })

  it('niente eventi ancora aperti né chiusi da troppo', () => {
    expect(seasonalEventsToAnnounce('2026-08-31')).toEqual([]) // ultimo giorno: ancora aperto
    expect(seasonalEventsToAnnounce('2026-09-10')).toEqual([]) // oltre il ripescaggio
  })
})

describe('computeSeasonalPodium', () => {
  const row = (user: string, over: Partial<{ duration_min: number; distance_km: number; calories: number }> = {}) => ({
    user_id: user,
    duration_min: over.duration_min ?? null,
    distance_km: over.distance_km ?? null,
    calories: over.calories ?? null,
  })

  it('aggrega per utente e ordina il podio (metrica km)', () => {
    const podium = computeSeasonalPodium([
      row('a', { distance_km: 10 }), row('a', { distance_km: 5 }),
      row('b', { distance_km: 12 }),
      row('c', { distance_km: 3 }),
      row('d', { distance_km: 1 }),
    ], 'km')
    expect(podium.map((p) => [p.user_id, p.rank])).toEqual([['a', 1], ['b', 2], ['c', 3]])
  })

  it('sessions conta le righe; chi è oltre il podio resta fuori', () => {
    const podium = computeSeasonalPodium([
      row('a'), row('a'), row('a'),
      row('b'), row('b'),
      row('c'),
      row('d'), // 1 sessione come c: pari merito al 3° posto
    ], 'sessions')
    expect(podium.map((p) => p.rank)).toEqual([1, 2, 3, 3])
  })

  it('i pari merito condividono il rank come guard_seasonal_claim', () => {
    const podium = computeSeasonalPodium([
      row('a', { calories: 500 }),
      row('b', { calories: 500 }),
      row('c', { calories: 100 }),
    ], 'kcal')
    expect(podium.filter((p) => p.rank === 1).length).toBe(2)
    expect(podium.find((p) => p.user_id === 'c')?.rank).toBe(3)
  })

  it('valori a zero non salgono sul podio', () => {
    expect(computeSeasonalPodium([row('a'), row('b')], 'km')).toEqual([])
  })
})
