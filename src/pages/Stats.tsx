import { useState, useMemo } from 'react'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, format, isAfter, isEqual } from 'date-fns'
import { it } from 'date-fns/locale'
import { AlertTriangle, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActivities } from '../hooks/useActivities'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { buildGymRecords, buildExerciseProgression, progressionExercises } from '../lib/exerciseSets'
import { useProfile } from '../hooks/useProfile'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import {
  buildTrendSeries, buildWeekdayDistribution, buildWeeklyGoalSeries,
  buildWeightTrainingSeries, buildZoneDistribution, buildYearPixels,
  activitiesToCsv, formatMinutesCompact,
} from '../lib/stats'
import { buildTrainingLoadSeries, loadJumpPct } from '../lib/trainingLoad'
import { predictRaceTimes, formatRaceTime } from '../lib/racePredictor'
import { buildWrapped, defaultWrappedPeriods, type WrappedData } from '../lib/wrapped'
import { downloadAsCsv } from '../lib/dataExport'
import { buildRacePredictorShareData, shareCardImage } from '../lib/shareCard'
import { haptic } from '../lib/haptics'
import type { Activity } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import AnalisiTabs from '../components/AnalisiTabs'
import AnimatedNumber from '../components/AnimatedNumber'
import ActivityIcon from '../components/ActivityIcon'
import InsightsCard from '../components/InsightsCard'
import ExerciseProgressionChart from '../components/ExerciseProgressionChart'
import AreaTrendChart from '../components/AreaTrendChart'
import BarStatChart from '../components/BarStatChart'
import DonutChart from '../components/DonutChart'
import WeightLineChart from '../components/WeightLineChart'
import EmptyState from '../components/EmptyState'
import WrappedOverlay from '../components/WrappedOverlay'
import stats from '../lib/i18n/stats'
import wrappedText from '../lib/i18n/wrapped'
import heatmapText from '../lib/i18n/heatmap'
import segmentsText from '../lib/i18n/segments'
import shareText from '../lib/i18n/share'

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: stats.periods.today     },
  { value: 'week',   label: stats.periods.week       },
  { value: 'month',  label: stats.periods.month      },
  { value: 'year',   label: stats.periods.year       },
  { value: 'all',    label: stats.periods.all        },
]

type Metric = 'minutes' | 'sessions' | 'calories' | 'km'

const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: 'minutes',  label: stats.metrics.minutes.label,  unit: stats.metrics.minutes.unit  },
  { value: 'sessions', label: stats.metrics.sessions.label, unit: stats.metrics.sessions.unit },
  { value: 'calories', label: stats.metrics.calories.label, unit: stats.metrics.calories.unit },
  { value: 'km',       label: stats.metrics.km.label,       unit: stats.metrics.km.unit       },
]

// Sfumature derivate dall'accento del tema attivo (rosso, blu, verde o viola):
// la torta resta monocromatica e coerente qualunque tema sia attivo.
const PIE_COLORS = [
  'var(--red)',
  'color-mix(in srgb, var(--red) 75%, white)',
  'color-mix(in srgb, var(--red) 55%, white)',
  'var(--red-dark)',
  'color-mix(in srgb, var(--red) 35%, white)',
  'color-mix(in srgb, var(--red) 75%, black)',
  'color-mix(in srgb, var(--red) 55%, black)',
  'color-mix(in srgb, var(--red) 45%, white)',
  'color-mix(in srgb, var(--red) 25%, white)',
  'color-mix(in srgb, var(--red) 40%, black)',
]

function filterByPeriod(activities: Activity[], period: Period): Activity[] {
  const now = new Date()
  const cutoffs: Record<Period, Date | null> = {
    today:  startOfDay(now),
    week:   startOfWeek(now, { weekStartsOn: 1 }),
    month:  startOfMonth(now),
    year:   startOfYear(now),
    all:    null,
  }
  const cutoff = cutoffs[period]
  if (!cutoff) return activities
  return activities.filter((a) => {
    const d = parseISO(a.date)
    return isAfter(d, cutoff) || isEqual(d, cutoff)
  })
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card text-center count-up">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bebas text-3xl text-white">{value}</p>
      {sub && <p className="text-xs text-[var(--red)]">{sub}</p>}
    </div>
  )
}

export default function StatsPage() {
  const { activities, loading, refetch: refetchActivities } = useActivities()
  const { logs: weightLogs } = useWeightLogs()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('week')
  const [metric, setMetric] = useState<Metric>('minutes')
  const [openWrapped, setOpenWrapped] = useState<WrappedData | null>(null)
  const { indicator: pullIndicator, handlers: pullHandlers } = usePullToRefresh(refetchActivities)
  const [sharingRace, setSharingRace] = useState(false)

  const filtered = useMemo(() => filterByPeriod(activities, period), [activities, period])

  const totalSessions = filtered.length
  const totalMin = filtered.reduce((s, a) => s + a.duration_min, 0)
  const totalCal = filtered.reduce((s, a) => s + (a.calories ?? 0), 0)
  const totalKm = filtered.reduce((s, a) => s + (a.distance_km ?? 0), 0)

  // Most frequent activity
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of filtered) map[a.type] = (map[a.type] ?? 0) + 1
    return map
  }, [filtered])

  const topActivity = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
  const topOpt = topActivity ? ACTIVITY_OPTIONS.find((o) => o.value === topActivity[0]) : null

  // Andamento nel tempo (bucket giornalieri o mensili a seconda del periodo)
  const trendData = useMemo(
    () => period === 'today' ? [] : buildTrendSeries(filtered, period),
    [filtered, period]
  )
  const availableMetrics = useMemo(() => METRICS.filter(({ value }) => {
    if (value === 'calories') return totalCal > 0
    if (value === 'km') return totalKm > 0
    return true
  }), [totalCal, totalKm])
  const effectiveMetric = availableMetrics.some((m) => m.value === metric) ? metric : 'minutes'
  const metricInfo = METRICS.find((m) => m.value === effectiveMetric)!

  // Abitudini: distribuzione delle sessioni sul giorno della settimana
  const weekdayData = useMemo(() => buildWeekdayDistribution(filtered), [filtered])

  // Obiettivo vs reale sulle ultime 8 settimane (usa tutte le attività:
  // la finestra è fissa, indipendente dal filtro periodo)
  const weeklyGoal = profile?.weekly_goal ?? 3
  const goalData = useMemo(() => buildWeeklyGoalSeries(activities, weeklyGoal), [activities, weeklyGoal])
  const weeksMet = goalData.filter((w) => w.met).length

  // Peso e allenamento sulle ultime 12 settimane
  const weightData = useMemo(
    () => buildWeightTrainingSeries(activities, weightLogs),
    [activities, weightLogs]
  )
  const weightPoints = weightData.filter((w) => w.weightKg != null).length

  // Pie chart data
  const pieData = useMemo(() =>
    Object.entries(typeCounts)
      .map(([type, count]) => {
        const opt = ACTIVITY_OPTIONS.find((o) => o.value === type)
        return { name: opt?.label ?? type, value: count }
      })
      .sort((a, b) => b.value - a.value),
    [typeCounts]
  )

  // Spettro di intensità: minuti per zona (lib/zones.ts), prima applicazione
  // visibile del sistema Zone (roadmap v2, pillar 01)
  const zoneData = useMemo(() => buildZoneDistribution(filtered), [filtered])

  // Anno in pixel (roadmap v3, pilastro 01): griglia annuale zone-colored.
  // Vista fissa sull'anno corrente, non segue il filtro periodo.
  const yearGrid = useMemo(() => buildYearPixels(activities, new Date().getFullYear()), [activities])

  // Carico settimanale session-RPE (roadmap v3, pilastro 02): finestra fissa
  // di 8 settimane come "Obiettivo vs reale", non segue il filtro periodo.
  const loadSeries = useMemo(() => buildTrainingLoadSeries(activities), [activities])
  const loadWeeksWithData = useMemo(() => loadSeries.filter((w) => w.load > 0).length, [loadSeries])
  const loadJump = useMemo(() => loadJumpPct(loadSeries), [loadSeries])
  const loadTotals = useMemo(
    () => loadSeries.reduce(
      (acc, w) => ({ withRpe: acc.withRpe + w.sessionsWithRpe, total: acc.total + w.sessions }),
      { withRpe: 0, total: 0 },
    ),
    [loadSeries],
  )

  // PisoZone Wrapped: il mese appena concluso e l'anno (quello concluso, o il
  // corrente da dicembre). null = nessuna attività nel periodo → niente bottone.
  const wrappedPeriods = useMemo(() => defaultWrappedPeriods(), [])
  const monthWrapped = useMemo(() => buildWrapped(activities, wrappedPeriods.month), [activities, wrappedPeriods])
  const yearWrapped = useMemo(() => buildWrapped(activities, wrappedPeriods.year), [activities, wrappedPeriods])

  // Record palestra: carico massimo di sempre per esercizio (exercise_sets,
  // v32) — non segue il filtro periodo, un PR è per definizione all-time
  const { rows: exerciseHistory } = useExerciseHistory(true)
  const gymRecords = useMemo(() => buildGymRecords(exerciseHistory), [exerciseHistory])

  // Progressione carichi (roadmap v3, pilastro 01): serie del massimo per
  // giornata dell'esercizio scelto — i candidati hanno almeno 2 giornate.
  const progressionOptions = useMemo(() => progressionExercises(exerciseHistory), [exerciseHistory])
  const [progressionPick, setProgressionPick] = useState<string | null>(null)
  const selectedExercise = progressionPick && progressionOptions.includes(progressionPick)
    ? progressionPick
    : progressionOptions[0] ?? null
  const progressionData = useMemo(
    () => (selectedExercise ? buildExerciseProgression(exerciseHistory, selectedExercise) : []),
    [exerciseHistory, selectedExercise],
  )

  // Records
  const longestSession = filtered.reduce((best, a) => a.duration_min > (best?.duration_min ?? 0) ? a : best, null as Activity | null)
  const mostCalories = filtered.reduce((best, a) => (a.calories ?? 0) > (best?.calories ?? 0) ? a : best, null as Activity | null)
  const longestDistance = filtered.reduce((best, a) => (a.distance_km ?? 0) > (best?.distance_km ?? 0) ? a : best, null as Activity | null)

  // Passo gara previsto (roadmap v4, pilastro 01): sempre sugli ultimi 90
  // giorni veri, indipendente dal filtro periodo della pagina.
  const racePrediction = useMemo(() => predictRaceTimes(activities), [activities])
  const [raceShareError, setRaceShareError] = useState(false)

  // Card condivisibile (roadmap v5, pilastro 03): era l'unica flagship v4
  // rimasta senza un'immagine da mostrare, come attività/Wrapped/Prontezza.
  const handleShareRacePrediction = async () => {
    if (!racePrediction) return
    setSharingRace(true)
    setRaceShareError(false)
    const subtitle = stats.racePredictor.subheading(racePrediction.referenceKm, formatRaceTime(racePrediction.referenceMinutes))
    const outcome = await shareCardImage(buildRacePredictorShareData(racePrediction, subtitle), 'pisozone-stima-gara.png')
    setSharingRace(false)
    if (outcome === 'failed') setRaceShareError(true)
    else if (outcome !== 'cancelled') haptic('success')
  }

  // Heatmap personale (roadmap v4, pilastro 02): la card compare solo se
  // esiste almeno un'attività tracciata via GPS, la pagina vera fa il fetch
  // pesante di tutti i percorsi solo quando l'utente la apre davvero.
  const hasGpsRoutes = useMemo(() => activities.some((a) => a.gps_tracked), [activities])
  const busiestDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of filtered) {
      const key = format(parseISO(a.date), 'yyyy-MM-dd')
      map.set(key, (map.get(key) ?? 0) + a.duration_min)
    }
    let best: { date: string; minutes: number } | null = null
    for (const [date, minutes] of map) {
      if (!best || minutes > best.minutes) best = { date, minutes }
    }
    return best
  }, [filtered])

  function handleExportCsv() {
    const filename = `pisozone-attivita-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    downloadAsCsv(activitiesToCsv(filtered), filename)
  }

  if (loading) return (
    <div className="page-enter p-4 space-y-4">
      <SkeletonCard lines={2} />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  )

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto" {...pullHandlers}>
      {pullIndicator}
      <div className="pt-3">
        <AnalisiTabs />
      </div>

      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              period === value
                ? 'bg-[var(--red)] text-[white] shadow-lg'
                : 'bg-[var(--grey)] text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={stats.cards.sessions} value={<AnimatedNumber value={totalSessions} />} />
        <StatCard
          label={stats.cards.totalMinutes}
          value={<AnimatedNumber value={totalMin} format={formatMinutesCompact} />}
        />
        <StatCard
          label={stats.cards.calories}
          value={totalCal > 0
            ? <AnimatedNumber value={totalCal} format={(n) => `${Math.round(n).toLocaleString()} kcal`} />
            : stats.cards.emptyValue}
        />
        <StatCard
          label={stats.cards.km}
          value={totalKm > 0
            ? <AnimatedNumber value={totalKm} format={(n) => `${n.toFixed(1)} km`} />
            : stats.cards.emptyValue}
        />
      </div>

      {/* Insight personalizzati: finestre temporali proprie, non seguono il filtro */}
      <InsightsCard activities={activities} weeklyGoal={weeklyGoal} />

      {/* PisoZone Wrapped: recap del mese/anno concluso, da rivivere e condividere */}
      {(monthWrapped || yearWrapped) && (
        <div className="card card-hero">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{wrappedText.entry.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">{wrappedText.entry.description}</p>
          <div className="flex gap-2">
            {monthWrapped && (
              <button type="button" className="btn-primary flex-1 py-2 text-sm" onClick={() => setOpenWrapped(monthWrapped)}>
                {wrappedText.entry.monthButton(monthWrapped.title)}
              </button>
            )}
            {yearWrapped && (
              <button type="button" className="btn-primary flex-1 py-2 text-sm" onClick={() => setOpenWrapped(yearWrapped)}>
                {wrappedText.entry.yearButton(yearWrapped.title)}
              </button>
            )}
          </div>
        </div>
      )}

      {topOpt && (
        <div className="card flex items-center gap-3">
          <span className="text-[var(--red)] flex-shrink-0">
            <ActivityIcon type={topOpt.value} size={40} />
          </span>
          <div>
            <p className="text-xs text-gray-400">{stats.topActivity.label}</p>
            <p className="font-bebas text-2xl text-white">{topOpt.label}</p>
            <p className="text-xs text-[var(--red)]">{stats.topActivity.sessionsCount(topActivity[1])}</p>
          </div>
        </div>
      )}

      {/* Andamento nel tempo */}
      {trendData.length > 1 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-2">{stats.trend.heading}</h2>
          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {availableMetrics.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMetric(value)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  effectiveMetric === value
                    ? 'bg-[var(--red)] text-[white]'
                    : 'bg-[var(--grey)] text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <AreaTrendChart
            points={trendData.map((d) => ({ label: d.label, value: d[effectiveMetric] }))}
            ariaLabel={stats.trend.chartAriaLabel}
            formatValue={(v) => `${v}${metricInfo.unit}`}
          />
        </div>
      )}

      {/* Abitudini: giorni della settimana (solo su finestre multi-settimana) */}
      {(period === 'month' || period === 'year' || period === 'all') && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{stats.weekdays.heading}</h2>
          <BarStatChart
            items={weekdayData.map((d) => ({ key: d.label, label: d.label, value: d.sessions }))}
            ariaLabel={stats.weekdays.chartAriaLabel}
            height={144}
          />
        </div>
      )}

      {/* Obiettivo vs reale — finestra fissa: ultime 8 settimane */}
      {activities.length > 0 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.goal.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {stats.goal.reachedBefore}<span className="text-[var(--red)] font-semibold">{weeksMet}</span>{stats.goal.reachedAfter}
          </p>
          <BarStatChart
            items={goalData.map((w) => ({
              key: w.key,
              label: w.label,
              value: w.sessions,
              color: w.met ? 'var(--red)' : 'rgba(var(--accent-rgb),0.35)',
            }))}
            referenceValue={weeklyGoal}
            referenceLabel={stats.goal.referenceLabel(weeklyGoal)}
            ariaLabel={stats.goal.chartAriaLabel}
            height={144}
          />
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{stats.pie.heading}</h2>
          <DonutChart
            slices={pieData.map((d, i) => ({ key: d.name, label: d.name, value: d.value, color: PIE_COLORS[i % PIE_COLORS.length] }))}
            ariaLabel={stats.pie.chartAriaLabel}
          />
        </div>
      )}

      {/* Spettro di intensità */}
      {filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.zones.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">{stats.zones.subtitle}</p>
          <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
            {zoneData.filter((z) => z.minutes > 0).map((z) => (
              <div key={z.zoneId} style={{ width: `${z.pct}%`, background: z.cssVar }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {zoneData.map((z) => (
              <div key={z.zoneId} className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: z.cssVar }} />
                <span className="text-xs text-gray-400 flex-1 truncate">{z.label}</span>
                <span className="text-xs font-semibold text-white flex-shrink-0">{z.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carico settimanale session-RPE: sforzo percepito × minuti (BarStatChart,
          il primo grafico in puro CSS della roadmap v3 — il modello che il
          pilastro 04 ha esteso a tutta la pagina al posto di recharts) */}
      {loadWeeksWithData >= 2 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.trainingLoad.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">{stats.trainingLoad.subtitle}</p>
          <BarStatChart
            items={loadSeries.map((w, i) => ({
              key: w.key,
              label: w.label,
              value: w.load,
              color: i === loadSeries.length - 1 ? 'var(--red)' : 'rgba(var(--accent-rgb),0.45)',
            }))}
            ariaLabel={stats.trainingLoad.chartAriaLabel}
            height={108}
          />
          {/* Ambra semantica di avvertimento (come la scala BMI), non il tema */}
          {loadJump != null && (
            <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg text-xs leading-relaxed" style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {stats.trainingLoad.jumpWarning(loadJump)}
            </div>
          )}
          {loadTotals.withRpe < loadTotals.total && (
            <p className="text-[10px] text-gray-600 mt-2">
              {stats.trainingLoad.coverageHint(loadTotals.withRpe, loadTotals.total)}
            </p>
          )}
        </div>
      )}

      {/* Anno in pixel: un quadratino per giorno dell'anno, zona dominante */}
      {yearGrid.activeDays > 0 && filtered.length > 0 && (
        <div className="card">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.yearPixels.heading(yearGrid.year)}</h2>
            <span className="text-xs text-gray-400 flex-shrink-0">{stats.yearPixels.activeDays(yearGrid.activeDays)}</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">{stats.yearPixels.subtitle}</p>
          <div className="overflow-x-auto pb-1" role="img" aria-label={stats.yearPixels.gridAriaLabel(yearGrid.year)}>
            {/* Iniziali dei mesi: una cella per settimana, l'etichetta cade
                sulla colonna che contiene il giorno 1 del mese. */}
            <div className="flex gap-[2px] mb-1">
              {yearGrid.weeks.map((_, i) => {
                const tick = yearGrid.monthTicks.find((t) => t.weekIndex === i)
                return (
                  <span key={i} className="w-2 flex-shrink-0 text-[8px] leading-none text-gray-500 overflow-visible whitespace-nowrap">
                    {tick?.label ?? ''}
                  </span>
                )
              })}
            </div>
            <div className="flex gap-[2px]">
              {yearGrid.weeks.map((week, i) => (
                <div key={i} className="flex flex-col gap-[2px]">
                  {week.map((day, j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-[2px] flex-shrink-0"
                      style={{
                        background: day == null
                          ? 'transparent'
                          : day.zoneId != null
                          ? `var(--zone-${day.zoneId})`
                          : 'var(--grey)',
                        opacity: day?.future ? 0.35 : 1,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
            {zoneData.map((z) => (
              <span key={z.zoneId} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: z.cssVar }} />
                {z.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: 'var(--grey)' }} />
              {stats.yearPixels.restLegend}
            </span>
          </div>
        </div>
      )}

      {/* Peso e allenamento: due grafici impilati sullo stesso asse settimanale */}
      {weightPoints >= 2 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.weightTraining.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {stats.weightTraining.subtitle}
          </p>
          <p className="text-xs text-gray-400 mb-1">{stats.weightTraining.weightLabel}</p>
          <WeightLineChart
            points={weightData.map((w) => ({ label: w.label, value: w.weightKg }))}
            ariaLabel={stats.weightTraining.weightChartAriaLabel}
            formatValue={(v) => `${v} kg`}
            height={110}
          />
          <p className="text-xs text-gray-400 mb-1 mt-2">{stats.weightTraining.trainingLabel}</p>
          <BarStatChart
            items={weightData.map((w) => ({ key: w.key, label: w.label, value: w.minutes }))}
            ariaLabel={stats.weightTraining.trainingChartAriaLabel}
            color="rgba(var(--accent-rgb),0.55)"
            formatValue={(v) => `${v}min`}
            height={100}
          />
        </div>
      )}

      {/* Records */}
      {(longestSession || mostCalories) && (
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{stats.records.heading}</h2>
          {longestSession && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{stats.records.longestSession}</p>
                <p className="text-white font-medium">
                  {Math.floor(longestSession.duration_min / 60)}h {longestSession.duration_min % 60}min
                </p>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>
          )}
          {mostCalories && (mostCalories.calories ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{stats.records.mostCalories}</p>
                <p className="text-white font-medium">{mostCalories.calories} kcal</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>
          )}
          {longestDistance && (longestDistance.distance_km ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{stats.records.longestDistance}</p>
                <p className="text-white font-medium">{longestDistance.distance_km} km</p>
              </div>
              <span className="text-2xl">📏</span>
            </div>
          )}
          {busiestDay && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{stats.records.busiestDay}</p>
                <p className="text-white font-medium">
                  {format(parseISO(busiestDay.date), 'd MMMM yyyy', { locale: it })} · {stats.records.busiestDayDuration(busiestDay.minutes)}
                </p>
              </div>
              <span className="text-2xl">📆</span>
            </div>
          )}
        </div>
      )}

      {/* Passo gara previsto (roadmap v4, pilastro 01): stima Riegel dal
          miglior passo corso negli ultimi 90 giorni, indipendente dal
          filtro periodo. Nessuna card se non ci sono corse comparabili. */}
      {racePrediction && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{stats.racePredictor.heading}</h2>
            <button
              type="button"
              onClick={handleShareRacePrediction}
              disabled={sharingRace}
              aria-label={shareText.racePredictorButton}
              className="p-1.5 -mr-1.5 text-gray-500 hover:text-white disabled:opacity-40 tap flex-shrink-0"
            >
              <Share2 size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {stats.racePredictor.subheading(racePrediction.referenceKm, formatRaceTime(racePrediction.referenceMinutes))}
          </p>
          <div className="grid grid-cols-2 gap-3" role="img" aria-label={stats.racePredictor.chartAriaLabel}>
            {racePrediction.predictions.map((p) => (
              <div key={p.key} className="rounded-xl p-3" style={{ background: 'var(--grey)' }}>
                <p className="text-xs text-gray-400">{p.label}</p>
                <p className="font-bebas text-2xl text-white leading-tight">{formatRaceTime(p.minutes)}</p>
              </div>
            ))}
          </div>
          {raceShareError && <p className="text-[11px]" style={{ color: 'var(--zone-4)' }}>{shareText.error}</p>}
        </div>
      )}

      {/* Heatmap personale (roadmap v4, pilastro 02): entry point verso /heatmap,
          il fetch di tutti i percorsi avviene solo lì, non qui. */}
      {hasGpsRoutes && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{heatmapText.entryCard.heading}</h2>
          <p className="text-xs text-gray-400 mt-1">{heatmapText.entryCard.subtitle}</p>
          <button
            type="button"
            className="btn-primary w-full py-2 text-sm mt-3"
            onClick={() => navigate('/heatmap')}
          >
            {heatmapText.entryCard.button}
          </button>
        </div>
      )}

      {/* Segmenti personali (roadmap v4, pilastro 02): stesso entry point
          condizionale della heatmap, la creazione vera avviene da ActivityEditModal. */}
      {hasGpsRoutes && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{segmentsText.page.entryCard.heading}</h2>
          <p className="text-xs text-gray-400 mt-1">{segmentsText.page.entryCard.subtitle}</p>
          <button
            type="button"
            className="btn-primary w-full py-2 text-sm mt-3"
            onClick={() => navigate('/segments')}
          >
            {segmentsText.page.entryCard.button}
          </button>
        </div>
      )}

      {/* Record palestra: massimali per esercizio dal log strutturato (v32) */}
      {gymRecords.length > 0 && filtered.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{stats.gymRecords.heading}</h2>
              <p className="text-xs text-gray-400 mt-1">{stats.gymRecords.subtitle}</p>
            </div>
            <span className="text-[var(--red)] flex-shrink-0">
              <ActivityIcon type="palestra" size={28} />
            </span>
          </div>
          {gymRecords.slice(0, 8).map((r) => (
            <div key={r.exercise} className="flex items-center justify-between gap-3">
              <p className="text-sm text-white font-medium truncate">{r.exercise}</p>
              <p className="font-bebas text-xl text-[var(--red)] flex-shrink-0">{stats.gymRecords.weightValue(r.weightKg)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progressione carichi: massimo per giornata dell'esercizio scelto */}
      {progressionData.length >= 2 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.progression.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">{stats.progression.subtitle}</p>
          {progressionOptions.length > 1 && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {progressionOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setProgressionPick(name)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedExercise === name
                      ? 'bg-[var(--red)] text-[white]'
                      : 'bg-[var(--grey)] text-gray-400'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <ExerciseProgressionChart points={progressionData} />
          <p className="text-xs text-gray-400 mt-2">
            {stats.progression.delta(
              Math.round((progressionData[progressionData.length - 1].weightKg - progressionData[0].weightKg) * 100) / 100,
            )}
          </p>
        </div>
      )}

      {/* Export CSV */}
      {filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.export.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {stats.export.description}
          </p>
          <button type="button" className="btn-primary w-full py-2 text-sm" onClick={handleExportCsv}>
            {stats.export.button(filtered.length)}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card py-10">
          <EmptyState
            icon={activities.length === 0 ? 'rocket' : 'magnifier'}
            title={activities.length === 0 ? stats.emptyState.titleNoActivities : stats.emptyState.titleNoDataInPeriod}
            hint={activities.length === 0
              ? stats.emptyState.descriptionNoActivities
              : stats.emptyState.descriptionNoDataInPeriod}
            cta={activities.length === 0 ? stats.emptyState.ctaFirstActivity : stats.emptyState.ctaLogActivity}
            onCta={() => navigate('/log')}
          />
        </div>
      )}

      {openWrapped && <WrappedOverlay data={openWrapped} onClose={() => setOpenWrapped(null)} />}
    </div>
  )
}
