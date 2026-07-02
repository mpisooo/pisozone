import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, format, isAfter, isEqual } from 'date-fns'
import { it } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useActivities } from '../hooks/useActivities'
import { useTheme } from '../context/ThemeContext'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import type { Activity } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import AnalisiTabs from '../components/AnalisiTabs'

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: 'Oggi'     },
  { value: 'week',   label: 'Settimana' },
  { value: 'month',  label: 'Mese'     },
  { value: 'year',   label: 'Anno'     },
  { value: 'all',    label: 'Sempre'   },
]

const PIE_COLORS = ['#F44352', '#ff6b6b', '#ffa5a5', '#CC3845', '#ffcdd2', '#ff3b4a', '#9b1c26', '#e57373', '#ff8a80', '#b71c1c']

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card text-center count-up">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bebas text-3xl text-white">{value}</p>
      {sub && <p className="text-xs text-[#F44352]">{sub}</p>}
    </div>
  )
}

export default function StatsPage() {
  const { activities, loading } = useActivities()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [period, setPeriod] = useState<Period>('week')

  const chartGrid   = theme === 'dark' ? '#2a2a2a' : '#E0E0E0'
  const chartTick   = theme === 'dark' ? '#9ca3af' : '#777777'
  const tooltipBg   = theme === 'dark' ? '#1a1a1a' : '#ffffff'
  const tooltipBdr  = theme === 'dark' ? '#2a2a2a' : '#E0E0E0'
  const tooltipText = theme === 'dark' ? '#f5f5f5' : '#111111'
  const legendColor = theme === 'dark' ? '#9ca3af' : '#555555'

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

  // Bar chart: sessions per day/week grouped
  const barData = useMemo(() => {
    if (period === 'today' || period === 'all') return []
    const map = new Map<string, number>()
    for (const a of filtered) {
      const d = parseISO(a.date)
      const key = period === 'year'
        ? format(d, 'MMM', { locale: it })
        : format(d, 'EEE', { locale: it })
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, count]) => ({ name, count }))
  }, [filtered, period])

  // Pie chart data
  const pieData = useMemo(() =>
    Object.entries(typeCounts)
      .map(([type, count]) => {
        const opt = ACTIVITY_OPTIONS.find((o) => o.value === type)
        return { name: `${opt?.emoji} ${opt?.label}`, value: count }
      })
      .sort((a, b) => b.value - a.value),
    [typeCounts]
  )

  // Records
  const longestSession = filtered.reduce((best, a) => a.duration_min > (best?.duration_min ?? 0) ? a : best, null as Activity | null)
  const mostCalories = filtered.reduce((best, a) => (a.calories ?? 0) > (best?.calories ?? 0) ? a : best, null as Activity | null)

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
                ? 'bg-[#F44352] text-[white] shadow-lg'
                : 'bg-[var(--grey)] text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Sessioni" value={totalSessions} />
        <StatCard
          label="Minuti totali"
          value={totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m`}
        />
        <StatCard label="Calorie" value={totalCal > 0 ? `${totalCal.toLocaleString()} kcal` : '—'} />
        <StatCard label="Km percorsi" value={totalKm > 0 ? `${totalKm.toFixed(1)} km` : '—'} />
      </div>

      {topOpt && (
        <div className="card flex items-center gap-3">
          <span className="text-4xl">{topOpt.emoji}</span>
          <div>
            <p className="text-xs text-gray-400">Attività più frequente</p>
            <p className="font-bebas text-2xl text-white">{topOpt.label}</p>
            <p className="text-xs text-[#F44352]">{topActivity[1]} sessioni</p>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {barData.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider mb-3">SESSIONI PER GIORNO</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="name" tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8 }}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: '#F44352' }}
              />
              <Bar dataKey="count" fill="#F44352" radius={[4, 4, 0, 0]} name="Sessioni" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider mb-3">DISTRIBUZIONE ATTIVITÀ</h2>
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
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8 }}
                itemStyle={{ color: tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records */}
      {(longestSession || mostCalories) && (
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">RECORD PERSONALI</h2>
          {longestSession && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Sessione più lunga</p>
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
                <p className="text-xs text-gray-400">Più calorie bruciate</p>
                <p className="text-white font-medium">{mostCalories.calories} kcal</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card text-center py-10">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-6xl mx-auto mb-4"
            style={{ background: 'rgba(45,212,191,0.12)' }}
          >
            {activities.length === 0 ? '🚀' : '🔍'}
          </div>
          <p className="font-bebas text-2xl text-white tracking-wider mb-1">
            {activities.length === 0 ? 'Niente ancora!' : 'Nessun dato qui'}
          </p>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            {activities.length === 0
              ? 'Registra la tua prima attività per vedere le statistiche prendere vita.'
              : 'Non hai attività in questo periodo. Prova a cambiare filtro o registra un allenamento.'}
          </p>
          <button type="button" className="btn-primary px-6 py-2 text-sm" onClick={() => navigate('/log')}>
            {activities.length === 0 ? '🏃 Prima attività' : '+ Registra allenamento'}
          </button>
        </div>
      )}
    </div>
  )
}
