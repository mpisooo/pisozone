import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Duel } from '../types'

// Sfide 1v1 e di gruppo (roadmap v2, pilastro 03): logica pura sui duelli.
// L'avanzamento arriva dalla RPC get_duel_progress (aggregati per
// partecipante); qui vivono stato, vincitore e formattazione.

export const DUEL_METRICS = ['sessions', 'minutes', 'km', 'kcal'] as const
export type DuelMetric = (typeof DUEL_METRICS)[number]

// Ricompensa fissa al vincitore: vincolata dal check 0..150 della migrazione
// v37 e accreditata una sola volta dal trigger (modello fiduciario).
export const DUEL_WIN_CREDITS = 100
export const DUEL_DURATIONS = [3, 7, 14] // giorni

export interface DuelProgressRow {
  user_id: string
  username: string
  photo_url: string | null
  value: number
}

export type DuelState = 'pending' | 'declined' | 'running' | 'ended' | 'finished'

// 'running' = attivo e la finestra è in corso; 'ended' = attivo ma la
// finestra è chiusa (si può proclamare il vincitore).
export function duelState(duel: Pick<Duel, 'status' | 'ends_on'>, todayIso: string): DuelState {
  if (duel.status === 'pending') return 'pending'
  if (duel.status === 'declined') return 'declined'
  if (duel.status === 'finished') return 'finished'
  return todayIso > duel.ends_on ? 'ended' : 'running'
}

export function duelDaysLeft(duel: Pick<Duel, 'ends_on'>, todayIso: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(duel.ends_on), parseISO(todayIso)))
}

// Vincitore dai valori aggregati: il più alto, purché unico e > 0.
// Parità (o nessuna attività) = nessun vincitore, nessun credito.
export function duelWinnerId(rows: DuelProgressRow[]): string | null {
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  if (sorted[0].value <= 0) return null
  if (sorted.length > 1 && sorted[1].value === sorted[0].value) return null
  return sorted[0].user_id
}

export function canClaimDuel(
  duel: Pick<Duel, 'status' | 'ends_on'>,
  rows: DuelProgressRow[],
  userId: string,
  todayIso: string,
): boolean {
  return duelState(duel, todayIso) === 'ended' && duelWinnerId(rows) === userId
}

export function formatDuelValue(metric: string, value: number): string {
  const n = Math.round(value * 10) / 10
  if (metric === 'sessions') return String(Math.round(n))
  if (metric === 'minutes') return `${Math.round(n)} min`
  if (metric === 'km') return `${n.toLocaleString('it-IT')} km`
  return `${Math.round(n).toLocaleString('it-IT')} kcal`
}
