import { differenceInCalendarDays, parseISO, startOfDay, format, getDay, getHours } from 'date-fns'
import type { Activity, AchievementStats, ActivityType } from '../types'
import { ACTIVITY_OPTIONS } from './constants'

export function computeStats(activities: Activity[], weeklyGoal: number): AchievementStats {
  const allTypes = ACTIVITY_OPTIONS.map((a) => a.value) as ActivityType[]
  const typeCounts = Object.fromEntries(allTypes.map((t) => [t, 0])) as Record<ActivityType, number>

  let totalRunKm = 0
  let totalAllKm = 0
  let gymSessions = 0
  let earlyMorningCount = 0
  let weekendWorkoutCount = 0
  let totalGpsKm = 0
  let totalElevationGainM = 0

  const dayMap = new Map<string, { types: Set<ActivityType>; count: number; totalMin: number }>()
  const monthMap = new Map<string, number>()

  for (const a of activities) {
    typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1
    if (a.distance_km) totalAllKm += a.distance_km
    if (a.type === 'corsa' && a.distance_km) totalRunKm += a.distance_km
    if (a.type === 'palestra') gymSessions++
    if (a.gps_tracked && a.distance_km) totalGpsKm += a.distance_km
    if (a.elevation_gain_m) totalElevationGainM += a.elevation_gain_m

    const d = parseISO(a.date)
    if (getHours(d) < 8) earlyMorningCount++
    const dow = getDay(d)
    if (dow === 0 || dow === 6) weekendWorkoutCount++

    const dayKey = format(d, 'yyyy-MM-dd')
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, { types: new Set(), count: 0, totalMin: 0 })
    const day = dayMap.get(dayKey)!
    day.types.add(a.type)
    day.count++
    day.totalMin += a.duration_min

    const monthKey = format(d, 'yyyy-MM')
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1)
  }

  let maxDistinctTypesInDay = 0
  let daysWithMultipleActivities = 0
  let maxDurationMinInDay = 0
  for (const day of dayMap.values()) {
    if (day.types.size > maxDistinctTypesInDay) maxDistinctTypesInDay = day.types.size
    if (day.count >= 2) daysWithMultipleActivities++
    if (day.totalMin > maxDurationMinInDay) maxDurationMinInDay = day.totalMin
  }

  let maxActivitiesInMonth = 0
  for (const count of monthMap.values()) {
    if (count > maxActivitiesInMonth) maxActivitiesInMonth = count
  }

  const distinctTypesUsed = allTypes.filter((t) => typeCounts[t] > 0).length

  // Streak
  const activeDaySet = new Set(activities.map((a) => startOfDay(parseISO(a.date)).toISOString()))
  const sortedDays = [...activeDaySet].sort()

  let maxStreak = sortedDays.length > 0 ? 1 : 0
  let streak = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = differenceInCalendarDays(parseISO(sortedDays[i]), parseISO(sortedDays[i - 1]))
    if (diff === 1) {
      streak++
      if (streak > maxStreak) maxStreak = streak
    } else {
      streak = 1
    }
  }

  let currentStreak = 0
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1]
    const diffFromToday = differenceInCalendarDays(startOfDay(new Date()), parseISO(lastDay))
    if (diffFromToday <= 1) currentStreak = streak
  }

  // Active distinct days in current year
  const year = new Date().getFullYear()
  const activeDaysInYearSet = new Set(
    activities
      .filter((a) => new Date(a.date).getFullYear() === year)
      .map((a) => format(parseISO(a.date), 'yyyy-MM-dd'))
  )

  // Weekly goal met
  const weekMap: Record<string, number> = {}
  for (const a of activities) {
    const d = parseISO(a.date)
    const weekStart = startOfDay(new Date(new Date(d).setDate(d.getDate() - d.getDay()))).toISOString()
    weekMap[weekStart] = (weekMap[weekStart] ?? 0) + 1
  }
  const weeklyGoalMetWeeks = Object.values(weekMap).filter((c) => c >= weeklyGoal).length

  return {
    totalActivities: activities.length,
    totalRunKm,
    totalAllKm,
    gymSessions,
    currentStreak,
    maxStreak,
    weeklyGoalMetWeeks,
    activityTypeCounts: typeCounts,
    activeDaysInYear: activeDaysInYearSet.size,
    maxDistinctTypesInDay,
    daysWithMultipleActivities,
    earlyMorningCount,
    weekendWorkoutCount,
    maxActivitiesInMonth,
    distinctTypesUsed,
    maxDurationMinInDay,
    totalGpsKm,
    totalElevationGainM,
  }
}
