import { useState, useMemo, useRef } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, parseISO,
  addMonths, subMonths,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Flame, X, Pencil } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import { calcStreak } from '../lib/challenges'
import type { Activity } from '../types'
import ActivityEditModal from '../components/ActivityEditModal'
import AnalisiTabs from '../components/AnalisiTabs'
import SkeletonCard from '../components/SkeletonCard'

function heatLevel(count: number) {
  if (count === 0) return 'heatmap-0'
  if (count === 1) return 'heatmap-1'
  if (count === 2) return 'heatmap-2'
  if (count === 3) return 'heatmap-3'
  return 'heatmap-4'
}

export default function CalendarPage() {
  const { activities, loading, updateActivity, deleteActivity } = useActivities()
  const { frozenDates } = useStreakFreeze()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      setCurrentMonth(m => dx < 0 ? addMonths(m, 1) : subMonths(m, 1))
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  )

  const actsByDay = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const a of activities) {
      const key = format(parseISO(a.date), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return map
  }, [activities])

  // Stessa fonte di Home/Challenges: gli streak-freeze contano come giorni attivi
  const streak = useMemo(() => calcStreak(activities, frozenDates), [activities, frozenDates])

  const selectedDayActivities = selectedDay
    ? (actsByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? [])
    : []

  const firstDayOfWeek = days[0].getDay()
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  if (loading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={7} />
        <SkeletonCard lines={2} />
      </div>
    )
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-3">
        <AnalisiTabs />
      </div>

      {/* Month nav */}
      <div className="card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Mese precedente"
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-300" />
          </button>
          <span className="font-bebas text-2xl text-white tracking-wider capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Mese successivo"
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1">
          {['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'].map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const acts = actsByDay.get(key) ?? []
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
            const level = heatLevel(acts.length)

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                aria-label={`${format(day, 'd MMMM', { locale: it })}, ${acts.length} ${acts.length === 1 ? 'attività' : 'attività registrate'}`}
                className={`relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150 ${level} ${
                  isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0D0D0D]' : ''
                } ${isToday ? 'ring-2 ring-[var(--red)]' : ''}`}
              >
                {format(day, 'd')}
                {acts.length > 0 && (
                  <span className="absolute bottom-0.5 right-1 text-[8px] leading-none opacity-70">
                    {acts.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 mt-3 justify-end">
          <span className="text-xs text-gray-500">Attività/giorno:</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className="flex flex-col items-center gap-0.5">
              <div className={`w-4 h-4 rounded ${heatLevel(l)}`} />
              <span className="text-[9px] text-gray-500 leading-none">{l === 4 ? '4+' : l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak info */}
      {streak > 0 && (
        <div className="card flex items-center gap-3">
          <Flame size={28} className="text-[var(--red)]" />
          <div>
            <p className="font-bebas text-2xl text-[var(--red)]">{streak} GIORNI CONSECUTIVI</p>
            <p className="text-xs text-gray-400">Continua così, non fermarti!</p>
          </div>
        </div>
      )}

      {/* Day panel */}
      {selectedDay && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bebas text-xl text-white tracking-wider capitalize">
              {format(selectedDay, 'EEEE d MMMM', { locale: it })}
            </span>
            <button type="button" onClick={() => setSelectedDay(null)} aria-label="Chiudi" className="p-1 hover:text-white text-gray-500">
              <X size={18} />
            </button>
          </div>

          {selectedDayActivities.length === 0 ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
                style={{ background: 'rgba(148,163,184,0.12)' }}
              >
                😴
              </div>
              <p className="text-sm text-gray-500">Giornata di riposo</p>
              <p className="text-xs text-gray-600 mt-0.5">Nessun allenamento registrato</p>
            </div>
          ) : (
            selectedDayActivities.map((a) => {
              const opt = ACTIVITY_OPTIONS.find((o) => o.value === a.type)
              return (
                <button
                  key={a.id}
                  type="button"
                  className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:brightness-110 active:brightness-90 bg-[var(--grey)]"
                  onClick={() => setEditingActivity(a)}
                >
                  <span className="text-2xl">{opt?.emoji ?? '🏃'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{opt?.label}</p>
                    <p className="text-xs text-gray-400">
                      {a.duration_min} min
                      {a.calories ? ` · ${a.calories} kcal` : ''}
                      {a.distance_km ? ` · ${a.distance_km} km` : ''}
                    </p>
                    {a.notes && <p className="text-xs text-gray-500 mt-1 truncate">{a.notes}</p>}
                    {a.photo_url && (
                      <img
                        src={a.photo_url}
                        alt=""
                        loading="lazy"
                        className="w-full max-h-32 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>
                  <Pencil size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                </button>
              )
            })
          )}
          <p className="text-xs text-gray-600 text-center pt-1">Tocca un'attività per modificarla</p>
        </div>
      )}

      {/* Edit modal */}
      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          updateActivity={updateActivity}
          deleteActivity={deleteActivity}
        />
      )}
    </div>
  )
}
