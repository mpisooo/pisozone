import { describe, it, expect } from 'vitest'
import { computePlanCoachAdvice, PLAN_COACH_MISSED_THRESHOLD } from './planCoach'
import { getPlanTemplate, computePlanProgress } from './plans'
import type { PlanProgress, PlanSessionProgress } from './plans'
import type { Activity } from '../types'

function session(week: number, done: boolean): PlanSessionProgress {
  return { template: { week, label: 's', types: ['corsa'], minMinutes: 20 }, done, activityId: done ? 'a1' : null }
}

function progress(overrides: {
  sessions: PlanSessionProgress[]
  currentWeek?: number
  // Default 7 = "settimana già trascorsa per intero": preserva il
  // comportamento dei casi esistenti che non testano la granularità del
  // singolo giorno (vedi invece i test dedicati più sotto).
  dayOfCurrentWeek?: number
  completed?: boolean
  expired?: boolean
}): PlanProgress {
  const doneCount = overrides.sessions.filter((s) => s.done).length
  return {
    sessions: overrides.sessions,
    doneCount,
    totalCount: overrides.sessions.length,
    currentWeek: overrides.currentWeek ?? 1,
    dayOfCurrentWeek: overrides.dayOfCurrentWeek ?? 7,
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

  it('non segnala "indietro" il giorno 1 di ogni settimana (bug P0-6 dell\'audit)', () => {
    // Riproduzione esatta: programma iniziato oggi (settimana 1, giorno 1),
    // 1 sessione già fatta su 3 — prima del fix: "indietro di 2 sessioni".
    const dayOne = progress({
      sessions: [session(1, true), session(1, false), session(1, false)],
      currentWeek: 1,
      dayOfCurrentWeek: 1,
    })
    expect(computePlanCoachAdvice(dayOne, null)).toBeNull()

    // Stesso giorno 1, ma di una settimana successiva con tutte le
    // precedenti completate: nessun falso "indietro" al cambio settimana.
    const newWeekOnTrack = progress({
      sessions: [
        session(1, true), session(1, true), session(1, true),
        session(2, false), session(2, false), session(2, false),
      ],
      currentWeek: 2,
      dayOfCurrentWeek: 1,
    })
    expect(computePlanCoachAdvice(newWeekOnTrack, null)).toBeNull()
  })

  it('a metà settimana segnala comunque "indietro" se lo si è davvero', () => {
    const p = progress({
      sessions: [
        session(1, true), session(1, true), session(1, true),
        session(2, false), session(2, false), session(2, false),
      ],
      currentWeek: 2,
      dayOfCurrentWeek: 5, // 5 giorni su 7 già passati nella settimana 2
    })
    expect(computePlanCoachAdvice(p, null)).toEqual({ kind: 'behind', missedSessions: 2 })
  })

  it('end-to-end su un template reale del catalogo: nessun falso "indietro" al lancio del piano', () => {
    // Stesso identico scenario segnalato nell'audit ("Programma iniziato
    // oggi, 1 sessione completata → 'Sei indietro di 2 sessioni'"), ma
    // attraverso il vero motore di matching (computePlanProgress), non una
    // PlanProgress costruita a mano.
    const template = getPlanTemplate('palestra_solido')!
    const startedOn = '2026-07-06'
    const now = new Date('2026-07-06T18:00:00')
    const activity: Activity = {
      id: 'a1', user_id: 'u1', type: 'palestra', date: '2026-07-06T09:00:00',
      duration_min: 35, calories: null, distance_km: null, notes: null,
      created_at: '2026-07-06T09:00:00', credits_earned: 0,
    }
    const progressReal = computePlanProgress(template, startedOn, [activity], now)
    expect(progressReal.doneCount).toBe(1)
    expect(computePlanCoachAdvice(progressReal, null)).toBeNull()
  })
})
