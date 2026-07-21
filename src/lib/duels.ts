import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Duel } from '../types'
import { formatSegmentTime } from './segments'

// Sfide 1v1 e di gruppo (roadmap v2, pilastro 03): logica pura sui duelli.
// L'avanzamento arriva dalla RPC get_duel_progress (aggregati per
// partecipante); qui vivono stato, vincitore e formattazione.

export const DUEL_METRICS = ['sessions', 'minutes', 'km', 'kcal'] as const
export type DuelMetric = (typeof DUEL_METRICS)[number]

// Ricompensa fissa al vincitore: vincolata dal check 0..150 della migrazione
// v37 e accreditata una sola volta dal trigger (modello fiduciario).
export const DUEL_WIN_CREDITS = 100
export const DUEL_DURATIONS = [3, 7, 14] // giorni

// 'segment_time' (v47, sfide di percorso — roadmap v4 pilastro 02) è
// l'UNICO metric dove un valore più basso vince: il tempo sul segmento. Il
// valore resta null finché il partecipante non ha ancora un tentativo nella
// finestra (mai 0, che sembrerebbe un tempo perfetto).
export interface DuelProgressRow {
  user_id: string
  username: string
  photo_url: string | null
  value: number | null
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

// Vincitore dai valori aggregati: il migliore, purché unico. Per i 4 metric
// storici "migliore" = più alto e > 0; per segment_time = più basso tra chi
// ha almeno un tentativo (value non null). Parità (o nessun dato) = nessun
// vincitore, nessun credito.
export function duelWinnerId(rows: DuelProgressRow[], metric: string): string | null {
  const withValue = rows.filter((r): r is DuelProgressRow & { value: number } => r.value != null && r.value > 0)
  if (withValue.length === 0) return null
  const lowerIsBetter = metric === 'segment_time'
  const sorted = [...withValue].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))
  if (sorted.length > 1 && sorted[1].value === sorted[0].value) return null
  return sorted[0].user_id
}

export function canClaimDuel(
  duel: Pick<Duel, 'status' | 'ends_on' | 'metric'>,
  rows: DuelProgressRow[],
  userId: string,
  todayIso: string,
): boolean {
  return duelState(duel, todayIso) === 'ended' && duelWinnerId(rows, duel.metric) === userId
}

// Percentuale di riempimento della barra di avanzamento: per i metric dove
// vince il più alto, proporzionale al massimo tra i partecipanti; per
// segment_time (vince il più basso) proporzionale al RAPPORTO col migliore
// tempo, così il più veloce ha la barra piena e chi impiega il doppio ne ha
// una a metà — l'unico modo sensato di visualizzare "più corto è meglio".
export function duelBarPct(value: number | null, allValues: (number | null)[], metric: string): number {
  const real = allValues.filter((v): v is number => v != null && v > 0)
  if (value == null || value <= 0 || real.length === 0) return 0
  if (metric === 'segment_time') {
    const best = Math.min(...real)
    return Math.min(100, (best / value) * 100)
  }
  const max = Math.max(...real)
  return (value / max) * 100
}

export function formatDuelValue(metric: string, value: number | null): string {
  if (value == null) return '—'
  if (metric === 'segment_time') return formatSegmentTime(value)
  const n = Math.round(value * 10) / 10
  if (metric === 'sessions') return String(Math.round(n))
  if (metric === 'minutes') return `${Math.round(n)} min`
  if (metric === 'km') return `${n.toLocaleString('it-IT')} km`
  return `${Math.round(n).toLocaleString('it-IT')} kcal`
}
