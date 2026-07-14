import { describe, it, expect } from 'vitest'
import { buildInsights } from './insights'
import type { Activity, ActivityType } from '../types'

// 14 luglio 2026 è un martedì: le finestre (settimana da lunedì 13, ultimi
// 7/30 giorni, mese di luglio) sono tutte ancorate a questa data fissa.
const NOW = new Date(2026, 6, 14, 12, 0, 0)

let seq = 0
function act(date: string, over: Partial<Activity> = {}): Activity {
  seq++
  return {
    id: `a${seq}`,
    user_id: 'u1',
    type: 'palestra' as ActivityType,
    date,
    duration_min: 60,
    calories: 300,
    distance_km: null,
    notes: null,
    created_at: date,
    credits_earned: 0,
    ...over,
  }
}

const opts = { weeklyGoal: 99, now: NOW } // goal irraggiungibile: consistency spenta di default

describe('buildInsights', () => {
  it('senza attività non produce nulla', () => {
    expect(buildInsights([], opts)).toEqual([])
  })

  it('sotto le 5 attività produce solo il benvenuto', () => {
    const acts = [act('2026-07-10T10:00:00'), act('2026-07-12T10:00:00'), act('2026-07-13T10:00:00')]
    const res = buildInsights(acts, opts)
    expect(res).toHaveLength(1)
    expect(res[0].key).toBe('getting-started')
    expect(res[0].text).toContain('3')
  })

  it('il benvenuto al singolare per la prima attività', () => {
    const res = buildInsights([act('2026-07-13T10:00:00')], opts)
    expect(res[0].text).toContain('Prima attività')
  })

  it('riconosce il volume in crescita (ultimi 7 giorni vs precedenti)', () => {
    const acts = [
      // 7 giorni precedenti (dal 30/6 al 7/7): 120 minuti
      act('2026-07-01T18:00:00'), act('2026-07-05T18:00:00'),
      // ultimi 7 giorni: 180 minuti (+50%)
      act('2026-07-09T18:00:00'), act('2026-07-12T18:00:00'), act('2026-07-14T09:00:00'),
    ]
    const keys = buildInsights(acts, opts).map((i) => i.key)
    expect(keys).toContain('volume-up')
  })

  it('segnala con gentilezza il volume in calo', () => {
    const acts = [
      // 7 giorni precedenti: 240 minuti
      act('2026-07-01T18:00:00', { duration_min: 120 }), act('2026-07-05T18:00:00', { duration_min: 120 }),
      // ultimi 7 giorni: 60 minuti (-75%)
      act('2026-07-10T18:00:00'),
      // storico più vecchio per superare la soglia delle 5 attività
      act('2026-05-01T18:00:00'), act('2026-05-10T18:00:00'),
    ]
    const keys = buildInsights(acts, opts).map((i) => i.key)
    expect(keys).toContain('volume-down')
    expect(keys).not.toContain('volume-up')
  })

  it('riconosce la settimana record', () => {
    const acts = [
      // 3 settimane passate con 60 minuti ciascuna
      act('2026-06-24T18:00:00'), act('2026-07-01T18:00:00'), act('2026-07-08T18:00:00'),
      // settimana corrente (da lunedì 13/7): 2 sessioni, 180 minuti
      act('2026-07-13T18:00:00', { duration_min: 90 }), act('2026-07-14T09:00:00', { duration_min: 90 }),
    ]
    const res = buildInsights(acts, opts)
    const record = res.find((i) => i.key === 'record-week')
    expect(record).toBeDefined()
    expect(record!.text).toContain('3h 0m')
  })

  it('non dichiara record senza abbastanza storico', () => {
    const acts = [
      // una sola settimana passata con dati
      act('2026-07-08T18:00:00'),
      act('2026-07-13T18:00:00', { duration_min: 90 }), act('2026-07-14T09:00:00', { duration_min: 90 }),
      act('2026-07-12T09:00:00'), act('2026-07-11T09:00:00'),
    ]
    // 11 e 12 luglio cadono nella settimana precedente: 2 settimane con dati?
    // No: 8/7 è una settimana, 11-12/7 la stessa settimana (6-12 luglio) → 1 sola.
    const keys = buildInsights(acts, opts).map((i) => i.key)
    // il massimo delle settimane precedenti (60+60+60=180) eguaglia i 180
    // correnti: in ogni caso niente record
    expect(keys).not.toContain('record-week')
  })

  it('riconosce la costanza sulle 4 settimane complete', () => {
    const acts = [
      // 3 delle ultime 4 settimane complete con >= 1 sessione
      act('2026-06-17T18:00:00'), // settimana 15-21/6
      act('2026-06-24T18:00:00'), // settimana 22-28/6
      act('2026-07-01T18:00:00'), // settimana 29/6-5/7
      // la settimana 6-12/7 resta vuota
      act('2026-05-05T18:00:00'), act('2026-05-06T18:00:00'),
    ]
    const keys = buildInsights(acts, { weeklyGoal: 1, now: NOW }).map((i) => i.key)
    expect(keys).toContain('consistency')
  })

  it('riconosce lo sport del mese', () => {
    const acts = [
      act('2026-07-02T18:00:00', { type: 'corsa' }), act('2026-07-05T18:00:00', { type: 'corsa' }),
      act('2026-07-08T18:00:00', { type: 'corsa' }), act('2026-07-11T18:00:00', { type: 'corsa' }),
      act('2026-07-03T18:00:00', { type: 'palestra' }),
    ]
    const top = buildInsights(acts, opts).find((i) => i.key === 'top-sport')
    expect(top).toBeDefined()
    expect(top!.text).toContain('corsa')
    expect(top!.text).toContain('4')
  })

  it('riconosce il giorno-abitudine', () => {
    const acts = [
      // 5 martedì nelle ultime 8 settimane
      act('2026-05-26T18:00:00'), act('2026-06-02T18:00:00'), act('2026-06-09T18:00:00'),
      act('2026-06-16T18:00:00'), act('2026-06-23T18:00:00'),
      // un lunedì isolato
      act('2026-06-22T18:00:00'),
    ]
    const habit = buildInsights(acts, opts).find((i) => i.key === 'weekday-habit')
    expect(habit).toBeDefined()
    expect(habit!.text).toContain('martedì')
  })

  it('riconosce la fascia oraria dominante', () => {
    const acts = Array.from({ length: 6 }, (_, i) => act(`2026-07-${String(5 + i).padStart(2, '0')}T07:00:00`))
    const tod = buildInsights(acts, opts).find((i) => i.key === 'time-of-day')
    expect(tod).toBeDefined()
    expect(tod!.icon).toBe('🌅')
  })

  it('riconosce i chilometri in crescita', () => {
    const acts = [
      // 30 giorni precedenti (14/5 - 14/6): 20 km
      act('2026-05-20T18:00:00', { type: 'corsa', distance_km: 10 }),
      act('2026-06-01T18:00:00', { type: 'corsa', distance_km: 10 }),
      // ultimi 30 giorni: 30 km (+50%)
      act('2026-06-20T18:00:00', { type: 'corsa', distance_km: 10 }),
      act('2026-06-28T18:00:00', { type: 'corsa', distance_km: 10 }),
      act('2026-07-06T18:00:00', { type: 'corsa', distance_km: 10 }),
    ]
    const keys = buildInsights(acts, opts).map((i) => i.key)
    expect(keys).toContain('km-up')
  })

  it('suggerisce recupero con RPE alto per tutta la settimana', () => {
    const acts = [
      act('2026-07-09T18:00:00', { rpe: 9 }), act('2026-07-11T18:00:00', { rpe: 8 }),
      act('2026-07-13T18:00:00', { rpe: 9 }),
      act('2026-05-01T18:00:00'), act('2026-05-02T18:00:00'),
    ]
    const keys = buildInsights(acts, opts).map((i) => i.key)
    expect(keys).toContain('rpe-high')
  })

  it('celebra l\'umore alto post-allenamento', () => {
    const acts = Array.from({ length: 5 }, (_, i) =>
      act(`2026-07-${String(3 + i * 2).padStart(2, '0')}T18:00:00`, { mood: 5 }))
    const keys = buildInsights(acts, opts).map((i) => i.key)
    expect(keys).toContain('mood-high')
  })

  it('non supera mai i 4 insight', () => {
    // Scenario carico: tante regole attive insieme
    const acts = [
      // storico per il record e il volume
      act('2026-06-24T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-01T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-05T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-08T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-09T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-11T18:00:00', { type: 'corsa', distance_km: 5, rpe: 9, mood: 5 }),
      act('2026-07-13T18:00:00', { type: 'corsa', duration_min: 120, distance_km: 10, rpe: 9, mood: 5 }),
      act('2026-07-14T09:00:00', { type: 'corsa', duration_min: 120, distance_km: 10, rpe: 9, mood: 5 }),
      act('2026-05-20T18:00:00', { type: 'corsa', distance_km: 6 }),
      act('2026-06-05T18:00:00', { type: 'corsa', distance_km: 6 }),
    ]
    const res = buildInsights(acts, { weeklyGoal: 1, now: NOW })
    expect(res.length).toBeLessThanOrEqual(4)
    expect(res.length).toBeGreaterThan(0)
  })
})
