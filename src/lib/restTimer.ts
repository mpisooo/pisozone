// Timer di recupero tra le serie (roadmap v4, pilastro 03): SOLO client,
// nessuna persistenza — un contatore lasciato aperto e mai richiuso non deve
// sopravvivere alla sessione. Qui vive la logica pura (testabile), lo stato
// vero (setInterval, haptic) sta in hooks/useRestTimer.ts. Il tempo restante
// si calcola sempre da un istante di fine reale (Date.now() + durata), MAI
// da un contatore che scala una tantum: stesso principio del GPS in gps.ts.

export const REST_TIMER_PRESETS_SEC = [60, 90, 120, 180]
export const DEFAULT_REST_TIMER_SEC = 90
export const REST_TIMER_STEP_SEC = 15
export const REST_TIMER_MIN_SEC = 15
export const REST_TIMER_MAX_SEC = 600

export function clampRestSeconds(seconds: number): number {
  return Math.min(REST_TIMER_MAX_SEC, Math.max(REST_TIMER_MIN_SEC, Math.round(seconds)))
}

export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now)
}

// "1:30", "0:45" — sempre m:ss, il timer di recupero non supera mai i minuti singoli.
export function formatRestClock(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
