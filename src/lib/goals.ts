import { format, parseISO, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns'
import type { Activity, ActivityType, PersonalGoal } from '../types'

// Obiettivi personali flessibili (roadmap v2, pilastro 04): qui vive SOLO la
// logica pura — metriche, avanzamento derivato dalle attività, preset di
// periodo, clamp del traguardo — testata con Vitest. La persistenza sta in
// hooks/usePersonalGoals.ts, la UI in components/GoalsCard.tsx +
// GoalCreateModal.tsx. Come per i programmi (v34), l'avanzamento non è mai
// salvato: modificare o eliminare un'attività riallinea la barra da solo.

export type GoalMetric = 'sessions' | 'minutes' | 'km' | 'kcal'

export const GOAL_METRICS: GoalMetric[] = ['sessions', 'minutes', 'km', 'kcal']

// Contributo di una singola attività alla metrica
export function metricValue(metric: GoalMetric, a: Activity): number {
  switch (metric) {
    case 'sessions': return 1
    case 'minutes': return a.duration_min
    case 'km': return a.distance_km ?? 0
    case 'kcal': return a.calories ?? 0
  }
}

// Tetti del traguardo per metrica: sotto il limite della colonna numeric(8,1),
// pensati per fermare i refusi (una cifra in più), non per limitare l'ambizione.
export const TARGET_MAX: Record<GoalMetric, number> = {
  sessions: 500,
  minutes: 10000,
  km: 10000,
  kcal: 500000,
}

// I km hanno senso solo su attività con distanza: il picker sport filtra su
// hasDist per non creare obiettivi che non potranno mai avanzare.
export const METRIC_NEEDS_DISTANCE: Record<GoalMetric, boolean> = {
  sessions: false,
  minutes: false,
  km: true,
  kcal: false,
}

// Massimo di obiettivi non conclusi per utente (applicato dal client):
// oltre, la lista smette di essere una motivazione e diventa rumore.
export const MAX_ACTIVE_GOALS = 5

export function clampTarget(metric: GoalMetric, raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const clamped = Math.min(n, TARGET_MAX[metric])
  // sessioni intere; le altre metriche a 1 decimale (colonna numeric(8,1))
  return metric === 'sessions' ? Math.round(clamped) : Math.round(clamped * 10) / 10
}

// Preset di periodo per la creazione: settimana corrente (lunedì-domenica,
// coerente con l'obiettivo settimanale) o mese corrente.
export function presetRange(preset: 'week' | 'month', now: Date = new Date()): { starts_on: string; ends_on: string } {
  if (preset === 'week') {
    return {
      starts_on: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      ends_on: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
  }
  return {
    starts_on: format(startOfMonth(now), 'yyyy-MM-dd'),
    ends_on: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export interface GoalProgress {
  current: number
  pct: number // 0..100, tetto a 100
  reached: boolean
  // Finestra terminata senza raggiungere il traguardo
  expired: boolean
  // Giorni alla scadenza (0 = scade oggi); negativo mai esposto: vedi expired
  daysLeft: number
}

export function computeGoalProgress(
  goal: Pick<PersonalGoal, 'metric' | 'target' | 'activity_type' | 'starts_on' | 'ends_on'>,
  activities: Activity[],
  now: Date = new Date(),
): GoalProgress {
  const metric = goal.metric as GoalMetric
  let current = 0
  for (const a of activities) {
    if (goal.activity_type && a.type !== goal.activity_type) continue
    const day = format(parseISO(a.date), 'yyyy-MM-dd')
    if (day < goal.starts_on || day > goal.ends_on) continue
    current += metricValue(metric, a)
  }
  current = Math.round(current * 10) / 10

  const target = Number(goal.target)
  const reached = current >= target
  const rawDaysLeft = differenceInCalendarDays(parseISO(goal.ends_on), startOfDay(now))
  const expired = !reached && rawDaysLeft < 0

  return {
    current,
    pct: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    reached,
    expired,
    daysLeft: Math.max(0, rawDaysLeft),
  }
}

// Obiettivi "vivi" (né raggiunti né scaduti) per il limite alla creazione
export function countActiveGoals(goals: PersonalGoal[], activities: Activity[], now: Date = new Date()): number {
  return goals.filter((g) => {
    const p = computeGoalProgress(g, activities, now)
    return !p.reached && !p.expired
  }).length
}

// Il tipo dell'attività filtrata è valido per la metrica scelta?
export function typeAllowedForMetric(metric: GoalMetric, type: ActivityType | null, hasDist: (t: ActivityType) => boolean): boolean {
  if (!METRIC_NEEDS_DISTANCE[metric] || type === null) return true
  return hasDist(type)
}
