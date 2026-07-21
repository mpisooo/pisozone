import type { ReadinessAdvice } from './readiness.js'

// Incentivi al ritorno, lato cron (roadmap v2, pilastro 04): il promemoria
// serale smette di martellare chi si è allontanato. Assenza breve (1-2
// giorni) = promemoria standard; assenza a una pietra miliare (3/7/14/30
// giorni) = messaggio di rientro morbido; tutto il resto = silenzio.
// Gemello client-side (card in Home): src/lib/comeback.ts.

export type ReminderKind = 'standard' | 'comeback' | 'skip'

export const COMEBACK_MILESTONES = [3, 7, 14, 30]

// daysAbsent: giorni interi dall'ultima attività (1 = ieri).
// null = nessuna attività nella finestra osservata (o mai): non disturbare.
export function classifyReminder(daysAbsent: number | null): ReminderKind {
  if (daysAbsent === null) return 'skip'
  if (daysAbsent <= 2) return 'standard'
  return COMEBACK_MILESTONES.includes(daysAbsent) ? 'comeback' : 'skip'
}

// Notifiche consapevoli della prontezza (roadmap v4, pilastro 04): il
// promemoria "standard" (assenza breve, 1-2 giorni) si ammorbidisce quando il
// Punteggio di Prontezza (pilastro 01) dice già "riposa": mai un ordine ad
// allenarsi quando il corpo chiede il contrario. Il messaggio di rientro
// (comeback) resta invariato: è già morbido di suo. advice null (nessun
// segnale disponibile) = tono normale. computeReadiness vive in due copie —
// ./readiness.ts qui e src/lib/readiness.ts lato client — perché src/lib
// importa senza estensione .js (moduleResolution "bundler", convenzione
// invariata per tutto src/), mentre le funzioni /api richiedono NodeNext:
// un cross-import diretto romperebbe typecheck:api. readiness.test.ts
// confronta le due implementazioni riga per riga, stesso principio di
// seasonalPodium.test.ts per SEASONAL_WINDOWS.
export type ReminderTone = 'push' | 'soft'

export function reminderTone(advice: ReadinessAdvice | null): ReminderTone {
  return advice === 'rest' ? 'soft' : 'push'
}
