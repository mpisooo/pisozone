import type { Activity } from '../types'

// Payload di un'attività non ancora sincronizzata: stessa forma accettata da
// addActivity (id/user_id/created_at/credits_earned li assegna il server).
export type QueuedActivityPayload = Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>

export interface QueuedActivity {
  localId: string
  payload: QueuedActivityPayload
  queuedAt: string
}

const PENDING_PREFIX = 'pending-'

export function pendingActivityId(localId: string): string {
  return `${PENDING_PREFIX}${localId}`
}

export function isPendingActivityId(id: string): boolean {
  return id.startsWith(PENDING_PREFIX)
}

// Attività "provvisoria" mostrata in UI finché la coda non la sincronizza:
// id sintetico riconoscibile, crediti a zero — non si finge un valore che
// solo il server (award_challenge_credits e affini) può calcolare davvero.
export function toPendingActivity(item: QueuedActivity, userId: string): Activity {
  return {
    ...item.payload,
    id: pendingActivityId(item.localId),
    user_id: userId,
    created_at: item.queuedAt,
    credits_earned: 0,
  }
}

// Stesso criterio con cui addActivity inserisce un'attività appena creata
// (prepend in cima, senza ri-ordinare per data): le più recenti in coda
// vengono prima, coerente con l'optimistic update già esistente.
export function mergeWithPending(serverActivities: Activity[], queue: QueuedActivity[], userId: string): Activity[] {
  if (queue.length === 0) return serverActivities
  return [...queue.map((item) => toPendingActivity(item, userId)), ...serverActivities]
}

// postgrest-js risponde con status 0 SOLO quando il fetch fallisce prima di
// raggiungere il server (offline, DNS, timeout) — mai per un vero codice HTTP,
// nemmeno un 4xx/5xx applicativo. Un errore "vero" (validazione, RLS) non va
// rimesso in coda: riprovare all'infinito non lo risolverebbe e nasconderebbe
// il problema all'utente dietro un'attività per sempre "in attesa".
export function isNetworkFailure(status: number): boolean {
  return status === 0
}
