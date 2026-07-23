import { differenceInCalendarDays, parseISO } from 'date-fns'
import { GPS_TRACKABLE_TYPES } from './constants'
import type { Activity, ActivityType } from '../types'

// Spinta verso il secondo allenamento (roadmap "PisoZone Next" P2-06): i
// giorni 1-7 dopo la prima attività sono il momento a più alto rischio di
// abbandono. Non l'intera profondità dell'app in una volta — un passo
// piccolo e concreto, coerente col tono già scelto per ComebackCard.tsx.
const RISK_WINDOW_DAYS = 7
const MAX_ACTIVITIES = 2

export interface SecondWorkoutNudge {
  // 'tryGps': ha già fatto uno sport GPS-trackable ma non l'ha tracciato —
  // suggerimento concreto e a costo zero. 'repeat': fallback sempre valido,
  // ripetere lo stesso sport per costruire l'abitudine.
  kind: 'tryGps' | 'repeat'
  activityType: ActivityType
}

export function secondWorkoutNudge(activities: Activity[], now: Date = new Date()): SecondWorkoutNudge | null {
  if (activities.length === 0 || activities.length > MAX_ACTIVITIES) return null

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const daysSinceFirst = differenceInCalendarDays(now, parseISO(first.date))
  if (daysSinceFirst < 0 || daysSinceFirst > RISK_WINDOW_DAYS) return null

  const last = sorted[sorted.length - 1]
  const isGpsTrackable = (GPS_TRACKABLE_TYPES as ActivityType[]).includes(last.type)
  if (isGpsTrackable && !last.gps_tracked) {
    return { kind: 'tryGps', activityType: last.type }
  }
  return { kind: 'repeat', activityType: last.type }
}
