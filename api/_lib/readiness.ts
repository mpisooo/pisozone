import { format, parseISO, startOfWeek, subWeeks, subDays, startOfDay } from 'date-fns'

// GEMELLO SERVER di src/lib/readiness.ts (roadmap v4, pilastro 04) — vedi il
// commento in comeback.ts sul perché è una copia e non un import diretto.
// Ogni modifica alla formula lato client va rispecchiata qui: readiness.test.ts
// confronta le due implementazioni sugli stessi dati e fallisce se divergono.

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

// Righe minime richieste dal calcolo — non i tipi completi di Activity/
// RecoveryLog (che vivono in src/types, stesso problema di estensione
// dell'import: qui bastano i pochi campi usati).
export interface ReadinessActivityRow {
  date: string
  duration_min: number
  rpe: number | null
}

export interface ReadinessRecoveryRow {
  day: string
  sleep_hours: number | null
  rest: boolean
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

function weeklyLoadPair(activities: ReadinessActivityRow[], now: Date): { previousLoad: number; currentLoad: number } {
  const currentKey = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const previousKey = format(subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd')
  let currentLoad = 0
  let previousLoad = 0
  for (const a of activities) {
    if (a.rpe == null || a.rpe <= 0) continue
    const weekKey = format(startOfWeek(parseISO(a.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (weekKey === currentKey) currentLoad += a.rpe * a.duration_min
    else if (weekKey === previousKey) previousLoad += a.rpe * a.duration_min
  }
  return { previousLoad, currentLoad }
}

function loadFactor(activities: ReadinessActivityRow[], now: Date): number | null {
  const { previousLoad, currentLoad } = weeklyLoadPair(activities, now)
  if (previousLoad <= 0 && currentLoad <= 0) return null
  if (previousLoad <= 0) return 100
  const ratio = currentLoad / previousLoad
  if (ratio <= 1) return 100
  if (ratio >= 2) return 15
  return Math.round(100 - (ratio - 1) * 85)
}

function sleepFactor(logs: ReadinessRecoveryRow[], now: Date): number | null {
  const since = subDays(startOfDay(now), SLEEP_WINDOW_DAYS - 1)
  const recent = logs.filter((l) => l.sleep_hours != null && parseISO(l.day) >= since)
  if (recent.length === 0) return null
  const avg = recent.reduce((sum, l) => sum + (l.sleep_hours ?? 0), 0) / recent.length
  const pct = ((avg - SLEEP_FLOOR_H) / (SLEEP_CEIL_H - SLEEP_FLOOR_H)) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

function rpeFactor(activities: ReadinessActivityRow[], now: Date): number | null {
  const recent = activities
    .filter((a) => a.rpe != null && a.rpe > 0 && parseISO(a.date) <= now)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RPE_WINDOW_SESSIONS)
  if (recent.length === 0) return null
  const avg = recent.reduce((sum, a) => sum + (a.rpe ?? 0), 0) / recent.length
  return Math.round(Math.min(100, Math.max(0, 100 - (avg - 1) * (100 / 9))))
}

function restFactor(logs: ReadinessRecoveryRow[], now: Date): number | null {
  const engagementSince = subDays(startOfDay(now), RECOVERY_ENGAGEMENT_DAYS)
  const engaged = logs.some((l) => parseISO(l.day) >= engagementSince)
  if (!engaged) return null
  const lookbackSince = subDays(startOfDay(now), REST_LOOKBACK_DAYS)
  const restedRecently = logs.some((l) => l.rest && parseISO(l.day) >= lookbackSince)
  return restedRecently ? 100 : 55
}

export function computeReadiness(
  activities: ReadinessActivityRow[],
  recoveryLogs: ReadinessRecoveryRow[],
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
