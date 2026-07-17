import { addDays, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import type { WeightLog } from '../types'

// Tendenza del peso e proiezione verso l'obiettivo (roadmap v3, pilastro 02):
// regressione lineare ai minimi quadrati sulle pesate recenti → pendenza in
// kg/settimana e, se c'è un obiettivo (profiles.weight_goal_kg, v43), la data
// in cui a questo ritmo lo si raggiunge. La proiezione è onesta: trend piatto,
// contrario o traguardo oltre un anno → lo si dice, non si inventa una data.

// Le pesate più vecchie di così non descrivono il ritmo di OGGI.
export const TREND_WINDOW_DAYS = 60
export const TREND_MIN_POINTS = 3
export const TREND_MIN_SPAN_DAYS = 7
// Sotto questa pendenza il peso è di fatto stabile: proiettare una data su un
// rumore di bilancia produrrebbe stime assurde ("obiettivo tra 4 anni").
export const FLAT_SLOPE_KG_PER_WEEK = 0.05
export const MAX_PROJECTION_DAYS = 365

export interface WeightTrend {
  slopeKgPerWeek: number
  // Peso "di oggi" secondo la retta di regressione: meno rumoroso
  // dell'ultima pesata grezza, è la base della proiezione.
  currentKg: number
  points: number
}

export function computeWeightTrend(logs: WeightLog[], now: Date = new Date()): WeightTrend | null {
  const today = startOfDay(now)
  const recent = logs
    .map((l) => ({ x: differenceInCalendarDays(startOfDay(parseISO(l.logged_at)), today), y: l.weight_kg }))
    .filter((p) => p.x > -TREND_WINDOW_DAYS && p.x <= 0)
  if (recent.length < TREND_MIN_POINTS) return null

  const xs = recent.map((p) => p.x)
  if (Math.max(...xs) - Math.min(...xs) < TREND_MIN_SPAN_DAYS) return null

  const n = recent.length
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = recent.reduce((s, p) => s + p.y, 0) / n
  let num = 0
  let den = 0
  for (const p of recent) {
    num += (p.x - meanX) * (p.y - meanY)
    den += (p.x - meanX) * (p.x - meanX)
  }
  if (den === 0) return null
  const slopePerDay = num / den
  // x = 0 è oggi: l'intercetta della retta È il peso stimato di oggi.
  const currentKg = meanY - slopePerDay * meanX

  return {
    slopeKgPerWeek: Math.round(slopePerDay * 7 * 100) / 100,
    currentKg: Math.round(currentKg * 10) / 10,
    points: n,
  }
}

export type GoalOutlook =
  | { kind: 'reached' }
  | { kind: 'onTrack'; days: number; etaDate: Date }
  | { kind: 'flat' } // peso stabile: nessuna direzione da proiettare
  | { kind: 'away' } // il trend va nella direzione opposta all'obiettivo
  | { kind: 'tooFar' } // a questo ritmo servirebbe più di un anno

export function goalOutlook(trend: WeightTrend, goalKg: number, now: Date = new Date()): GoalOutlook {
  const deltaKg = goalKg - trend.currentKg
  if (Math.abs(deltaKg) < 0.25) return { kind: 'reached' }
  if (Math.abs(trend.slopeKgPerWeek) < FLAT_SLOPE_KG_PER_WEEK) return { kind: 'flat' }
  if (Math.sign(trend.slopeKgPerWeek) !== Math.sign(deltaKg)) return { kind: 'away' }
  // L'epsilon evita che il rumore in virgola mobile spinga un risultato
  // intero (es. 26,000000000004) al giorno successivo.
  const days = Math.ceil(deltaKg / (trend.slopeKgPerWeek / 7) - 1e-9)
  if (days > MAX_PROJECTION_DAYS) return { kind: 'tooFar' }
  return { kind: 'onTrack', days, etaDate: addDays(startOfDay(now), days) }
}
