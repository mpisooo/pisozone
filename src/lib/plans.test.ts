import { describe, it, expect } from 'vitest'
import {
  PLAN_CATALOG,
  getPlanTemplate,
  weekOfPlan,
  computePlanProgress,
  suggestPlan,
  type PlanTemplate,
} from './plans'
import { ACTIVITY_OPTIONS } from './constants'
import type { Activity } from '../types'

function mkAct(partial: Partial<Activity>): Activity {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    type: 'corsa',
    date: '2026-07-06T18:00:00',
    duration_min: 30,
    calories: null,
    distance_km: null,
    notes: null,
    created_at: '2026-07-06T18:00:00',
    credits_earned: 0,
    ...partial,
  }
}

// Template sintetico per i test di matching: 2 settimane, 2+1 sessioni.
const plan: PlanTemplate = {
  key: 'test',
  title: 'Test',
  tagline: '',
  icon: '🧪',
  weeks: 2,
  level: 'principiante',
  credits: 100,
  sessions: [
    { week: 1, label: 'Corsa breve', types: ['corsa'], minMinutes: 20 },
    { week: 1, label: 'Camminata', types: ['camminata'], minMinutes: 30 },
    { week: 2, label: 'Lungo', types: ['corsa'], minMinutes: 40, minKm: 5 },
  ],
}

const START = '2026-07-06' // lunedì; settimana 1 = 06-12, settimana 2 = 13-19

describe('integrità di PLAN_CATALOG', () => {
  const validTypes = new Set(ACTIVITY_OPTIONS.map((o) => o.value))

  it('chiavi uniche e ricompense entro il check DB (0..300)', () => {
    const keys = PLAN_CATALOG.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const p of PLAN_CATALOG) {
      expect(p.credits).toBeGreaterThan(0)
      expect(p.credits).toBeLessThanOrEqual(300)
    }
  })

  it('ogni sessione ha settimana valida, tipi reali e durata positiva', () => {
    for (const p of PLAN_CATALOG) {
      expect(p.sessions.length).toBeGreaterThan(0)
      for (const s of p.sessions) {
        expect(s.week).toBeGreaterThanOrEqual(1)
        expect(s.week).toBeLessThanOrEqual(p.weeks)
        expect(s.types.length).toBeGreaterThan(0)
        for (const t of s.types) expect(validTypes.has(t)).toBe(true)
        expect(s.minMinutes).toBeGreaterThan(0)
      }
    }
  })

  it('ogni settimana del programma ha almeno una sessione', () => {
    for (const p of PLAN_CATALOG) {
      const weeks = new Set(p.sessions.map((s) => s.week))
      for (let w = 1; w <= p.weeks; w++) expect(weeks.has(w)).toBe(true)
    }
  })

  it('getPlanTemplate trova per chiave', () => {
    expect(getPlanTemplate('corsa_5k')?.weeks).toBe(6)
    expect(getPlanTemplate('inesistente')).toBeUndefined()
  })
})

describe('weekOfPlan', () => {
  it('blocchi di 7 giorni a partire da started_on', () => {
    expect(weekOfPlan(START, new Date('2026-07-06T00:30:00'))).toBe(1)
    expect(weekOfPlan(START, new Date('2026-07-12T23:00:00'))).toBe(1)
    expect(weekOfPlan(START, new Date('2026-07-13T08:00:00'))).toBe(2)
    expect(weekOfPlan(START, new Date('2026-07-20T08:00:00'))).toBe(3)
    expect(weekOfPlan(START, new Date('2026-07-05T08:00:00'))).toBe(0)
  })
})

describe('computePlanProgress', () => {
  const now = new Date('2026-07-08T12:00:00')

  it('un\'attività adatta spunta la sessione della sua settimana', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'corsa', duration_min: 25, date: '2026-07-07T18:00:00' }),
    ], now)
    expect(p.doneCount).toBe(1)
    expect(p.sessions[0].done).toBe(true)
    expect(p.completed).toBe(false)
  })

  it('requisiti: tipo, durata minima e distanza minima', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'bici', duration_min: 60, date: '2026-07-07T18:00:00' }),
      mkAct({ type: 'corsa', duration_min: 10, date: '2026-07-08T18:00:00' }),
      mkAct({ type: 'corsa', duration_min: 50, distance_km: 3, date: '2026-07-14T18:00:00' }),
    ], new Date('2026-07-15T12:00:00'))
    // la bici non è tra i tipi, la corsa da 10' è troppo corta; la corsa da
    // 50'/3km salda la sessione breve arretrata (niente 5 km ⇒ non il lungo)
    expect(p.doneCount).toBe(1)
    expect(p.sessions[0].done).toBe(true)
    expect(p.sessions[2].done).toBe(false)
  })

  it('niente front-load: la sessione della settimana 2 non si salda in settimana 1', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'corsa', duration_min: 60, distance_km: 8, date: '2026-07-07T18:00:00' }),
    ], now)
    // qualificherebbe per il "Lungo" (settimana 2) ma è settimana 1: salda la corsa breve
    expect(p.sessions[0].done).toBe(true)
    expect(p.sessions[2].done).toBe(false)
  })

  it('recupero ammesso: un\'attività della settimana 2 salda l\'arretrato della 1', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'camminata', duration_min: 40, date: '2026-07-14T18:00:00' }),
    ], new Date('2026-07-15T12:00:00'))
    expect(p.sessions[1].done).toBe(true)
  })

  it('ogni attività salda al massimo una sessione', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'corsa', duration_min: 60, distance_km: 8, date: '2026-07-14T18:00:00' }),
    ], new Date('2026-07-15T12:00:00'))
    expect(p.doneCount).toBe(1)
  })

  it('le attività fuori finestra (prima o dopo) non contano', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'corsa', duration_min: 30, date: '2026-07-05T18:00:00' }),
      mkAct({ type: 'corsa', duration_min: 30, date: '2026-07-21T18:00:00' }),
    ], new Date('2026-07-22T12:00:00'))
    expect(p.doneCount).toBe(0)
  })

  it('completamento con tutte le sessioni saldate', () => {
    const p = computePlanProgress(plan, START, [
      mkAct({ type: 'corsa', duration_min: 25, date: '2026-07-07T18:00:00' }),
      mkAct({ type: 'camminata', duration_min: 35, date: '2026-07-09T18:00:00' }),
      mkAct({ type: 'corsa', duration_min: 45, distance_km: 6, date: '2026-07-14T18:00:00' }),
    ], new Date('2026-07-15T12:00:00'))
    expect(p.completed).toBe(true)
    expect(p.expired).toBe(false)
    expect(p.doneCount).toBe(3)
  })

  it('scaduto: finestra terminata senza completare', () => {
    const p = computePlanProgress(plan, START, [], new Date('2026-07-25T12:00:00'))
    expect(p.expired).toBe(true)
    expect(p.completed).toBe(false)
  })

  it('currentWeek è agganciata a oggi e non sfora i limiti', () => {
    expect(computePlanProgress(plan, START, [], new Date('2026-07-08T12:00:00')).currentWeek).toBe(1)
    expect(computePlanProgress(plan, START, [], new Date('2026-07-14T12:00:00')).currentWeek).toBe(2)
    expect(computePlanProgress(plan, START, [], new Date('2026-08-01T12:00:00')).currentWeek).toBe(2)
  })

  it('endsOn è l\'ultimo giorno dell\'ultima settimana', () => {
    expect(computePlanProgress(plan, START, [], now).endsOn).toBe('2026-07-19')
  })
})

describe('suggestPlan', () => {
  it('nessun suggerimento sotto la soglia minima di attività', () => {
    const acts = [mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' })]
    expect(suggestPlan(acts, new Set())).toBeNull()
  })

  it('suggerisce 5K dopo 3 corse, non ancora completato', () => {
    const acts = [mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' })]
    expect(suggestPlan(acts, new Set())?.key).toBe('corsa_5k')
  })

  it('passa a 10K se 5K è già completato', () => {
    const acts = [mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' })]
    expect(suggestPlan(acts, new Set(['corsa_5k']))?.key).toBe('corsa_10k')
  })

  it('nessun suggerimento se anche il 10K è già completato', () => {
    const acts = [mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' }), mkAct({ type: 'corsa' })]
    expect(suggestPlan(acts, new Set(['corsa_5k', 'corsa_10k']))).toBeNull()
  })

  it('suggerisce palestra dopo 3 sessioni in palestra', () => {
    const acts = [mkAct({ type: 'palestra' }), mkAct({ type: 'palestra' }), mkAct({ type: 'palestra' })]
    expect(suggestPlan(acts, new Set())?.key).toBe('palestra_solido')
  })

  it('camminata non attiva il suggerimento di corsa (sport trainante più stretto dei types di sessione)', () => {
    const acts = [mkAct({ type: 'camminata' }), mkAct({ type: 'camminata' }), mkAct({ type: 'camminata' })]
    expect(suggestPlan(acts, new Set())).toBeNull()
  })
})
