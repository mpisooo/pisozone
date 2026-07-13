import { describe, it, expect } from 'vitest'
import {
  metricValue,
  clampTarget,
  presetRange,
  computeGoalProgress,
  countActiveGoals,
  typeAllowedForMetric,
  TARGET_MAX,
  type GoalMetric,
} from './goals'
import type { Activity, PersonalGoal } from '../types'

function mkAct(partial: Partial<Activity>): Activity {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    type: 'corsa',
    date: '2026-07-10T18:00:00',
    duration_min: 30,
    calories: 300,
    distance_km: 5,
    notes: null,
    created_at: '2026-07-10T18:00:00',
    credits_earned: 0,
    ...partial,
  }
}

function mkGoal(partial: Partial<PersonalGoal>): PersonalGoal {
  return {
    id: 'g1',
    user_id: 'u1',
    metric: 'km',
    target: 100,
    activity_type: null,
    starts_on: '2026-07-01',
    ends_on: '2026-07-31',
    created_at: '2026-07-01T08:00:00',
    ...partial,
  }
}

const NOW = new Date('2026-07-13T12:00:00')

describe('metricValue', () => {
  it('estrae il contributo giusto per ogni metrica', () => {
    const a = mkAct({ duration_min: 45, distance_km: 7.5, calories: 420 })
    expect(metricValue('sessions', a)).toBe(1)
    expect(metricValue('minutes', a)).toBe(45)
    expect(metricValue('km', a)).toBe(7.5)
    expect(metricValue('kcal', a)).toBe(420)
  })

  it('distanza e calorie assenti valgono zero', () => {
    const a = mkAct({ distance_km: null, calories: null })
    expect(metricValue('km', a)).toBe(0)
    expect(metricValue('kcal', a)).toBe(0)
  })
})

describe('clampTarget', () => {
  it('accetta la virgola decimale e arrotonda a 1 decimale', () => {
    expect(clampTarget('km', '42,25')).toBe(42.3)
  })

  it('le sessioni sono intere', () => {
    expect(clampTarget('sessions', '12.7')).toBe(13)
  })

  it('rifiuta valori non positivi o non numerici', () => {
    expect(clampTarget('km', '0')).toBeNull()
    expect(clampTarget('km', '-5')).toBeNull()
    expect(clampTarget('km', 'boh')).toBeNull()
  })

  it('taglia al tetto per metrica', () => {
    for (const m of ['sessions', 'minutes', 'km', 'kcal'] as GoalMetric[]) {
      expect(clampTarget(m, String(TARGET_MAX[m] * 10))).toBe(TARGET_MAX[m])
    }
  })
})

describe('presetRange', () => {
  it('settimana corrente lunedì-domenica', () => {
    // 2026-07-13 è lunedì
    expect(presetRange('week', NOW)).toEqual({ starts_on: '2026-07-13', ends_on: '2026-07-19' })
    expect(presetRange('week', new Date('2026-07-12T10:00:00'))).toEqual({ starts_on: '2026-07-06', ends_on: '2026-07-12' })
  })

  it('mese corrente dal primo all\'ultimo giorno', () => {
    expect(presetRange('month', NOW)).toEqual({ starts_on: '2026-07-01', ends_on: '2026-07-31' })
  })
})

describe('computeGoalProgress', () => {
  it('somma solo le attività nella finestra e del tipo scelto', () => {
    const goal = mkGoal({ metric: 'km', target: 20, activity_type: 'corsa', starts_on: '2026-07-06', ends_on: '2026-07-12' })
    const p = computeGoalProgress(goal, [
      mkAct({ type: 'corsa', distance_km: 5, date: '2026-07-06T08:00:00' }),   // primo giorno: dentro
      mkAct({ type: 'corsa', distance_km: 4, date: '2026-07-12T22:00:00' }),   // ultimo giorno: dentro
      mkAct({ type: 'bici', distance_km: 30, date: '2026-07-08T08:00:00' }),   // tipo sbagliato
      mkAct({ type: 'corsa', distance_km: 10, date: '2026-07-05T08:00:00' }),  // prima della finestra
      mkAct({ type: 'corsa', distance_km: 10, date: '2026-07-13T08:00:00' }),  // dopo la finestra
    ], NOW)
    expect(p.current).toBe(9)
    expect(p.pct).toBe(45)
    expect(p.reached).toBe(false)
  })

  it('activity_type null accetta tutti gli sport', () => {
    const goal = mkGoal({ metric: 'sessions', target: 3, activity_type: null })
    const p = computeGoalProgress(goal, [
      mkAct({ type: 'corsa' }), mkAct({ type: 'yoga' }), mkAct({ type: 'palestra' }),
    ], NOW)
    expect(p.current).toBe(3)
    expect(p.reached).toBe(true)
  })

  it('pct ha tetto 100 anche oltre il traguardo', () => {
    const goal = mkGoal({ metric: 'minutes', target: 30 })
    const p = computeGoalProgress(goal, [mkAct({ duration_min: 90 })], NOW)
    expect(p.pct).toBe(100)
    expect(p.reached).toBe(true)
  })

  it('daysLeft conta i giorni alla scadenza, 0 se scade oggi', () => {
    expect(computeGoalProgress(mkGoal({ ends_on: '2026-07-15' }), [], NOW).daysLeft).toBe(2)
    expect(computeGoalProgress(mkGoal({ ends_on: '2026-07-13' }), [], NOW).daysLeft).toBe(0)
  })

  it('scaduto: finestra passata senza raggiungere il traguardo', () => {
    const p = computeGoalProgress(mkGoal({ ends_on: '2026-07-10', target: 100 }), [], NOW)
    expect(p.expired).toBe(true)
    expect(p.daysLeft).toBe(0)
  })

  it('un obiettivo raggiunto non è mai "scaduto"', () => {
    const goal = mkGoal({ metric: 'sessions', target: 1, starts_on: '2026-07-01', ends_on: '2026-07-05' })
    const p = computeGoalProgress(goal, [mkAct({ date: '2026-07-03T10:00:00' })], NOW)
    expect(p.reached).toBe(true)
    expect(p.expired).toBe(false)
  })
})

describe('countActiveGoals', () => {
  it('conta solo gli obiettivi né raggiunti né scaduti', () => {
    const goals = [
      mkGoal({ id: 'a', metric: 'sessions', target: 99 }),                       // vivo
      mkGoal({ id: 'b', metric: 'sessions', target: 1 }),                        // raggiunto
      mkGoal({ id: 'c', metric: 'sessions', target: 99, ends_on: '2026-07-01' }), // scaduto
    ]
    expect(countActiveGoals(goals, [mkAct({})], NOW)).toBe(1)
  })
})

describe('typeAllowedForMetric', () => {
  const hasDist = (t: string) => ['corsa', 'bici', 'camminata', 'nuoto', 'motocross'].includes(t)
  it('i km richiedono uno sport con distanza (o tutti gli sport)', () => {
    expect(typeAllowedForMetric('km', 'corsa', hasDist)).toBe(true)
    expect(typeAllowedForMetric('km', 'palestra', hasDist)).toBe(false)
    expect(typeAllowedForMetric('km', null, hasDist)).toBe(true)
    expect(typeAllowedForMetric('minutes', 'palestra', hasDist)).toBe(true)
  })
})
