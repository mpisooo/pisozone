import { useState, useMemo, useRef } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, parseISO,
  addMonths, subMonths,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Flame, X, Pencil, CloudOff, Filter, Satellite, Camera } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { useRecovery } from '../hooks/useRecovery'
import { ACTIVITY_OPTIONS, activityLabel } from '../lib/constants'
import { calcStreak } from '../lib/challenges'
import {
  EMPTY_FILTERS, hasActiveFilters, activeFilterCount, filterActivities, typesInActivities,
  type ActivityFilters,
} from '../lib/activityFilters'
import { isPendingActivityId } from '../lib/offlineQueue'
import type { Activity } from '../types'
import ActivityEditModal from '../components/ActivityEditModal'
import ActivityIcon from '../components/ActivityIcon'
import AnalisiTabs from '../components/AnalisiTabs'
import SkeletonCard from '../components/SkeletonCard'
import common from '../lib/i18n/common'
import calendar from '../lib/i18n/calendar'

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
  const { restDates } = useRecovery()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  // Filtri e ricerca (roadmap v3, pilastro 02): con filtri attivi heatmap e
  // pannello del giorno mostrano solo le attività corrispondenti, e sotto il
  // mese compare la lista dei risultati. Lo streak resta su TUTTE le attività.
  const [filters, setFilters] = useState<ActivityFilters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

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

  const filtersActive = hasActiveFilters(filters)
  const filteredActivities = useMemo(() => filterActivities(activities, filters), [activities, filters])
  const availableTypes = useMemo(() => typesInActivities(activities), [activities])
  // Risultati: le più recenti tra le filtrate (la lista di useActivities è già
  // in ordine di data discendente), limitate per non allungare la pagina.
  const searchResults = useMemo(
    () => (filtersActive ? filteredActivities.slice(0, 20) : []),
    [filtersActive, filteredActivities],
  )

  const actsByDay = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const a of filteredActivities) {
      const key = format(parseISO(a.date), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return map
  }, [filteredActivities])

  // Stessa fonte di Home/Challenges: freeze e giorni di riposo (v33)
  // contano come giorni attivi
  const streak = useMemo(
    () => calcStreak(activities, [...frozenDates, ...restDates]),
    [activities, frozenDates, restDates],
  )
  const restSet = useMemo(() => new Set(restDates), [restDates])

  const selectedDayActivities = selectedDay
    ? (actsByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? [])
    : []
  const selectedDayIsRest = selectedDay ? restSet.has(format(selectedDay, 'yyyy-MM-dd')) : false

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

      {/* Filtri e ricerca (roadmap v3, pilastro 02) */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label={calendar.filters.toggleAria}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
            showFilters || filtersActive ? 'bg-[var(--red)] text-[white]' : 'bg-[var(--grey)] text-gray-400'
          }`}
        >
          <Filter size={13} />
          {calendar.filters.toggle}
          {activeFilterCount(filters) > 0 && (
            <span
              className="min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {activeFilterCount(filters)}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card space-y-3">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className="input-dark w-full"
            placeholder={calendar.filters.searchPlaceholder}
            aria-label={calendar.filters.searchAria}
          />

          {availableTypes.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{calendar.filters.sportsLabel}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {availableTypes.map((type) => {
                  const selected = filters.types.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFilters((f) => ({
                        ...f,
                        types: selected ? f.types.filter((t) => t !== type) : [...f.types, type],
                      }))}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        selected ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'
                      }`}
                      style={{ background: selected ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                    >
                      <ActivityIcon type={type} size={14} className={selected ? 'text-[var(--red)]' : 'text-gray-400'} />
                      {ACTIVITY_OPTIONS.find((o) => o.value === type)?.label ?? type}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={filters.gpsOnly}
              onClick={() => setFilters((f) => ({ ...f, gpsOnly: !f.gpsOnly }))}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filters.gpsOnly ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'
              }`}
              style={{ background: filters.gpsOnly ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
            >
              <Satellite size={13} />
              {calendar.filters.gpsChip}
            </button>
            <button
              type="button"
              aria-pressed={filters.photoOnly}
              onClick={() => setFilters((f) => ({ ...f, photoOnly: !f.photoOnly }))}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filters.photoOnly ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'
              }`}
              style={{ background: filters.photoOnly ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
            >
              <Camera size={13} />
              {calendar.filters.photoChip}
            </button>
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium text-gray-400 hover:text-white transition-colors"
              style={{ background: 'var(--grey)' }}
            >
              <X size={13} />
              {calendar.filters.clear}
            </button>
          )}
        </div>
      )}

      {/* Risultati della ricerca: le attività filtrate più recenti, apribili
          in modifica come dal pannello del giorno */}
      {filtersActive && (
        <div className="card space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              {calendar.filters.resultsCount(filteredActivities.length)}
            </p>
            {filteredActivities.length > searchResults.length && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {calendar.filters.resultsShownHint(searchResults.length)}
              </span>
            )}
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">{calendar.filters.noResults}</p>
          ) : (
            searchResults.map((a) => {
              const opt = ACTIVITY_OPTIONS.find((o) => o.value === a.type)
              return (
                <button
                  key={a.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors bg-[var(--grey)] hover:brightness-110 active:brightness-90"
                  onClick={() => setEditingActivity(a)}
                >
                  <ActivityIcon type={opt?.value ?? 'corsa'} size={22} className="text-[var(--red)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{activityLabel(a.type, a.indoor)}</p>
                    <p className="text-xs text-gray-400">
                      {calendar.dayPanel.durationLabel(a.duration_min)}
                      {a.calories ? calendar.dayPanel.caloriesSuffix(a.calories) : ''}
                      {a.distance_km ? calendar.dayPanel.distanceSuffix(a.distance_km) : ''}
                    </p>
                    {a.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.notes}</p>}
                  </div>
                  <p className="text-xs text-gray-500 flex-shrink-0">
                    {format(parseISO(a.date), 'd MMM yy', { locale: it })}
                  </p>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Month nav */}
      <div className="card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label={calendar.prevMonthAria}
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
            aria-label={calendar.nextMonthAria}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1">
          {calendar.weekdayShortLabels.map((d) => (
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
            const isRest = restSet.has(key)
            const level = heatLevel(acts.length)

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                aria-label={`${calendar.dayAriaLabel(format(day, 'd MMMM', { locale: it }), acts.length)}${isRest ? `, ${calendar.restDotAria}` : ''}`}
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
                {isRest && (
                  <span
                    className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#A78BFA' }}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 mt-3 justify-end">
          <span className="text-xs text-gray-500">{calendar.legendLabel}</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className="flex flex-col items-center gap-0.5">
              <div className={`w-4 h-4 rounded ${heatLevel(l)}`} />
              <span className="text-[9px] text-gray-500 leading-none">{l === 4 ? '4+' : l}</span>
            </div>
          ))}
        </div>

        {filtersActive && (
          <p className="text-[10px] text-gray-600 text-right mt-1.5">{calendar.filters.heatmapHint}</p>
        )}
      </div>

      {/* Streak info */}
      {streak > 0 && (
        <div className="card flex items-center gap-3">
          <Flame size={28} className="text-[var(--red)]" />
          <div>
            <p className="font-bebas text-2xl text-[var(--red)]">{calendar.streakCount(streak)}</p>
            <p className="text-xs text-gray-400">{calendar.streakHint}</p>
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
            <button type="button" onClick={() => setSelectedDay(null)} aria-label={common.close} className="p-1 hover:text-white text-gray-500">
              <X size={18} />
            </button>
          </div>

          {selectedDayIsRest && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#A78BFA' }} />
              {calendar.plannedRestBadge}
            </div>
          )}

          {selectedDayActivities.length === 0 ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
                style={{ background: 'rgba(148,163,184,0.12)' }}
              >
                😴
              </div>
              <p className="text-sm text-gray-500">{calendar.restDayTitle}</p>
              <p className="text-xs text-gray-600 mt-0.5">{calendar.restDaySubtitle}</p>
            </div>
          ) : (
            selectedDayActivities.map((a) => {
              const opt = ACTIVITY_OPTIONS.find((o) => o.value === a.type)
              // Ancora in coda offline (roadmap v2, pilastro 05): il badge lo
              // segnala, ma dal v3 pilastro 04 è comunque modificabile —
              // updateActivity scrive nel payload in coda invece che su Supabase.
              const pending = isPendingActivityId(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors bg-[var(--grey)] hover:brightness-110 active:brightness-90"
                  onClick={() => setEditingActivity(a)}
                >
                  <ActivityIcon type={opt?.value ?? 'corsa'} size={26} className="text-[var(--red)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{activityLabel(a.type, a.indoor)}</p>
                      {pending && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-gray-400 flex items-center gap-1 flex-shrink-0"
                          style={{ background: 'rgba(148,163,184,0.15)' }}
                        >
                          <CloudOff size={9} /> {common.pendingSyncBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {calendar.dayPanel.durationLabel(a.duration_min)}
                      {a.calories ? calendar.dayPanel.caloriesSuffix(a.calories) : ''}
                      {a.distance_km ? calendar.dayPanel.distanceSuffix(a.distance_km) : ''}
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
                  {pending
                    ? <CloudOff size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    : <Pencil size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />}
                </button>
              )
            })
          )}
          <p className="text-xs text-gray-600 text-center pt-1">{calendar.editHint}</p>
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
