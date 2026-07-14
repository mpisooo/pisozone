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
