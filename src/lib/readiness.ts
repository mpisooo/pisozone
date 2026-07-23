import { subDays, startOfDay, parseISO } from 'date-fns'
import type { Activity, RecoveryLog } from '../types'
import { buildTrainingLoadSeries } from './trainingLoad'

// Punteggio di Prontezza (roadmap v4, pilastro 01, FLAGSHIP): sintetizza in
// un solo segnale 0-100 dati che l'app raccoglie già ogni giorno — sforzo
// percepito (RPE, v30), carico settimanale (session-RPE, roadmap v3 pilastro
// 02), sonno e riposo (recovery_logs, v33). Nessun sensore richiesto: è la
// controparte "gratis" del Training Readiness di Garmin, che nasce invece da
// un orologio dedicato. Funzione pura, testata, zero dipendenze nuove.
//
// Ogni fattore può mancare (utente che non ha mai usato Recupero, o RPE mai
// compilato): i fattori assenti vengono esclusi e il peso ridistribuito tra
// quelli disponibili, mai un valore inventato. Se NESSUN fattore è
// disponibile il risultato è null — "non ancora abbastanza dati", non zero.

export type ReadinessAdvice = 'push' | 'steady' | 'rest'

export interface ReadinessFactors {
  load: number | null
  sleep: number | null
  rpe: number | null
  rest: number | null
}

export interface ReadinessResult {
  score: number
  advice: ReadinessAdvice
  factors: ReadinessFactors
}

const FACTOR_WEIGHTS: Record<keyof ReadinessFactors, number> = {
  load: 0.30,
  sleep: 0.30,
  rpe: 0.25,
  rest: 0.15,
}

const SLEEP_WINDOW_DAYS = 3
const SLEEP_FLOOR_H = 4
const SLEEP_CEIL_H = 8
const RPE_WINDOW_SESSIONS = 3
const REST_LOOKBACK_DAYS = 2
const RECOVERY_ENGAGEMENT_DAYS = 14

export const READINESS_PUSH_THRESHOLD = 70
export const READINESS_STEADY_THRESHOLD = 40

// Settimana corrente (quasi sempre incompleta) contro la precedente: stesso
// principio di loadJumpPct in trainingLoad.ts, qui reso un punteggio
// continuo invece di un semplice avviso booleano. Senza baseline (prima
// settimana di allenamento) non si penalizza: manca il termine di paragone,
// non è un salto di carico.
function loadFactor(activities: Activity[], now: Date): number | null {
  const [previous, current] = buildTrainingLoadSeries(activities, 2, now)
  if (previous.load <= 0 && current.load <= 0) return null
  if (previous.load <= 0) return 100
  const ratio = current.load / previous.load
  if (ratio <= 1) return 100
  if (ratio >= 2) return 15
  return Math.round(100 - (ratio - 1) * 85)
}

function sleepFactor(logs: RecoveryLog[], now: Date): number | null {
  const since = subDays(startOfDay(now), SLEEP_WINDOW_DAYS - 1)
  const recent = logs.filter((l) => l.sleep_hours != null && parseISO(l.day) >= since)
  if (recent.length === 0) return null
  const avg = recent.reduce((sum, l) => sum + (l.sleep_hours ?? 0), 0) / recent.length
  const pct = ((avg - SLEEP_FLOOR_H) / (SLEEP_CEIL_H - SLEEP_FLOOR_H)) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

function rpeFactor(activities: Activity[], now: Date): number | null {
  const recent = activities
    .filter((a) => a.rpe != null && a.rpe > 0 && parseISO(a.date) <= now)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RPE_WINDOW_SESSIONS)
  if (recent.length === 0) return null
  const avg = recent.reduce((sum, a) => sum + (a.rpe ?? 0), 0) / recent.length
  return Math.round(Math.min(100, Math.max(0, 100 - (avg - 1) * (100 / 9))))
}

// Fattore escluso del tutto se l'utente non ha mai toccato la card Recupero
// di recente (nessun log nella finestra di "impegno"): l'assenza di dati non
// deve leggersi come "non ha riposato". Con dati recenti, un riposo negli
// ultimi 2 giorni alza il punteggio; altrimenti un lieve sconto, non una
// penalità dura.
function restFactor(logs: RecoveryLog[], now: Date): number | null {
  const engagementSince = subDays(startOfDay(now), RECOVERY_ENGAGEMENT_DAYS)
  const engaged = logs.some((l) => parseISO(l.day) >= engagementSince)
  if (!engaged) return null
  const lookbackSince = subDays(startOfDay(now), REST_LOOKBACK_DAYS)
  const restedRecently = logs.some((l) => l.rest && parseISO(l.day) >= lookbackSince)
  return restedRecently ? 100 : 55
}

// Spiegabilità del punteggio (P3-04, roadmap "PisoZone Next"): stesse soglie
// dell'advice generale (push/steady/rest), applicate per-fattore così la UI
// può mostrare "cosa ha contribuito" senza esporre pesi o formule — un
// pannello di debug non era l'obiettivo, un linguaggio umano sì.
export type FactorTier = 'good' | 'ok' | 'low' | 'missing'

export function factorTier(value: number | null): FactorTier {
  if (value == null) return 'missing'
  if (value >= READINESS_PUSH_THRESHOLD) return 'good'
  if (value >= READINESS_STEADY_THRESHOLD) return 'ok'
  return 'low'
}

export function computeReadiness(
  activities: Activity[],
  recoveryLogs: RecoveryLog[],
  now: Date = new Date(),
): ReadinessResult | null {
  const factors: ReadinessFactors = {
    load: loadFactor(activities, now),
    sleep: sleepFactor(recoveryLogs, now),
    rpe: rpeFactor(activities, now),
    rest: restFactor(recoveryLogs, now),
  }

  const available = (Object.keys(factors) as (keyof ReadinessFactors)[])
    .filter((key) => factors[key] != null)
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, key) => sum + FACTOR_WEIGHTS[key], 0)
  const score = Math.round(
    available.reduce((sum, key) => sum + (factors[key] as number) * FACTOR_WEIGHTS[key], 0) / totalWeight,
  )

  const advice: ReadinessAdvice =
    score >= READINESS_PUSH_THRESHOLD ? 'push' : score >= READINESS_STEADY_THRESHOLD ? 'steady' : 'rest'

  return { score, advice, factors }
}
