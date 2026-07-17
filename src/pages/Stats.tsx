import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line, ReferenceLine,
} from 'recharts'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, format, isAfter, isEqual } from 'date-fns'
import { it } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActivities } from '../hooks/useActivities'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { buildGymRecords, buildExerciseProgression, progressionExercises } from '../lib/exerciseSets'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../context/ThemeContext'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import {
  buildTrendSeries, buildWeekdayDistribution, buildWeeklyGoalSeries,
  buildWeightTrainingSeries, buildZoneDistribution, buildYearPixels,
  activitiesToCsv, formatMinutesCompact,
} from '../lib/stats'
import { buildTrainingLoadSeries, loadJumpPct } from '../lib/trainingLoad'
import { buildWrapped, defaultWrappedPeriods, type WrappedData } from '../lib/wrapped'
import { downloadAsCsv } from '../lib/dataExport'
import type { Activity } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import AnalisiTabs from '../components/AnalisiTabs'
import AnimatedNumber from '../components/AnimatedNumber'
import ActivityIcon from '../components/ActivityIcon'
import InsightsCard from '../components/InsightsCard'
import ExerciseProgressionChart from '../components/ExerciseProgressionChart'
import EmptyState from '../components/EmptyState'
import WrappedOverlay from '../components/WrappedOverlay'
import stats from '../lib/i18n/stats'
import wrappedText from '../lib/i18n/wrapped'

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
  const { activities, loading } = useActivities()
  const { logs: weightLogs } = useWeightLogs()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [period, setPeriod] = useState<Period>('week')
  const [metric, setMetric] = useState<Metric>('minutes')
  const [openWrapped, setOpenWrapped] = useState<WrappedData | null>(null)

  const chartGrid   = theme === 'dark' ? '#2a2a2a' : '#E0E0E0'
  const chartTick   = theme === 'dark' ? '#9ca3af' : '#777777'
  const tooltipBg   = theme === 'dark' ? '#1a1a1a' : '#ffffff'
  const tooltipBdr  = theme === 'dark' ? '#2a2a2a' : '#E0E0E0'
  const tooltipText = theme === 'dark' ? '#f5f5f5' : '#111111'
  const legendColor = theme === 'dark' ? '#9ca3af' : '#555555'
  const tooltipStyle = { background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8 }

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
  const maxLoad = Math.max(...loadSeries.map((w) => w.load), 1)
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
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
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
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={effectiveMetric === 'km'} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: 'var(--red)' }}
                formatter={(value) => [`${value}${metricInfo.unit}`, metricInfo.label]}
              />
              <Area
                type="monotone"
                dataKey={effectiveMetric}
                stroke="var(--red)"
                strokeWidth={2}
                fill="rgba(var(--accent-rgb),0.18)"
                dot={false}
                activeDot={{ r: 4 }}
                name={metricInfo.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Abitudini: giorni della settimana (solo su finestre multi-settimana) */}
      {(period === 'month' || period === 'year' || period === 'all') && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{stats.weekdays.heading}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekdayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: 'var(--red)' }}
              />
              <Bar dataKey="sessions" fill="var(--red)" radius={[4, 4, 0, 0]} name={stats.weekdays.seriesName} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Obiettivo vs reale — finestra fissa: ultime 8 settimane */}
      {activities.length > 0 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.goal.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {stats.goal.reachedBefore}<span className="text-[var(--red)] font-semibold">{weeksMet}</span>{stats.goal.reachedAfter}
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={goalData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={8} />
              <YAxis
                tick={{ fill: chartTick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, weeklyGoal) + 1]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: 'var(--red)' }}
                formatter={(value) => [stats.goal.tooltipValue(value, weeklyGoal), stats.goal.tooltipName]}
              />
              <ReferenceLine
                y={weeklyGoal}
                stroke={chartTick}
                strokeDasharray="6 3"
                label={{ value: stats.goal.referenceLabel(weeklyGoal), position: 'insideTopRight', fill: chartTick, fontSize: 10 }}
              />
              <Bar dataKey="sessions" radius={[4, 4, 0, 0]} name={stats.goal.tooltipName}>
                {goalData.map((w) => (
                  <Cell key={w.key} fill={w.met ? 'var(--red)' : 'rgba(var(--accent-rgb),0.35)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{stats.pie.heading}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
            </PieChart>
          </ResponsiveContainer>
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

      {/* Carico settimanale session-RPE: sforzo percepito × minuti (grafico a
          colonne in puro CSS — niente recharts sulle card nuove, il pilastro 04
          della roadmap v3 lo pensiona del tutto) */}
      {loadWeeksWithData >= 2 && filtered.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{stats.trainingLoad.heading}</h2>
          <p className="text-xs text-gray-400 mb-3">{stats.trainingLoad.subtitle}</p>
          <div className="flex items-end gap-1.5 h-28" role="img" aria-label={stats.trainingLoad.chartAriaLabel}>
            {loadSeries.map((w, i) => (
              <div
                key={w.key}
                className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full"
                aria-label={stats.trainingLoad.barAria(w.label, w.load)}
              >
                {w.load > 0 && (
                  <span className="text-[9px] text-gray-500 tabular-nums leading-none">{w.load}</span>
                )}
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(w.load > 0 ? 4 : 2, Math.round((w.load / maxLoad) * 88))}px`,
                    background: i === loadSeries.length - 1 ? 'var(--red)' : 'rgba(var(--accent-rgb),0.45)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            {loadSeries.map((w) => (
              <span key={w.key} className="flex-1 text-center text-[9px] text-gray-500 truncate">{w.label}</span>
            ))}
          </div>
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
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightData} syncId="pesoAllenamento" margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: 'var(--red)' }}
                formatter={(value) => [stats.weightTraining.weightTooltipValue(value), stats.weightTraining.weightSeriesName]}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--red)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--red)', strokeWidth: 0 }}
                connectNulls
                name={stats.weightTraining.weightSeriesName}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mb-1 mt-2">{stats.weightTraining.trainingLabel}</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={weightData} syncId="pesoAllenamento" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={8} />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: 'var(--red)' }}
                formatter={(value) => [stats.weightTraining.trainingTooltipValue(value), stats.weightTraining.trainingTooltipName]}
              />
              <Bar dataKey="minutes" fill="rgba(var(--accent-rgb),0.55)" radius={[4, 4, 0, 0]} name={stats.weightTraining.trainingSeriesName} />
            </BarChart>
          </ResponsiveContainer>
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
