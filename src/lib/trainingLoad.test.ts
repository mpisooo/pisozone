import { describe, it, expect } from 'vitest'
import { buildTrainingLoadSeries, loadJumpPct, LOAD_JUMP_THRESHOLD } from './trainingLoad'
import type { Activity } from '../types'

// 2026-07-15 è mercoledì: la settimana corrente va dal 13 al 19 luglio.
const NOW = new Date(2026, 6, 15, 12, 0, 0)

let seq = 0
function act(date: string, durationMin: number, rpe: number | null | undefined): Activity {
  return {
    id: `a${++seq}`,
    user_id: 'u1',
    type: 'corsa',
    date,
    duration_min: durationMin,
    calories: null,
    distance_km: null,
    notes: null,
    created_at: date,
    credits_earned: 0,
    rpe,
  }
}

describe('buildTrainingLoadSeries', () => {
  it('somma rpe × minuti per settimana lunedì-domenica', () => {
    const series = buildTrainingLoadSeries([
      act('2026-07-13T18:00:00', 60, 7), // settimana corrente: 420
      act('2026-07-15T08:00:00', 30, 4), // settimana corrente: +120
      act('2026-07-07T18:00:00', 45, 6), // settimana precedente: 270
    ], 8, NOW)
    expect(series).toHaveLength(8)
    expect(series[7].load).toBe(540)
    expect(series[7].sessionsWithRpe).toBe(2)
    expect(series[6].load).toBe(270)
    expect(series[0].load).toBe(0)
  })

  it('le sessioni senza RPE contano nel totale ma non nel carico', () => {
    const series = buildTrainingLoadSeries([
      act('2026-07-14T18:00:00', 60, 8),
      act('2026-07-14T20:00:00', 90, null),
      act('2026-07-13T07:00:00', 45, undefined), // pre-migrazione v30
    ], 8, NOW)
    const current = series[7]
    expect(current.load).toBe(480)
    expect(current.sessions).toBe(3)
    expect(current.sessionsWithRpe).toBe(1)
  })

  it('le attività fuori finestra vengono ignorate', () => {
    const series = buildTrainingLoadSeries([act('2025-01-01T10:00:00', 60, 9)], 8, NOW)
    expect(series.every((w) => w.load === 0)).toBe(true)
  })
})

describe('loadJumpPct', () => {
  const week = (load: number) => ({ key: '', label: '', load, sessionsWithRpe: 1, sessions: 1 })

  it('segnala il salto oltre la soglia con la percentuale di aumento', () => {
    expect(loadJumpPct([week(400), week(800)])).toBe(100)
    expect(loadJumpPct([week(300), week(480)])).toBe(60)
  })

  it('tace sotto la soglia o senza termine di paragone', () => {
    expect(loadJumpPct([week(400), week(500)])).toBeNull()
    expect(loadJumpPct([week(400), week(400 * LOAD_JUMP_THRESHOLD)])).toBeNull() // il limite esatto non è un salto
    expect(loadJumpPct([week(0), week(900)])).toBeNull()
    expect(loadJumpPct([week(600)])).toBeNull()
  })
})
