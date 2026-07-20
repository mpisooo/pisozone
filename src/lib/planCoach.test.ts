import { describe, it, expect } from 'vitest'
import { computePlanCoachAdvice, PLAN_COACH_MISSED_THRESHOLD } from './planCoach'
import type { PlanProgress, PlanSessionProgress } from './plans'

function session(week: number, done: boolean): PlanSessionProgress {
  return { template: { week, label: 's', types: ['corsa'], minMinutes: 20 }, done, activityId: done ? 'a1' : null }
}

function progress(overrides: {
  sessions: PlanSessionProgress[]
  currentWeek?: number
  completed?: boolean
  expired?: boolean
}): PlanProgress {
  const doneCount = overrides.sessions.filter((s) => s.done).length
  return {
    sessions: overrides.sessions,
    doneCount,
    totalCount: overrides.sessions.length,
    currentWeek: overrides.currentWeek ?? 1,
    completed: overrides.completed ?? false,
    expired: overrides.expired ?? false,
    endsOn: '2026-08-01',
  }
}

describe('computePlanCoachAdvice', () => {
  it('tace se il piano è completato', () => {
    const p = progress({ sessions: [session(1, true)], completed: true })
    expect(computePlanCoachAdvice(p, null)).toBeNull()
  })

  it('tace se il piano è scaduto (se ne occupa già un altro avviso)', () => {
    const p = progress({
      sessions: [session(1, false), session(1, false), session(1, false)],
      currentWeek: 1,
      expired: true,
    })
    expect(computePlanCoachAdvice(p, null)).toBeNull()
  })

  it('tace se si è in pari o indietro di una sola sessione', () => {
    const onTrack = progress({ sessions: [session(1, true), session(1, true), session(2, false)], currentWeek: 1 })
    expect(computePlanCoachAdvice(onTrack, null)).toBeNull()

    const oneMissed = progress({ sessions: [session(1, true), session(1, false), session(2, false)], currentWeek: 1 })
    expect(computePlanCoachAdvice(oneMissed, null)).toBeNull()
  })

  it('segnala "behind" quando si saltano almeno 2 sessioni e il carico è tranquillo', () => {
    const p = progress({ sessions: [session(1, false), session(1, false), session(2, false)], currentWeek: 2 })
    expect(computePlanCoachAdvice(p, null)).toEqual({ kind: 'behind', missedSessions: 3 })
  })

  it('segnala "load_conflict" quando in più il carico settimanale sta già saltando', () => {
    const p = progress({ sessions: [session(1, false), session(1, false)], currentWeek: 1 })
    expect(computePlanCoachAdvice(p, 62)).toEqual({ kind: 'load_conflict', missedSessions: 2 })
  })

  it('la soglia dichiarata è quella usata', () => {
    expect(PLAN_COACH_MISSED_THRESHOLD).toBe(2)
  })
})
