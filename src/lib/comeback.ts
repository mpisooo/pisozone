import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Activity } from '../types'

// Incentivi al ritorno (roadmap v2, pilastro 04): chi si assenta trova un
// rientro morbido, non un muro di sensi di colpa. Qui la logica client
// (card in Home); il gemello lato cron vive in api/_lib/comeback.ts.

// Da quanti giorni manca un'attività (0 = oggi). null = mai allenato.
export function daysSinceLastActivity(activities: Activity[], now: Date = new Date()): number | null {
  if (activities.length === 0) return null
  let last: Date | null = null
  for (const a of activities) {
    const d = parseISO(a.date)
    if (!last || d > last) last = d
  }
  return Math.max(0, differenceInCalendarDays(now, last!))
}

// La card "Bentornato" compare da 4 giorni di assenza in su: sotto è normale
// routine, non un'assenza.
export const COMEBACK_THRESHOLD_DAYS = 4

export function isComeback(days: number | null): boolean {
  return days !== null && days >= COMEBACK_THRESHOLD_DAYS
}
