import {
  eachDayOfInterval, eachMonthOfInterval, startOfDay, startOfWeek, startOfMonth,
  startOfYear, subWeeks, parseISO, format, min as minDate, differenceInCalendarWeeks,
} from 'date-fns'
import { it } from 'date-fns/locale'
import type { Activity } from '../types'
import type { WeightLog } from '../types'
import { ACTIVITY_OPTIONS } from './constants'
import { ZONES, getZoneForActivity, type ZoneId } from './zones'
import statsI18n from './i18n/stats'

// Aggregazioni pure per la pagina Statistiche. Tutte le funzioni accettano
// `now` come parametro per poter essere testate con date fisse.

export type TrendPeriod = 'week' | 'month' | 'year' | 'all'

export interface TrendPoint {
  key: string
  label: string
  sessions: number
  minutes: number
  calories: number
  km: number
}

function emptyPoint(key: string, label: string): TrendPoint {
  return { key, label, sessions: 0, minutes: 0, calories: 0, km: 0 }
}

function accumulate(point: TrendPoint, a: Activity) {
  point.sessions += 1
  point.minutes += a.duration_min
  point.calories += a.calories ?? 0
  point.km += a.distance_km ?? 0
}

// Serie temporale per il grafico "Andamento": bucket giornalieri per
// settimana/mese, mensili per anno/sempre. Include i bucket vuoti così
// l'asse del tempo non ha buchi.
export function buildTrendSeries(
  activities: Activity[],
  period: TrendPeriod,
  now: Date = new Date(),
): TrendPoint[] {
  const byDay = period === 'week' || period === 'month'
  let start: Date
  if (period === 'week') start = startOfWeek(now, { weekStartsOn: 1 })
  else if (period === 'month') start = startOfMonth(now)
  else if (period === 'year') start = startOfYear(now)
  else {
    if (activities.length === 0) return []
    start = startOfMonth(minDate(activities.map((a) => parseISO(a.date))))
  }

  const buckets = byDay
    ? eachDayOfInterval({ start, end: now }).map((d) => emptyPoint(
        format(d, 'yyyy-MM-dd'),
        period === 'week' ? format(d, 'EEE', { locale: it }) : format(d, 'd'),
      ))
    : eachMonthOfInterval({ start, end: now }).map((d) => emptyPoint(
        format(d, 'yyyy-MM'),
        period === 'year' ? format(d, 'MMM', { locale: it }) : format(d, 'MMM yy', { locale: it }),
      ))

  const index = new Map(buckets.map((b) => [b.key, b]))
  for (const a of activities) {
    const key = format(parseISO(a.date), byDay ? 'yyyy-MM-dd' : 'yyyy-MM')
    const bucket = index.get(key)
    if (bucket) accumulate(bucket, a)
  }
  for (const b of buckets) b.km = Math.round(b.km * 10) / 10
  return buckets
}

// Distribuzione delle sessioni sul giorno della settimana (lun→dom, sempre
// tutti e 7 i giorni, in ordine fisso).
export interface WeekdayPoint { label: string; sessions: number }

export function buildWeekdayDistribution(activities: Activity[]): WeekdayPoint[] {
  const counts = new Array(7).fill(0)
  for (const a of activities) {
    // getDay: 0 = domenica → riportato su indice 0 = lunedì
    counts[(parseISO(a.date).getDay() + 6) % 7]++
  }
  return statsI18n.weekdayLabels.map((label, i) => ({ label, sessions: counts[i] }))
}

// Ultime N settimane (lunedì→domenica) con conteggio sessioni e flag
// obiettivo raggiunto: alimenta il grafico "Obiettivo vs reale".
export interface WeekGoalPoint {
  key: string
  label: string
  sessions: number
  met: boolean
}

export function buildWeeklyGoalSeries(
  activities: Activity[],
  weeklyGoal: number,
  numWeeks = 8,
  now: Date = new Date(),
): WeekGoalPoint[] {
  const currentWeek = startOfWeek(now, { weekStartsOn: 1 })
  const weeks: WeekGoalPoint[] = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(currentWeek, i)
    weeks.push({
      key: format(weekStart, 'yyyy-MM-dd'),
      label: format(weekStart, 'd MMM', { locale: it }),
      sessions: 0,
      met: false,
    })
  }
  const index = new Map(weeks.map((w) => [w.key, w]))
  for (const a of activities) {
    const key = format(startOfWeek(parseISO(a.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const week = index.get(key)
    if (week) week.sessions++
  }
  for (const w of weeks) w.met = w.sessions >= weeklyGoal
  return weeks
}

// Serie settimanale che affianca peso medio e minuti di allenamento (per i
// due mini-grafici impilati "Peso e allenamento" — stesso asse X, mai
// doppio asse Y sullo stesso grafico).
export interface WeightWeekPoint {
  key: string
  label: string
  weightKg: number | null
  minutes: number
}

export function buildWeightTrainingSeries(
  activities: Activity[],
  weightLogs: WeightLog[],
  numWeeks = 12,
  now: Date = new Date(),
): WeightWeekPoint[] {
  const currentWeek = startOfWeek(now, { weekStartsOn: 1 })
  const weeks: (WeightWeekPoint & { weightSum: number; weightCount: number })[] = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(currentWeek, i)
    weeks.push({
      key: format(weekStart, 'yyyy-MM-dd'),
      label: format(weekStart, 'd MMM', { locale: it }),
      weightKg: null,
      minutes: 0,
      weightSum: 0,
      weightCount: 0,
    })
  }
  const index = new Map(weeks.map((w) => [w.key, w]))
  const weekKey = (iso: string) =>
    format(startOfWeek(startOfDay(parseISO(iso)), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  for (const a of activities) {
    const week = index.get(weekKey(a.date))
    if (week) week.minutes += a.duration_min
  }
  for (const log of weightLogs) {
    const week = index.get(weekKey(log.logged_at))
    if (week) {
      week.weightSum += log.weight_kg
      week.weightCount++
    }
  }
  return weeks.map(({ key, label, minutes, weightSum, weightCount }) => ({
    key,
    label,
    minutes,
    weightKg: weightCount > 0 ? Math.round((weightSum / weightCount) * 10) / 10 : null,
  }))
}

// Distribuzione dei minuti allenati per zona di intensità (lib/zones.ts,
// soglie derivate dal MET di ogni tipo di attività). Alimenta la barra
// "spettro" della pagina Statistiche — prima applicazione visibile del
// sistema Zone (roadmap v2, pillar 01).
export interface ZoneDistributionPoint {
  zoneId: ZoneId
  label: string
  cssVar: string
  minutes: number
  pct: number
}

export function buildZoneDistribution(activities: Activity[]): ZoneDistributionPoint[] {
  const minutesByZone = new Map<ZoneId, number>(ZONES.map((z) => [z.id, 0]))
  let totalMinutes = 0
  for (const a of activities) {
    const zone = getZoneForActivity(a.type)
    minutesByZone.set(zone.id, (minutesByZone.get(zone.id) ?? 0) + a.duration_min)
    totalMinutes += a.duration_min
  }
  return ZONES.map((z) => {
    const minutes = minutesByZone.get(z.id) ?? 0
    return {
      zoneId: z.id,
      label: z.label,
      cssVar: z.cssVar,
      minutes,
      pct: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    }
  })
}

// Anno in pixel (roadmap v3, pilastro 01 punto 3): un quadratino per giorno
// dell'anno, colorato con la zona di intensità dominante di quel giorno (la
// zona con più minuti; a parità vince la più intensa). Colonne = settimane
// lun→dom, come le heatmap dei contributi.
export interface YearPixel {
  date: string // yyyy-MM-dd
  zoneId: ZoneId | null // null = giorno senza attività
  minutes: number
  future: boolean
}

export interface YearPixelsGrid {
  year: number
  // Una colonna per settimana; null = casella fuori dall'anno (bordi).
  weeks: (YearPixel | null)[][]
  // Iniziale del mese → colonna in cui cade il suo giorno 1.
  monthTicks: { label: string; weekIndex: number }[]
  activeDays: number
}

export function buildYearPixels(
  activities: Activity[],
  year: number,
  now: Date = new Date(),
): YearPixelsGrid {
  const minutesByDay = new Map<string, Map<ZoneId, number>>()
  for (const a of activities) {
    const d = parseISO(a.date)
    if (d.getFullYear() !== year) continue
    const key = format(d, 'yyyy-MM-dd')
    const zones = minutesByDay.get(key) ?? new Map<ZoneId, number>()
    const zone = getZoneForActivity(a.type)
    zones.set(zone.id, (zones.get(zone.id) ?? 0) + a.duration_min)
    minutesByDay.set(key, zones)
  }

  const first = new Date(year, 0, 1)
  const last = new Date(year, 11, 31)
  const firstWeekStart = startOfWeek(first, { weekStartsOn: 1 })
  const totalWeeks = differenceInCalendarWeeks(last, firstWeekStart, { weekStartsOn: 1 }) + 1
  const weeks: (YearPixel | null)[][] = Array.from({ length: totalWeeks }, () => new Array(7).fill(null))
  const today = startOfDay(now)

  let activeDays = 0
  for (const day of eachDayOfInterval({ start: first, end: last })) {
    const weekIndex = differenceInCalendarWeeks(day, firstWeekStart, { weekStartsOn: 1 })
    const dayIndex = (day.getDay() + 6) % 7 // 0 = lunedì
    const key = format(day, 'yyyy-MM-dd')
    const zones = minutesByDay.get(key)
    let zoneId: ZoneId | null = null
    let minutes = 0
    if (zones) {
      for (const [id, min] of zones) {
        minutes += min
        if (zoneId === null || min > zones.get(zoneId)! || (min === zones.get(zoneId)! && id > zoneId)) {
          zoneId = id
        }
      }
      activeDays++
    }
    weeks[weekIndex][dayIndex] = { date: key, zoneId, minutes, future: day > today }
  }

  const monthTicks = statsI18n.monthInitials.map((label, m) => ({
    label,
    weekIndex: differenceInCalendarWeeks(new Date(year, m, 1), firstWeekStart, { weekStartsOn: 1 }),
  }))

  return { year, weeks, monthTicks, activeDays }
}

// Formato compatto per durate: "45m" sotto l'ora, "2h 10m" sopra. Usato da
// Statistiche, insight, Wrapped e card condivisibili — un'unica scrittura
// perché il formato resti identico ovunque.
export function formatMinutesCompact(min: number): string {
  const m = Math.round(min)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

// Export CSV pensato per Excel/Sheets in italiano: separatore ";" e
// decimali con la virgola (il locale it usa ";" come separatore di lista).
export function activitiesToCsv(activities: Activity[]): string {
  const header = statsI18n.csv.header
  const labelOf = new Map(ACTIVITY_OPTIONS.map((o) => [o.value, o.label]))

  const escape = (value: string) =>
    /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

  const rows = [...activities]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => {
      const d = parseISO(a.date)
      return [
        format(d, 'dd/MM/yyyy'),
        format(d, 'HH:mm'),
        labelOf.get(a.type) ?? a.type,
        String(a.duration_min),
        a.calories != null ? String(a.calories) : '',
        a.distance_km != null ? String(a.distance_km).replace('.', ',') : '',
        String(a.credits_earned),
        a.notes ? escape(a.notes) : '',
      ].join(';')
    })

  return [header.join(';'), ...rows].join('\r\n')
}
