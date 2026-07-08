import { describe, it, expect } from 'vitest'
import {
  buildTrendSeries, buildWeekdayDistribution, buildWeeklyGoalSeries,
  buildWeightTrainingSeries, activitiesToCsv,
} from './stats'
import type { Activity, ActivityType, WeightLog } from '../types'

// Oggi fittizio e stabile: martedì 7 luglio 2026, ore 12:00
// (la settimana corrente inizia lunedì 6 luglio)
const NOW = new Date('2026-07-07T12:00:00')

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
    credits_earned: 10,
    ...overrides,
  }
}

function mkWeight(logged_at: string, weight_kg: number): WeightLog {
  return { id: crypto.randomUUID(), user_id: 'user-1', logged_at, weight_kg }
}

describe('buildTrendSeries', () => {
  it('settimana: un bucket al giorno da lunedì a oggi, vuoti inclusi', () => {
    const acts = [
      mkAct({ date: '2026-07-06T08:00:00', duration_min: 40 }),
      mkAct({ date: '2026-07-07T09:00:00', duration_min: 30 }),
      mkAct({ date: '2026-07-07T18:00:00', duration_min: 20 }),
    ]
    const series = buildTrendSeries(acts, 'week', NOW)
    expect(series.map((p) => p.key)).toEqual(['2026-07-06', '2026-07-07'])
    expect(series[0].sessions).toBe(1)
    expect(series[0].minutes).toBe(40)
    expect(series[1].sessions).toBe(2)
    expect(series[1].minutes).toBe(50)
  })

  it('mese: bucket giornalieri dal 1° a oggi, con i giorni senza attività a zero', () => {
    const series = buildTrendSeries([mkAct({ date: '2026-07-03T10:00:00' })], 'month', NOW)
    expect(series).toHaveLength(7)
    expect(series[2]).toMatchObject({ key: '2026-07-03', sessions: 1 })
    expect(series[6]).toMatchObject({ key: '2026-07-07', sessions: 0 })
  })

  it('anno: bucket mensili da gennaio al mese corrente', () => {
    const series = buildTrendSeries([mkAct({ date: '2026-03-15T10:00:00', calories: 500 })], 'year', NOW)
    expect(series).toHaveLength(7)
    const march = series.find((p) => p.key === '2026-03')
    expect(march?.sessions).toBe(1)
    expect(march?.calories).toBe(500)
  })

  it('sempre: parte dal mese della prima attività', () => {
    const acts = [
      mkAct({ date: '2025-11-15T10:00:00' }),
      mkAct({ date: '2026-07-01T10:00:00' }),
    ]
    const series = buildTrendSeries(acts, 'all', NOW)
    expect(series[0].key).toBe('2025-11')
    expect(series).toHaveLength(9) // nov 2025 → lug 2026
  })

  it('sempre: senza attività restituisce una serie vuota', () => {
    expect(buildTrendSeries([], 'all', NOW)).toEqual([])
  })

  it('somma i km arrotondando a un decimale', () => {
    const acts = [
      mkAct({ date: '2026-07-07T08:00:00', distance_km: 2.15 }),
      mkAct({ date: '2026-07-07T09:00:00', distance_km: 3.05 }),
    ]
    const series = buildTrendSeries(acts, 'week', NOW)
    expect(series[1].km).toBe(5.2)
  })

  it('ignora le attività fuori dall\'intervallo senza errori', () => {
    const series = buildTrendSeries([mkAct({ date: '2026-06-20T10:00:00' })], 'week', NOW)
    expect(series.every((p) => p.sessions === 0)).toBe(true)
  })
})

describe('buildWeekdayDistribution', () => {
  it('restituisce sempre 7 giorni in ordine lun→dom', () => {
    const dist = buildWeekdayDistribution([])
    expect(dist.map((d) => d.label)).toEqual(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'])
  })

  it('mappa lunedì sull\'indice 0 e domenica sull\'indice 6', () => {
    const acts = [
      mkAct({ date: '2026-07-06T10:00:00' }), // lunedì
      mkAct({ date: '2026-07-05T10:00:00' }), // domenica
      mkAct({ date: '2026-06-29T10:00:00' }), // lunedì (settimana prima)
    ]
    const dist = buildWeekdayDistribution(acts)
    expect(dist[0].sessions).toBe(2)
    expect(dist[6].sessions).toBe(1)
  })
})

describe('buildWeeklyGoalSeries', () => {
  it('restituisce 8 settimane e l\'ultima è quella corrente', () => {
    const series = buildWeeklyGoalSeries([], 3, 8, NOW)
    expect(series).toHaveLength(8)
    expect(series[7].key).toBe('2026-07-06')
    expect(series.every((w) => w.sessions === 0 && !w.met)).toBe(true)
  })

  it('conta le sessioni per settimana e marca l\'obiettivo raggiunto', () => {
    const acts = [
      // settimana corrente: 2 sessioni (obiettivo 2 → raggiunto)
      mkAct({ date: '2026-07-06T08:00:00' }),
      mkAct({ date: '2026-07-07T08:00:00' }),
      // settimana precedente: 1 sessione (non raggiunto)
      mkAct({ date: '2026-07-01T08:00:00' }),
    ]
    const series = buildWeeklyGoalSeries(acts, 2, 8, NOW)
    expect(series[7]).toMatchObject({ sessions: 2, met: true })
    expect(series[6]).toMatchObject({ sessions: 1, met: false })
  })

  it('ignora le attività più vecchie della finestra', () => {
    const series = buildWeeklyGoalSeries([mkAct({ date: '2026-01-01T08:00:00' })], 1, 8, NOW)
    expect(series.every((w) => w.sessions === 0)).toBe(true)
  })
})

describe('buildWeightTrainingSeries', () => {
  it('restituisce 12 settimane con peso null dove non ci sono pesate', () => {
    const series = buildWeightTrainingSeries([], [], 12, NOW)
    expect(series).toHaveLength(12)
    expect(series.every((w) => w.weightKg === null && w.minutes === 0)).toBe(true)
  })

  it('fa la media delle pesate della stessa settimana, arrotondata a 0.1', () => {
    const logs = [
      mkWeight('2026-07-06', 80),
      mkWeight('2026-07-07', 80.5),
    ]
    const series = buildWeightTrainingSeries([], logs, 12, NOW)
    expect(series[11].weightKg).toBe(80.3)
  })

  it('somma i minuti di allenamento della settimana giusta', () => {
    const acts = [
      mkAct({ date: '2026-07-06T08:00:00', duration_min: 45 }),
      mkAct({ date: '2026-07-07T08:00:00', duration_min: 30 }),
      mkAct({ date: '2026-06-30T08:00:00', duration_min: 60 }), // settimana precedente
    ]
    const series = buildWeightTrainingSeries(acts, [], 12, NOW)
    expect(series[11].minutes).toBe(75)
    expect(series[10].minutes).toBe(60)
  })

  it('ignora pesate e attività fuori dalla finestra', () => {
    const series = buildWeightTrainingSeries(
      [mkAct({ date: '2025-01-01T08:00:00' })],
      [mkWeight('2025-01-01', 90)],
      12,
      NOW,
    )
    expect(series.every((w) => w.weightKg === null && w.minutes === 0)).toBe(true)
  })
})

describe('activitiesToCsv', () => {
  it('produce intestazione italiana e righe ordinate per data crescente', () => {
    const acts = [
      mkAct({ date: '2026-07-07T10:00:00', duration_min: 30 }),
      mkAct({ date: '2026-07-05T09:30:00', duration_min: 60, type: 'palestra' as ActivityType }),
    ]
    const [header, first, second] = activitiesToCsv(acts).split('\r\n')
    expect(header).toBe('Data;Ora;Attività;Durata (min);Calorie;Distanza (km);Crediti;Note')
    expect(first.startsWith('05/07/2026;09:30;Palestra;60')).toBe(true)
    expect(second.startsWith('07/07/2026;10:00;Corsa;30')).toBe(true)
  })

  it('usa la virgola come separatore decimale per i km e lascia vuoti i campi nulli', () => {
    const csv = activitiesToCsv([mkAct({ distance_km: 5.2, calories: null })])
    const row = csv.split('\r\n')[1]
    expect(row).toBe('07/07/2026;10:00;Corsa;30;;5,2;10;')
  })

  it('protegge le note con punti e virgola e virgolette', () => {
    const csv = activitiesToCsv([mkAct({ notes: 'giro al parco; detto "facile"' })])
    const row = csv.split('\r\n')[1]
    expect(row.endsWith(';"giro al parco; detto ""facile"""')).toBe(true)
  })

  it('lascia le note semplici senza virgolette', () => {
    const csv = activitiesToCsv([mkAct({ notes: 'buona sessione' })])
    expect(csv.endsWith(';buona sessione')).toBe(true)
  })
})
