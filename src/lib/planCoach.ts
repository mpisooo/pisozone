import type { PlanProgress } from './plans'

// Coach automatico sui programmi (roadmap v4, pilastro 01): incrocia due
// funzioni pure già esistenti e testate — computePlanProgress (plans.ts) e
// loadJumpPct su buildTrainingLoadSeries (trainingLoad.ts) — senza
// duplicarne la logica. Qui vive solo la sintesi: se l'utente è indietro di
// almeno 2 sessioni rispetto alla settimana corrente del piano, propone di
// recuperare — e se in più il carico settimanale sta già saltando, il
// consiglio cambia (rallentare prima di allungare ulteriormente il conto).

export const PLAN_COACH_MISSED_THRESHOLD = 2

export type PlanCoachAdviceKind = 'behind' | 'load_conflict'

export interface PlanCoachAdvice {
  kind: PlanCoachAdviceKind
  missedSessions: number
}

// `loadJump` è l'output di loadJumpPct: null quando il carico non sta
// saltando (o mancano dati), altrimenti la percentuale di aumento.
export function computePlanCoachAdvice(
  progress: PlanProgress,
  loadJump: number | null,
): PlanCoachAdvice | null {
  if (progress.completed || progress.expired) return null

  // Le settimane già trascorse contano per intero; quella in corso solo in
  // proporzione ai giorni già passati (dayOfCurrentWeek) — mai l'intera
  // settimana fin dal suo primo giorno, o il coach griderebbe "indietro" a
  // ogni cambio di settimana anche a chi è perfettamente in pari.
  const priorWeeksCount = progress.sessions.filter((s) => s.template.week < progress.currentWeek).length
  const currentWeekSessions = progress.sessions.filter((s) => s.template.week === progress.currentWeek)
  const expectedThisWeek = Math.floor((progress.dayOfCurrentWeek / 7) * currentWeekSessions.length)
  const expectedByNow = priorWeeksCount + expectedThisWeek

  const missedSessions = expectedByNow - progress.doneCount
  if (missedSessions < PLAN_COACH_MISSED_THRESHOLD) return null

  return { kind: loadJump != null ? 'load_conflict' : 'behind', missedSessions }
}
