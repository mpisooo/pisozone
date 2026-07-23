import { format, parseISO, startOfDay, differenceInCalendarDays, addDays } from 'date-fns'
import type { Activity, ActivityType } from '../types'

// Piani e programmi di allenamento (roadmap v2, pilastro 02 punto 4).
// I template vivono qui nel codice (stesso pattern di CHALLENGE_POOL e MEDALS,
// incluse le stringhe italiane di dominio); il DB registra solo l'iscrizione
// (plan_enrollments, v34). L'avanzamento si DERIVA dalle attività registrate:
// nessuna spunta manuale, alleni e il programma si aggiorna da solo.
//
// Regole di matching, pensate per rispettare la progressione:
// - le settimane partono da started_on (giorno 1) a blocchi di 7 giorni;
// - una sessione si sblocca nella SUA settimana: non si può anticipare tutto
//   il programma nei primi giorni (front-load);
// - il recupero è ammesso: un'attività della settimana W può saldare sessioni
//   arretrate delle settimane precedenti;
// - ogni attività soddisfa al massimo UNA sessione.

export interface PlanSessionTemplate {
  week: number // 1-based
  label: string
  types: ActivityType[]
  minMinutes: number
  minKm?: number
}

export type PlanLevel = 'principiante' | 'intermedio'

export interface PlanTemplate {
  key: string
  title: string
  tagline: string
  icon: string // emoji: linguaggio della gamification, come sfide e medaglie
  weeks: number
  level: PlanLevel
  credits: number // ricompensa al completamento (check DB: 0..300)
  sessions: PlanSessionTemplate[]
}

// Piccola fabbrica per settimane ripetitive (es. "3 sessioni uguali")
function repeat(week: number, count: number, label: string, types: ActivityType[], minMinutes: number, minKm?: number): PlanSessionTemplate[] {
  return Array.from({ length: count }, () => ({ week, label, types, minMinutes, ...(minKm ? { minKm } : {}) }))
}

export const PLAN_CATALOG: PlanTemplate[] = [
  {
    key: 'corsa_5k',
    title: '5K in 6 settimane',
    tagline: 'Da zero alla tua prima corsa di 5 chilometri, un passo alla volta.',
    icon: '🏁',
    weeks: 6,
    level: 'principiante',
    credits: 150,
    sessions: [
      ...repeat(1, 2, 'Corsa o camminata veloce', ['corsa', 'camminata'], 20),
      ...repeat(1, 1, 'Camminata lunga', ['camminata'], 30),
      ...repeat(2, 2, 'Corsa o camminata veloce', ['corsa', 'camminata'], 25),
      ...repeat(2, 1, 'Camminata lunga', ['camminata'], 35),
      ...repeat(3, 2, 'Corsa continua', ['corsa'], 20),
      ...repeat(3, 1, 'Corsa o camminata lunga', ['corsa', 'camminata'], 30),
      ...repeat(4, 2, 'Corsa continua', ['corsa'], 25),
      ...repeat(4, 1, 'Corsa o camminata lunga', ['corsa', 'camminata'], 35),
      ...repeat(5, 2, 'Corsa continua', ['corsa'], 30),
      ...repeat(5, 1, 'Corsa di scarico', ['corsa'], 20),
      ...repeat(6, 1, 'Corsa continua', ['corsa'], 30),
      ...repeat(6, 1, 'Corsa di scarico', ['corsa'], 20),
      ...repeat(6, 1, 'Il traguardo: 5 km!', ['corsa'], 25, 5),
    ],
  },
  {
    key: 'corsa_10k',
    title: '10K in 8 settimane',
    tagline: 'Per chi corre già i 5 km e vuole raddoppiare la distanza.',
    icon: '🏆',
    weeks: 8,
    level: 'intermedio',
    credits: 200,
    sessions: [
      ...repeat(1, 2, 'Corsa base', ['corsa'], 30),
      ...repeat(1, 1, 'Lungo', ['corsa'], 40, 5),
      ...repeat(2, 2, 'Corsa base', ['corsa'], 30),
      ...repeat(2, 1, 'Lungo', ['corsa'], 45, 6),
      ...repeat(3, 2, 'Corsa base', ['corsa'], 35),
      ...repeat(3, 1, 'Lungo', ['corsa'], 50, 6),
      ...repeat(4, 2, 'Corsa base', ['corsa'], 35),
      ...repeat(4, 1, 'Lungo', ['corsa'], 55, 7),
      ...repeat(5, 2, 'Corsa base', ['corsa'], 40),
      ...repeat(5, 1, 'Lungo', ['corsa'], 60, 8),
      ...repeat(6, 2, 'Corsa base', ['corsa'], 40),
      ...repeat(6, 1, 'Lungo', ['corsa'], 65, 8),
      ...repeat(7, 2, 'Corsa base', ['corsa'], 45),
      ...repeat(7, 1, 'Lungo', ['corsa'], 70, 9),
      ...repeat(8, 1, 'Corsa di scarico', ['corsa'], 30),
      ...repeat(8, 1, 'Risveglio muscolare', ['corsa'], 20),
      ...repeat(8, 1, 'Il traguardo: 10 km!', ['corsa'], 50, 10),
    ],
  },
  {
    key: 'palestra_solido',
    title: 'Solido in palestra',
    tagline: 'Quattro settimane per rendere la palestra un\'abitudine, non un\'eccezione.',
    icon: '🏋️',
    weeks: 4,
    level: 'principiante',
    credits: 100,
    sessions: [
      ...repeat(1, 3, 'Sessione in palestra', ['palestra'], 30),
      ...repeat(2, 3, 'Sessione in palestra', ['palestra'], 35),
      ...repeat(3, 3, 'Sessione in palestra', ['palestra'], 40),
      ...repeat(4, 3, 'Sessione in palestra', ['palestra'], 45),
    ],
  },
  {
    key: 'ritorno_movimento',
    title: 'Ritorno al movimento',
    tagline: 'Riparti in dolcezza dopo una pausa: quattro settimane a bassa intensità.',
    icon: '🌱',
    weeks: 4,
    level: 'principiante',
    credits: 100,
    sessions: [
      ...repeat(1, 3, 'Movimento leggero', ['camminata', 'yoga', 'bici', 'nuoto'], 20),
      ...repeat(2, 3, 'Movimento leggero', ['camminata', 'yoga', 'bici', 'nuoto'], 25),
      ...repeat(3, 3, 'Movimento moderato', ['camminata', 'yoga', 'bici', 'nuoto'], 30),
      ...repeat(4, 3, 'Movimento moderato', ['camminata', 'yoga', 'bici', 'nuoto'], 35),
    ],
  },
  {
    key: 'yoga_equilibrio',
    title: 'Equilibrio e respiro',
    tagline: 'Un mese di yoga per costruire flessibilità e calma, seduta dopo seduta.',
    icon: '🧘',
    weeks: 4,
    level: 'principiante',
    credits: 100,
    sessions: [
      ...repeat(1, 3, 'Pratica yoga', ['yoga'], 15),
      ...repeat(2, 3, 'Pratica yoga', ['yoga'], 20),
      ...repeat(3, 3, 'Pratica yoga', ['yoga'], 25),
      ...repeat(4, 3, 'Pratica yoga', ['yoga'], 30),
    ],
  },
]

export function getPlanTemplate(key: string): PlanTemplate | undefined {
  return PLAN_CATALOG.find((p) => p.key === key)
}

// Suggerimento contestuale di un programma (roadmap "PisoZone Next" P2-04):
// sport "trainante" di ogni piano, deliberatamente più stretto dei `types`
// delle singole sessioni (corsa_5k include anche camminata per chi non corre
// ancora) — qui serve il segnale forte "fai già questo sport con costanza",
// non un match qualsiasi. `ritorno_movimento` non ha uno sport dominante
// (è pensato per un rientro dopo una pausa, un trigger diverso da "attività
// ripetute"): deliberatamente escluso da questo meccanismo.
const PLAN_PRIMARY_TYPE: Partial<Record<string, ActivityType>> = {
  corsa_5k: 'corsa',
  corsa_10k: 'corsa',
  palestra_solido: 'palestra',
  yoga_equilibrio: 'yoga',
}

const SUGGEST_MIN_ACTIVITIES = 3

// Il primo piano non completato il cui sport trainante è stato praticato
// almeno SUGGEST_MIN_ACTIVITIES volte — l'ordine del catalogo fa da priorità
// implicita (corsa_5k prima di corsa_10k, così il progresso resta naturale).
export function suggestPlan(activities: Activity[], completedKeys: ReadonlySet<string>): PlanTemplate | null {
  const counts = new Map<ActivityType, number>()
  for (const a of activities) counts.set(a.type, (counts.get(a.type) ?? 0) + 1)

  for (const plan of PLAN_CATALOG) {
    if (completedKeys.has(plan.key)) continue
    const primaryType = PLAN_PRIMARY_TYPE[plan.key]
    if (!primaryType) continue
    if ((counts.get(primaryType) ?? 0) >= SUGGEST_MIN_ACTIVITIES) return plan
  }
  return null
}

// Dismiss del suggerimento (client-only, localStorage): se il fondatore
// chiude la card per un piano, quello specifico non ricompare più — ma un
// piano diverso, se in futuro diventa pertinente, sì. Best-effort come
// lib/i18n/language.ts: l'ambiente Vitest ('node') non ha localStorage.
const DISMISSED_PLAN_SUGGESTIONS_KEY = 'pz-plan-suggest-dismissed'

function getDismissedPlanSuggestions(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_PLAN_SUGGESTIONS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function isPlanSuggestionDismissed(key: string): boolean {
  return getDismissedPlanSuggestions().includes(key)
}

export function dismissPlanSuggestion(key: string): void {
  try {
    const current = getDismissedPlanSuggestions()
    if (!current.includes(key)) {
      localStorage.setItem(DISMISSED_PLAN_SUGGESTIONS_KEY, JSON.stringify([...current, key]))
    }
  } catch {
    // Best effort
  }
}

// Settimana del programma (1-based) in cui cade una data: 0 o negativa prima
// dell'inizio, oltre `weeks` dopo la fine.
export function weekOfPlan(startedOn: string, date: Date): number {
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(parseISO(startedOn)))
  return Math.floor(diff / 7) + 1
}

export interface PlanSessionProgress {
  template: PlanSessionTemplate
  done: boolean
  activityId: string | null
}

export interface PlanProgress {
  sessions: PlanSessionProgress[]
  doneCount: number
  totalCount: number
  // 1..weeks anche prima/dopo la finestra: è la settimana da mostrare
  currentWeek: number
  completed: boolean
  // Finestra terminata senza completare tutte le sessioni
  expired: boolean
  // Ultimo giorno dell'ultima settimana (yyyy-MM-dd)
  endsOn: string
}

function sessionAccepts(s: PlanSessionTemplate, a: Activity): boolean {
  if (!s.types.includes(a.type)) return false
  if (a.duration_min < s.minMinutes) return false
  if (s.minKm && (a.distance_km ?? 0) < s.minKm) return false
  return true
}

export function computePlanProgress(
  template: PlanTemplate,
  startedOn: string,
  activities: Activity[],
  now: Date = new Date(),
): PlanProgress {
  // Ordine di saldo: prima le sessioni più vecchie (settimana, poi posizione)
  const sessions: PlanSessionProgress[] = [...template.sessions]
    .sort((a, b) => a.week - b.week)
    .map((s) => ({ template: s, done: false, activityId: null }))

  const chronological = [...activities].sort((a, b) => a.date.localeCompare(b.date))
  for (const activity of chronological) {
    const week = weekOfPlan(startedOn, parseISO(activity.date))
    if (week < 1 || week > template.weeks) continue
    const target = sessions.find(
      (s) => !s.done && s.template.week <= week && sessionAccepts(s.template, activity),
    )
    if (target) {
      target.done = true
      target.activityId = activity.id
    }
  }

  const doneCount = sessions.filter((s) => s.done).length
  const completed = doneCount === sessions.length
  const nowWeek = weekOfPlan(startedOn, now)
  const currentWeek = Math.min(Math.max(nowWeek, 1), template.weeks)
  const expired = !completed && nowWeek > template.weeks
  const endsOn = format(addDays(startOfDay(parseISO(startedOn)), template.weeks * 7 - 1), 'yyyy-MM-dd')

  return { sessions, doneCount, totalCount: sessions.length, currentWeek, completed, expired, endsOn }
}
