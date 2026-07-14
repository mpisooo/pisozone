import { getDay, getHours, parseISO, startOfMonth, startOfWeek, subDays, subWeeks } from 'date-fns'
import type { Activity, ActivityType } from '../types'
import { ACTIVITY_OPTIONS } from './constants'
import { getZoneForActivity } from './zones'
import { formatMinutesCompact } from './stats'
import insightsText from './i18n/insights'

// Insight personalizzati (roadmap v2, pilastro 04): osservazioni derivate al
// volo dalle attività — niente stato, niente DB. Ogni regola ha una soglia
// minima di dati sotto la quale tace: meglio nessun insight che un insight
// banale. Le regole sono in ordine di priorità e si mostrano al massimo le
// prime MAX_INSIGHTS attive. `now` come parametro per test deterministici.

export interface Insight {
  key: string
  icon: string
  text: string
}

const MAX_INSIGHTS = 4

type DatedActivity = Activity & { _d: Date }

export function buildInsights(
  activities: Activity[],
  opts: { weeklyGoal: number; now?: Date },
): Insight[] {
  const now = opts.now ?? new Date()
  if (activities.length === 0) return []

  // Sotto le 5 attività qualunque statistica sarebbe rumore: un solo
  // insight di benvenuto che spiega cosa arriverà.
  if (activities.length < 5) {
    return [{ key: 'getting-started', icon: '🌱', text: insightsText.texts.gettingStarted(activities.length) }]
  }

  const out: Insight[] = []
  const push = (key: string, icon: string, text: string) => {
    if (out.length < MAX_INSIGHTS) out.push({ key, icon, text })
  }

  const acts: DatedActivity[] = activities.map((a) => ({ ...a, _d: parseISO(a.date) }))
  const between = (from: Date, to: Date) => acts.filter((x) => x._d >= from && x._d < to)
  const since = (from: Date) => acts.filter((x) => x._d >= from)
  const sumMin = (list: DatedActivity[]) => list.reduce((s, x) => s + x.duration_min, 0)
  const sumKm = (list: DatedActivity[]) => list.reduce((s, x) => s + (x.distance_km ?? 0), 0)

  // 1) Settimana record: la settimana corrente (da lunedì) supera già il
  //    massimo delle 11 precedenti — servono almeno 2 settimane passate con
  //    dati, o "record" non significherebbe niente.
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeek = since(weekStart)
  let prevWeeksWithData = 0
  let bestPrevWeekMin = 0
  for (let i = 1; i <= 11; i++) {
    const m = sumMin(between(subWeeks(weekStart, i), subWeeks(weekStart, i - 1)))
    if (m > 0) {
      prevWeeksWithData++
      if (m > bestPrevWeekMin) bestPrevWeekMin = m
    }
  }
  const thisWeekMin = sumMin(thisWeek)
  if (thisWeek.length >= 2 && prevWeeksWithData >= 2 && thisWeekMin > bestPrevWeekMin) {
    push('record-week', '🚀', insightsText.texts.recordWeek(formatMinutesCompact(thisWeekMin)))
  }

  // 2) Volume in crescita/calo: ultimi 7 giorni vs i 7 precedenti. Il calo è
  //    formulato con gentilezza — un insight non è una nota sul registro.
  const last7Min = sumMin(since(subDays(now, 7)))
  const prev7Min = sumMin(between(subDays(now, 14), subDays(now, 7)))
  if (prev7Min > 0 && last7Min > 0) {
    const delta = Math.round(((last7Min - prev7Min) / prev7Min) * 100)
    if (delta >= 25) push('volume-up', '📈', insightsText.texts.volumeUp(delta))
    else if (delta <= -30) push('volume-down', '🌤️', insightsText.texts.volumeDown)
  }

  // 3) Costanza: obiettivo settimanale centrato in almeno 3 delle ultime 4
  //    settimane complete (quella corrente è ancora in corso, non conta).
  if (opts.weeklyGoal >= 1) {
    let met = 0
    for (let i = 1; i <= 4; i++) {
      if (between(subWeeks(weekStart, i), subWeeks(weekStart, i - 1)).length >= opts.weeklyGoal) met++
    }
    if (met >= 3) push('consistency', '🎯', insightsText.texts.consistency(met))
  }

  // 4) Sport del mese: nel mese corrente uno sport stacca nettamente gli altri
  const monthActs = since(startOfMonth(now))
  const byType = new Map<ActivityType, number>()
  for (const x of monthActs) byType.set(x.type, (byType.get(x.type) ?? 0) + 1)
  const rankedTypes = [...byType.entries()].sort((a, b) => b[1] - a[1])
  if (rankedTypes.length > 0 && rankedTypes[0][1] >= 4 && (rankedTypes.length === 1 || rankedTypes[0][1] > rankedTypes[1][1])) {
    const label = ACTIVITY_OPTIONS.find((o) => o.value === rankedTypes[0][0])?.label ?? rankedTypes[0][0]
    push('top-sport', '🏆', insightsText.texts.topSport(label, rankedTypes[0][1]))
  }

  // 5) Giorno-abitudine: nelle ultime 8 settimane un giorno della settimana
  //    raccoglie nettamente più sessioni degli altri (vantaggio >= 2).
  const eightWeeks = since(subWeeks(now, 8))
  const dayCounts = new Array(7).fill(0) as number[]
  for (const x of eightWeeks) dayCounts[(getDay(x._d) + 6) % 7]++ // 0 = lunedì
  const rankedDays = [...dayCounts].sort((a, b) => b - a)
  if (rankedDays[0] >= 4 && rankedDays[0] >= rankedDays[1] + 2) {
    const bestDayIdx = dayCounts.indexOf(rankedDays[0])
    push('weekday-habit', '📅', insightsText.texts.weekdayHabit(insightsText.weekdayNames[bestDayIdx]))
  }

  // 6) Fascia oraria: negli ultimi 30 giorni una fascia raccoglie almeno il
  //    60% delle sessioni (mattina < 12, pomeriggio 12-16, sera dalle 17).
  const last30 = since(subDays(now, 30))
  if (last30.length >= 6) {
    const buckets = { morning: 0, afternoon: 0, evening: 0 }
    for (const x of last30) {
      const h = getHours(x._d)
      if (h < 12) buckets.morning++
      else if (h < 17) buckets.afternoon++
      else buckets.evening++
    }
    const icons = { morning: '🌅', afternoon: '☀️', evening: '🌙' } as const
    for (const k of ['morning', 'afternoon', 'evening'] as const) {
      if (buckets[k] / last30.length >= 0.6) {
        push('time-of-day', icons[k], insightsText.texts.timeOfDay[k])
        break
      }
    }
  }

  // 7) Chilometri in crescita: ultimi 30 giorni vs i 30 precedenti, con un
  //    minimo di 5 km per lato per non celebrare oscillazioni da nulla.
  const km30 = sumKm(last30)
  const kmPrev30 = sumKm(between(subDays(now, 60), subDays(now, 30)))
  if (km30 >= 5 && kmPrev30 >= 5) {
    const delta = Math.round(((km30 - kmPrev30) / kmPrev30) * 100)
    if (delta >= 20) push('km-up', '🛣️', insightsText.texts.kmUp(delta))
  }

  // 8) RPE alto: la settimana sta chiedendo molto — suggerisci recupero
  const withRpe = since(subDays(now, 7)).filter((x) => x.rpe != null)
  if (withRpe.length >= 3) {
    const avgRpe = withRpe.reduce((s, x) => s + (x.rpe ?? 0), 0) / withRpe.length
    if (avgRpe >= 8) push('rpe-high', '🔋', insightsText.texts.rpeHigh)
  }

  // 9) Zero recupero: negli ultimi 30 giorni quasi nessun minuto in zona 1
  if (last30.length >= 6) {
    const totalMin = sumMin(last30)
    const zone1Min = sumMin(last30.filter((x) => getZoneForActivity(x.type).id === 1))
    if (totalMin > 0 && zone1Min / totalMin < 0.1) push('zone-push', '🧘', insightsText.texts.zonePush)
  }

  // 10) Umore alto dopo l'allenamento (metriche percepite, v30)
  const withMood = last30.filter((x) => x.mood != null)
  if (withMood.length >= 5) {
    const avgMood = withMood.reduce((s, x) => s + (x.mood ?? 0), 0) / withMood.length
    if (avgMood >= 4) push('mood-high', '😄', insightsText.texts.moodHigh)
  }

  return out
}
