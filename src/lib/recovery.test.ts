import { describe, it, expect } from 'vitest'
import {
  restDatesFrom,
  restCountInWeek,
  canMarkRest,
  restRemainingInWeek,
  clampWater,
  waterPct,
  clampSleep,
  REST_DAYS_PER_WEEK,
  WATER_MAX_ML,
  WATER_GOAL_ML,
} from './recovery'

// 2026-07-06 è lunedì: la settimana di test va dal 06 al 12 luglio.

describe('restDatesFrom', () => {
  it('estrae solo i giorni con rest attivo', () => {
    expect(restDatesFrom([
      { day: '2026-07-06', rest: true },
      { day: '2026-07-07', rest: false },
      { day: '2026-07-08', rest: true },
    ])).toEqual(['2026-07-06', '2026-07-08'])
  })
})

describe('restCountInWeek', () => {
  it('conta solo i riposi della stessa settimana lunedì-domenica', () => {
    const rests = ['2026-07-05', '2026-07-06', '2026-07-12', '2026-07-13']
    // 05/07 è domenica (settimana prima), 13/07 è il lunedì dopo
    expect(restCountInWeek(rests, '2026-07-08')).toBe(2)
    expect(restCountInWeek(rests, '2026-07-05')).toBe(1)
    expect(restCountInWeek([], '2026-07-08')).toBe(0)
  })
})

describe('canMarkRest', () => {
  it('permette il riposo finché la settimana ha slot liberi', () => {
    expect(canMarkRest([], '2026-07-08')).toBe(true)
    expect(canMarkRest(['2026-07-06'], '2026-07-08')).toBe(true)
    expect(canMarkRest(['2026-07-06', '2026-07-07'], '2026-07-08')).toBe(false)
  })

  it('il giorno stesso non conta nel limite (toggle ripetibile)', () => {
    expect(canMarkRest(['2026-07-06', '2026-07-08'], '2026-07-08')).toBe(true)
  })

  it('i riposi di altre settimane non incidono', () => {
    expect(canMarkRest(['2026-06-29', '2026-06-30', '2026-07-05'], '2026-07-08')).toBe(true)
  })
})

describe('restRemainingInWeek', () => {
  it('scala con i riposi già segnati, senza andare sotto zero', () => {
    expect(restRemainingInWeek([], '2026-07-08')).toBe(REST_DAYS_PER_WEEK)
    expect(restRemainingInWeek(['2026-07-06'], '2026-07-08')).toBe(REST_DAYS_PER_WEEK - 1)
    expect(restRemainingInWeek(['2026-07-06', '2026-07-07', '2026-07-08'], '2026-07-08')).toBe(0)
  })
})

describe('clampWater', () => {
  it('mantiene i millilitri tra 0 e il tetto UI, arrotondati', () => {
    expect(clampWater(-250)).toBe(0)
    expect(clampWater(750)).toBe(750)
    expect(clampWater(WATER_MAX_ML + 250)).toBe(WATER_MAX_ML)
    expect(clampWater(NaN)).toBe(0)
  })
})

describe('waterPct', () => {
  it('percentuale verso l\'obiettivo, con tetto al 100', () => {
    expect(waterPct(null)).toBe(0)
    expect(waterPct(0)).toBe(0)
    expect(waterPct(WATER_GOAL_ML / 2)).toBe(50)
    expect(waterPct(WATER_GOAL_ML * 3)).toBe(100)
  })
})

describe('clampSleep', () => {
  it('mantiene le ore tra 0 e 24 sui mezzi passi', () => {
    expect(clampSleep(-1)).toBe(0)
    expect(clampSleep(7.5)).toBe(7.5)
    expect(clampSleep(7.3)).toBe(7.5)
    expect(clampSleep(30)).toBe(24)
    expect(clampSleep(NaN)).toBe(0)
  })
})
