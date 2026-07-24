import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calcStreak, calcStreakSavedByFreeze, generateDailyChallenges, CHALLENGE_POOL } from './challenges'
import type { Activity, ActivityType } from '../types'

// Oggi fittizio e stabile per tutti i test: martedì 7 luglio 2026, ore 12:00
const TODAY = new Date('2026-07-07T12:00:00')

function mkAct(overrides: Partial<Activity> = {}): Activity {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    type: 'corsa' as ActivityType,
    date: '2026-07-07T10:00:00',
    duration_min: 30,
    calories: 300,
    distance_km: null,
    notes: null,
    created_at: '2026-07-07T10:00:00',
    credits_earned: 0,
    ...overrides,
  }
}

function pool(key: string) {
  const t = CHALLENGE_POOL.find((c) => c.key === key)
  if (!t) throw new Error(`Sfida "${key}" non trovata nel pool`)
  return t
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('calcStreak', () => {
  it('è 0 senza attività', () => {
    expect(calcStreak([])).toBe(0)
  })

  it('conta oggi come giorno 1', () => {
    expect(calcStreak([mkAct({ date: '2026-07-07T08:00:00' })])).toBe(1)
  })

  it('resta vivo se l\'ultima attività è ieri', () => {
    expect(calcStreak([mkAct({ date: '2026-07-06T20:00:00' })])).toBe(1)
  })

  it('è 0 se l\'ultima attività è 2 giorni fa', () => {
    expect(calcStreak([mkAct({ date: '2026-07-05T20:00:00' })])).toBe(0)
  })

  it('conta i giorni consecutivi e si ferma al buco', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00' }),
      mkAct({ date: '2026-07-06T08:00:00' }),
      mkAct({ date: '2026-07-05T08:00:00' }),
      // buco il 4 luglio
      mkAct({ date: '2026-07-03T08:00:00' }),
    ]
    expect(calcStreak(acts)).toBe(3)
  })

  it('più attività nello stesso giorno contano una volta sola', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00' }),
      mkAct({ date: '2026-07-07T19:00:00' }),
    ]
    expect(calcStreak(acts)).toBe(1)
  })

  it('uno streak-freeze copre il giorno mancante', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00' }),
      // 6 luglio congelato, nessuna attività
      mkAct({ date: '2026-07-05T08:00:00' }),
    ]
    expect(calcStreak(acts, ['2026-07-06'])).toBe(3)
    expect(calcStreak(acts, [])).toBe(1)
  })
})

describe('calcStreakSavedByFreeze', () => {
  it('non offre nulla con UNA sola attività oggi e nessuno streak reale prima (bug P0-3 dell\'audit)', () => {
    const acts = [mkAct({ date: '2026-07-07T08:00:00' })] // solo oggi
    expect(calcStreakSavedByFreeze(acts, [], [])).toBe(0)
  })

  it('offre il freeze quando esiste un vero streak di almeno 1 giorno prima del gap', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00' }), // oggi
      // 6 luglio (ieri) mancante: il gap da coprire
      mkAct({ date: '2026-07-05T08:00:00' }), // il giorno prima di ieri: streak reale
    ]
    expect(calcStreakSavedByFreeze(acts, [], [])).toBe(3)
  })

  it('un giorno di riposo prima del gap conta come streak reale, come un\'attività', () => {
    const acts = [mkAct({ date: '2026-07-07T08:00:00' })]
    expect(calcStreakSavedByFreeze(acts, [], ['2026-07-05'])).toBe(3)
  })

  it('non offre nulla se ieri ha già un\'attività (niente gap da coprire)', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00' }),
      mkAct({ date: '2026-07-06T08:00:00' }),
      mkAct({ date: '2026-07-05T08:00:00' }),
    ]
    expect(calcStreakSavedByFreeze(acts, [], [])).toBe(0)
  })

  it('non offre nulla se ieri è già protetto (freeze o riposo già usati)', () => {
    const acts = [mkAct({ date: '2026-07-07T08:00:00' }), mkAct({ date: '2026-07-05T08:00:00' })]
    expect(calcStreakSavedByFreeze(acts, ['2026-07-06'], [])).toBe(0)
    expect(calcStreakSavedByFreeze(acts, [], ['2026-07-06'])).toBe(0)
  })

  it('senza nessuna attività né giorno protetto, non offre mai nulla', () => {
    expect(calcStreakSavedByFreeze([], [], [])).toBe(0)
  })
})

describe('generateDailyChallenges', () => {
  it('restituisce sempre 3 sfide distinte prese dal pool', () => {
    const challenges = generateDailyChallenges('user-abc', '2026-07-07')
    expect(challenges).toHaveLength(3)
    const keys = challenges.map((c) => c.key)
    expect(new Set(keys).size).toBe(3)
    for (const key of keys) {
      expect(CHALLENGE_POOL.some((c) => c.key === key)).toBe(true)
    }
  })

  it('è deterministica per stessa coppia utente+data', () => {
    const a = generateDailyChallenges('user-abc', '2026-07-07').map((c) => c.key)
    const b = generateDailyChallenges('user-abc', '2026-07-07').map((c) => c.key)
    expect(a).toEqual(b)
  })
})

describe('CHALLENGE_POOL — regole di completamento', () => {
  it('nessuna sfida dipende dallo streak: tutte completabili in giornata', () => {
    // Con streak 0 e attività abbondanti, ogni check deve poter risultare true
    const bigDay: Activity[] = [
      mkAct({ type: 'corsa', duration_min: 120, calories: 900, distance_km: 10, date: '2026-07-07T08:00:00' }),
      mkAct({ type: 'yoga', duration_min: 60, calories: 200, date: '2026-07-07T09:30:00' }),
      mkAct({ type: 'palestra', duration_min: 60, calories: 400, date: '2026-07-07T11:00:00' }),
      mkAct({ type: 'nuoto', duration_min: 30, calories: 300, distance_km: 1, date: '2026-07-07T11:30:00' }),
      mkAct({ type: 'bici', duration_min: 30, calories: 250, distance_km: 12, date: '2026-07-07T11:45:00' }),
      mkAct({ type: 'calcio', duration_min: 45, calories: 350, date: '2026-07-07T11:50:00' }),
      mkAct({ type: 'camminata', duration_min: 20, calories: 80, distance_km: 2, date: '2026-07-07T11:55:00' }),
    ]
    for (const c of CHALLENGE_POOL) {
      expect(c.check(bigDay, 0), `la sfida "${c.key}" non è completabile in giornata`).toBe(true)
    }
  })

  it('log_any richiede almeno un\'attività', () => {
    expect(pool('log_any').check([], 0)).toBe(false)
    expect(pool('log_any').check([mkAct()], 0)).toBe(true)
  })

  it('log_30min somma le durate di più attività', () => {
    expect(pool('log_30min').check([mkAct({ duration_min: 15 }), mkAct({ duration_min: 15 })], 0)).toBe(true)
    expect(pool('log_30min').check([mkAct({ duration_min: 29 })], 0)).toBe(false)
  })

  it('burn_200 tollera calorie null', () => {
    expect(pool('burn_200').check([mkAct({ calories: null })], 0)).toBe(false)
    expect(pool('burn_200').check([mkAct({ calories: null }), mkAct({ calories: 200 })], 0)).toBe(true)
  })

  it('dist_3km somma i km e tollera distanze null', () => {
    const c = pool('dist_3km')
    expect(c.check([mkAct({ distance_km: 1.5 }), mkAct({ distance_km: 1.5 })], 0)).toBe(true)
    expect(c.check([mkAct({ distance_km: 2.9 }), mkAct({ distance_km: null })], 0)).toBe(false)
  })

  it('two_types richiede 2 tipi diversi, non solo 2 attività', () => {
    const c = pool('two_types')
    expect(c.check([mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' })], 0)).toBe(false)
    expect(c.check([mkAct({ type: 'corsa' }), mkAct({ type: 'yoga' })], 0)).toBe(true)
  })

  it('log_120min somma le durate', () => {
    const c = pool('log_120min')
    expect(c.check([mkAct({ duration_min: 60 }), mkAct({ duration_min: 60 })], 0)).toBe(true)
    expect(c.check([mkAct({ duration_min: 119 })], 0)).toBe(false)
  })

  it('early_bird richiede un\'attività di 10+ minuti prima delle 12', () => {
    const c = pool('early_bird')
    expect(c.check([mkAct({ date: '2026-07-07T09:00:00', duration_min: 10 })], 0)).toBe(true)
    expect(c.check([mkAct({ date: '2026-07-07T14:00:00', duration_min: 60 })], 0)).toBe(false)
    expect(c.check([mkAct({ date: '2026-07-07T09:00:00', duration_min: 5 })], 0)).toBe(false)
  })
})
