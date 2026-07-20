import type { ZoneId } from './zones'

// Allenamenti a intervalli strutturati (roadmap v4, pilastro 01): una
// sessione a ripetute — N × (distanza al target di zona, recupero a tempo)
// — costruita in Log.tsx prima di partire e seguita passo-passo durante il
// tracciamento GPS live in WorkoutTrackingOverlay.tsx. Deliberatamente
// SOLO distanza per il lavoro e SOLO tempo per il recupero (non un asse
// "tipo di target" configurabile): è il pattern più comune nell'allenamento
// a ripetute reale, e dimezza la UI del builder. Percorso e split restano
// quelli di sempre — questo modulo aggiunge solo la sequenza di step e il
// confronto col target, non tocca il tracciamento GPS in sé.

export const INTERVAL_MIN_REPEATS = 2
export const INTERVAL_MAX_REPEATS = 20
export const INTERVAL_MIN_WORK_M = 100
export const INTERVAL_MAX_WORK_M = 10000
export const INTERVAL_MIN_RECOVERY_S = 15
export const INTERVAL_MAX_RECOVERY_S = 600

export interface IntervalPlan {
  repeats: number
  workDistanceM: number
  workZoneId: ZoneId
  recoverySec: number
  recoveryZoneId: ZoneId
}

export interface IntervalStep {
  index: number
  kind: 'work' | 'recovery'
  repNumber: number
  zoneId: ZoneId
  // Metri per uno step 'work', secondi per uno step 'recovery'.
  target: number
}

export function isValidIntervalPlan(plan: IntervalPlan): boolean {
  return (
    Number.isInteger(plan.repeats) && plan.repeats >= INTERVAL_MIN_REPEATS && plan.repeats <= INTERVAL_MAX_REPEATS &&
    plan.workDistanceM >= INTERVAL_MIN_WORK_M && plan.workDistanceM <= INTERVAL_MAX_WORK_M &&
    plan.recoverySec >= INTERVAL_MIN_RECOVERY_S && plan.recoverySec <= INTERVAL_MAX_RECOVERY_S
  )
}

export function buildIntervalSteps(plan: IntervalPlan): IntervalStep[] {
  const steps: IntervalStep[] = []
  for (let rep = 1; rep <= plan.repeats; rep++) {
    steps.push({ index: steps.length, kind: 'work', repNumber: rep, zoneId: plan.workZoneId, target: plan.workDistanceM })
    steps.push({ index: steps.length, kind: 'recovery', repNumber: rep, zoneId: plan.recoveryZoneId, target: plan.recoverySec })
  }
  return steps
}

export function isStepComplete(
  step: IntervalStep,
  distanceSinceStepStartM: number,
  secondsSinceStepStart: number,
): boolean {
  return step.kind === 'work'
    ? distanceSinceStepStartM >= step.target
    : secondsSinceStepStart >= step.target
}

// Avanza allo step successivo se quello corrente è concluso, altrimenti
// resta fermo — mai più di uno step per chiamata: il chiamante la invoca a
// ogni aggiornamento dei punti GPS, un salto di più step non ha senso fisico.
export function nextStepIndex(
  steps: IntervalStep[],
  currentStepIndex: number,
  distanceSinceStepStartM: number,
  secondsSinceStepStart: number,
): number {
  if (currentStepIndex >= steps.length) return currentStepIndex
  return isStepComplete(steps[currentStepIndex], distanceSinceStepStartM, secondsSinceStepStart)
    ? currentStepIndex + 1
    : currentStepIndex
}
