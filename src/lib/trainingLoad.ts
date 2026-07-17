import { format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Activity } from '../types'

// Carico settimanale con il metodo session-RPE di Foster (roadmap v3,
// pilastro 02): sforzo percepito (1-10, v30) × minuti, sommato per settimana
// lunedì→domenica. Contano SOLO le sessioni con RPE compilato — nessun
// valore inventato per le altre (stesso principio di rpe/mood: niente
// default che finga un dato mai inserito); il conteggio totale serve alla
// UI per dire quanto è rappresentativo il grafico.

export interface TrainingLoadWeek {
  key: string // yyyy-MM-dd del lunedì
  label: string
  load: number // Σ rpe × minuti
  sessionsWithRpe: number
  sessions: number
}

// Soglia classica dell'avviso: +50% da una settimana all'altra è il salto di
// carico associato in letteratura a un rischio di infortunio più alto.
export const LOAD_JUMP_THRESHOLD = 1.5

export function buildTrainingLoadSeries(
  activities: Activity[],
  numWeeks = 8,
  now: Date = new Date(),
): TrainingLoadWeek[] {
  const currentWeek = startOfWeek(now, { weekStartsOn: 1 })
  const weeks: TrainingLoadWeek[] = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(currentWeek, i)
    weeks.push({
      key: format(weekStart, 'yyyy-MM-dd'),
      label: format(weekStart, 'd MMM', { locale: it }),
      load: 0,
      sessionsWithRpe: 0,
      sessions: 0,
    })
  }
  const index = new Map(weeks.map((w) => [w.key, w]))
  for (const a of activities) {
    const week = index.get(format(startOfWeek(parseISO(a.date), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    if (!week) continue
    week.sessions++
    if (a.rpe != null && a.rpe > 0) {
      week.load += a.rpe * a.duration_min
      week.sessionsWithRpe++
    }
  }
  return weeks
}

// Avviso "salto di carico": la settimana corrente (ultimo bucket) supera di
// oltre il 50% la precedente, entrambe con dati. Ritorna la percentuale di
// aumento arrotondata, o null se non c'è nulla da segnalare. La settimana
// corrente è quasi sempre incompleta: l'avviso può solo arrivare in anticipo
// ("stai GIÀ oltre la soglia"), mai gonfiato.
export function loadJumpPct(series: TrainingLoadWeek[]): number | null {
  if (series.length < 2) return null
  const current = series[series.length - 1]
  const previous = series[series.length - 2]
  if (previous.load <= 0 || current.load <= previous.load * LOAD_JUMP_THRESHOLD) return null
  return Math.round((current.load / previous.load - 1) * 100)
}
