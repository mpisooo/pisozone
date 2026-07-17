import { describe, it, expect } from 'vitest'
import { computeWeightTrend, goalOutlook, TREND_MIN_POINTS } from './weightTrend'
import type { WeightLog } from '../types'

const NOW = new Date(2026, 6, 15, 12, 0, 0) // 2026-07-15

let seq = 0
function log(logged_at: string, weight_kg: number): WeightLog {
  return { id: `w${++seq}`, user_id: 'u1', weight_kg, logged_at }
}

// Pesate perfettamente lineari: −0,1 kg al giorno (−0,7 kg/settimana).
const LINEAR_LOSS = [
  log('2026-07-01', 82.0),
  log('2026-07-05', 81.6),
  log('2026-07-10', 81.1),
  log('2026-07-15', 80.6),
]

describe('computeWeightTrend', () => {
  it('stima pendenza settimanale e peso di oggi con la regressione', () => {
    const trend = computeWeightTrend(LINEAR_LOSS, NOW)
    expect(trend).not.toBeNull()
    expect(trend!.slopeKgPerWeek).toBeCloseTo(-0.7, 2)
    expect(trend!.currentKg).toBeCloseTo(80.6, 1)
    expect(trend!.points).toBe(4)
  })

  it('serve un minimo di pesate distribuite su almeno una settimana', () => {
    expect(computeWeightTrend(LINEAR_LOSS.slice(0, TREND_MIN_POINTS - 1), NOW)).toBeNull()
    expect(computeWeightTrend([
      log('2026-07-13', 81.0),
      log('2026-07-14', 80.9),
      log('2026-07-15', 80.8),
    ], NOW)).toBeNull() // 3 pesate ma in soli 2 giorni
  })

  it('le pesate fuori dalla finestra recente non pesano sul trend', () => {
    const withAncient = [log('2025-01-01', 95), ...LINEAR_LOSS]
    const trend = computeWeightTrend(withAncient, NOW)
    expect(trend!.slopeKgPerWeek).toBeCloseTo(-0.7, 2)
    expect(trend!.points).toBe(4)
  })
})

describe('goalOutlook', () => {
  const losing = { slopeKgPerWeek: -0.7, currentKg: 80.6, points: 4 }

  it('con trend nella direzione giusta proietta la data di arrivo', () => {
    const outlook = goalOutlook(losing, 78, NOW)
    expect(outlook.kind).toBe('onTrack')
    if (outlook.kind === 'onTrack') {
      expect(outlook.days).toBe(26) // 2,6 kg a 0,1 kg/giorno
      expect(outlook.etaDate).toEqual(new Date(2026, 7, 10)) // 10 agosto
    }
  })

  it('obiettivo già raggiunto', () => {
    expect(goalOutlook(losing, 80.6, NOW).kind).toBe('reached')
    expect(goalOutlook(losing, 80.5, NOW).kind).toBe('reached')
  })

  it('trend piatto o contrario: nessuna data inventata', () => {
    expect(goalOutlook({ ...losing, slopeKgPerWeek: 0.02 }, 78, NOW).kind).toBe('flat')
    expect(goalOutlook(losing, 85, NOW).kind).toBe('away') // sta scendendo, vuole salire
    expect(goalOutlook({ ...losing, slopeKgPerWeek: 0.7 }, 78, NOW).kind).toBe('away')
  })

  it('oltre un anno di distanza la proiezione non è credibile', () => {
    expect(goalOutlook({ ...losing, slopeKgPerWeek: -0.06 }, 75, NOW).kind).toBe('tooFar')
  })
})
