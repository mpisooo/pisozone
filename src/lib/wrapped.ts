import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Activity, ActivityType } from '../types'
import { ACTIVITY_OPTIONS } from './constants'
import { buildZoneDistribution, type ZoneDistributionPoint } from './stats'

// PisoZone Wrapped (roadmap v2, pilastro 04): il recap mensile/annuale in
// stile "storia", derivato al volo dalle attività — nessuna tabella, nessun
// flag: il Wrapped di un periodo si può rivivere quante volte si vuole.

export type WrappedPeriod =
  | { kind: 'month'; year: number; month: number } // month 1-12
  | { kind: 'year'; year: number }

export interface WrappedData {
  period: WrappedPeriod
  title: string
  sessions: number
  minutes: number
  calories: number
  km: number
  activeDays: number
  distinctSports: number
  topSport: { type: ActivityType; label: string; sessions: number } | null
  bestStreak: number
  busiestDay: { date: string; minutes: number } | null
  longestSessionMin: number
  zones: ZoneDistributionPoint[]
  topZone: ZoneDistributionPoint | null
  prevSessions: number
}

export function periodRange(period: WrappedPeriod): { start: Date; end: Date } {
  if (period.kind === 'month') {
    return { start: new Date(period.year, period.month - 1, 1), end: new Date(period.year, period.month, 1) }
  }
  return { start: new Date(period.year, 0, 1), end: new Date(period.year + 1, 0, 1) }
}

export function prevPeriod(period: WrappedPeriod): WrappedPeriod {
  if (period.kind === 'month') {
    return period.month === 1
      ? { kind: 'month', year: period.year - 1, month: 12 }
      : { kind: 'month', year: period.year, month: period.month - 1 }
  }
  return { kind: 'year', year: period.year - 1 }
}

// "Giugno 2026" / "2026" — LLLL di date-fns è minuscolo in italiano
export function wrappedTitle(period: WrappedPeriod): string {
  if (period.kind === 'year') return String(period.year)
  const raw = format(periodRange(period).start, 'LLLL yyyy', { locale: it })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// Quali Wrapped proporre "adesso": il mese appena concluso, sempre; l'anno
// appena concluso — che da dicembre diventa quello corrente, stile Spotify.
export function defaultWrappedPeriods(now: Date = new Date()): { month: WrappedPeriod; year: WrappedPeriod } {
  const m = now.getMonth() + 1 // 1-12
  const month: WrappedPeriod = m === 1
    ? { kind: 'month', year: now.getFullYear() - 1, month: 12 }
    : { kind: 'month', year: now.getFullYear(), month: m - 1 }
  const year: WrappedPeriod = { kind: 'year', year: m === 12 ? now.getFullYear() : now.getFullYear() - 1 }
  return { month, year }
}

// null = nessuna attività nel periodo: il Wrapped non esiste (l'entry point
// non lo propone nemmeno — un recap vuoto sarebbe solo triste).
export function buildWrapped(activities: Activity[], period: WrappedPeriod): WrappedData | null {
  const { start, end } = periodRange(period)
  const inPeriod = activities.filter((a) => {
    const d = parseISO(a.date)
    return d >= start && d < end
  })
  if (inPeriod.length === 0) return null

  const minutes = inPeriod.reduce((s, a) => s + a.duration_min, 0)
  const calories = inPeriod.reduce((s, a) => s + (a.calories ?? 0), 0)
  const km = Math.round(inPeriod.reduce((s, a) => s + (a.distance_km ?? 0), 0) * 10) / 10

  const minutesByDay = new Map<string, number>()
  for (const a of inPeriod) {
    const key = format(parseISO(a.date), 'yyyy-MM-dd')
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + a.duration_min)
  }
  let busiestDay: { date: string; minutes: number } | null = null
  for (const [date, min] of minutesByDay) {
    if (!busiestDay || min > busiestDay.minutes) busiestDay = { date, minutes: min }
  }

  // Streak migliore DENTRO il periodo: giorni attivi consecutivi, senza
  // freeze né riposi — qui si celebrano le attività, come per le medaglie.
  const days = [...minutesByDay.keys()].sort()
  let bestStreak = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && differenceInCalendarDays(parseISO(days[i]), parseISO(days[i - 1])) === 1 ? run + 1 : 1
    if (run > bestStreak) bestStreak = run
  }

  const byType = new Map<ActivityType, number>()
  for (const a of inPeriod) byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
  const rankedTypes = [...byType.entries()].sort((a, b) => b[1] - a[1])
  const topSport = rankedTypes.length > 0
    ? {
        type: rankedTypes[0][0],
        label: ACTIVITY_OPTIONS.find((o) => o.value === rankedTypes[0][0])?.label ?? rankedTypes[0][0],
        sessions: rankedTypes[0][1],
      }
    : null

  const zones = buildZoneDistribution(inPeriod)
  const topZone = zones.reduce<ZoneDistributionPoint | null>(
    (best, z) => (z.minutes > (best?.minutes ?? 0) ? z : best),
    null,
  )

  const prevRange = periodRange(prevPeriod(period))
  const prevSessions = activities.filter((a) => {
    const d = parseISO(a.date)
    return d >= prevRange.start && d < prevRange.end
  }).length

  return {
    period,
    title: wrappedTitle(period),
    sessions: inPeriod.length,
    minutes,
    calories,
    km,
    activeDays: minutesByDay.size,
    distinctSports: byType.size,
    topSport,
    bestStreak,
    busiestDay,
    longestSessionMin: Math.max(...inPeriod.map((a) => a.duration_min)),
    zones,
    topZone,
    prevSessions,
  }
}
