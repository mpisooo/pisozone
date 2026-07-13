import { format, startOfWeek, parseISO } from 'date-fns'

// Recupero (roadmap v2, pilastro 02 punto 5): qui vive SOLO la logica pura —
// limite dei giorni di riposo per settimana, clamp di acqua e sonno — testata
// con Vitest. La persistenza su recovery_logs sta in hooks/useRecovery.ts,
// la UI in components/RecoveryCard.tsx.
//
// Il giorno di riposo protegge la streak come un freeze (entra in calcStreak
// insieme alle frozenDates) ma è gratuito e si dichiara SOLO per il giorno
// corrente: retrodatarlo renderebbe inutili i freeze a crediti. Il limite
// settimanale evita che "riposo ogni giorno" svuoti di senso la streak.

export const REST_DAYS_PER_WEEK = 2

export const WATER_GLASS_ML = 250
export const WATER_GOAL_ML = 2000
// Tetto UI più prudente del check DB (20000): oltre i 5L è quasi certamente
// un errore di tap, non idratazione reale.
export const WATER_MAX_ML = 5000

export const SLEEP_STEP_H = 0.5
export const SLEEP_MAX_H = 24
// Punto di partenza del contatore sonno al primo tocco (mediana adulta):
// è un cursore da aggiustare, non un valore salvato a insaputa dell'utente —
// il primo "+" lo salva esplicitamente, come lo slider RPE.
export const SLEEP_START_H = 8

export function restDatesFrom(logs: { day: string; rest: boolean }[]): string[] {
  return logs.filter((l) => l.rest).map((l) => l.day)
}

// Giorni di riposo già segnati nella stessa settimana (lunedì-domenica,
// coerente con l'obiettivo settimanale) del giorno dato.
export function restCountInWeek(restDates: string[], day: string): number {
  const weekKey = format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  return restDates.filter(
    (d) => format(startOfWeek(parseISO(d), { weekStartsOn: 1 }), 'yyyy-MM-dd') === weekKey,
  ).length
}

// Si può segnare riposo per `day`? Il giorno stesso non conta nel limite
// (altrimenti togliere e rimettere la spunta si bloccherebbe da solo).
export function canMarkRest(restDates: string[], day: string): boolean {
  return restCountInWeek(restDates.filter((d) => d !== day), day) < REST_DAYS_PER_WEEK
}

export function restRemainingInWeek(restDates: string[], day: string): number {
  return Math.max(0, REST_DAYS_PER_WEEK - restCountInWeek(restDates, day))
}

export function clampWater(ml: number): number {
  if (!Number.isFinite(ml)) return 0
  return Math.min(Math.max(Math.round(ml), 0), WATER_MAX_ML)
}

export function waterPct(ml: number | null): number {
  if (ml == null || ml <= 0) return 0
  return Math.min(100, (ml / WATER_GOAL_ML) * 100)
}

export function clampSleep(hours: number): number {
  if (!Number.isFinite(hours)) return 0
  const clamped = Math.min(Math.max(hours, 0), SLEEP_MAX_H)
  // ai mezzi passi dello stepper (0.5h), come lo step della UI
  return Math.round(clamped * 2) / 2
}
