export type ActivityType =
  | 'corsa'
  | 'bici'
  | 'calcio'
  | 'pallavolo'
  | 'basket'
  | 'palestra'
  | 'nuoto'
  | 'camminata'
  | 'tennis'
  | 'yoga'
  | 'danza'
  | 'motocross'
  | 'golf'
  | 'arrampicata'
  | 'padel'

export interface Activity {
  id: string
  user_id: string
  type: ActivityType
  date: string
  duration_min: number
  calories: number | null
  distance_km: number | null
  notes: string | null
  created_at: string
  credits_earned: number
}

export interface Profile {
  id: string
  username: string
  name: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  photo_url: string | null
  weekly_goal: number
  daily_calorie_goal: number | null
  sport_preferiti: ActivityType[]
  credits: number
  gender: 'male' | 'female' | null
  level: number
  unlocked_themes: string[]
  active_theme: string
  unlocked_frames: string[]
  active_frame: string
  push_prompt_seen: boolean
  // Opzionale: esiste solo dopo la migrazione v21. undefined = colonna non
  // ancora creata (consent gate disattivato), null = utente pre-esistente che
  // deve ancora accettare le condizioni.
  terms_accepted_at?: string | null
  // Opzionale: esiste solo dopo la migrazione v25. false = nuovo utente che
  // non ha ancora visto il tour di benvenuto; undefined = colonna assente.
  onboarding_seen?: boolean
}

export interface ChallengeTemplate {
  key: string
  title: string
  description: string
  icon: string
  credits: number
  check: (todayActivities: Activity[], streak: number) => boolean
}

export interface DailyChallengeCompletion {
  id: string
  user_id: string
  challenge_date: string
  challenge_key: string
  credits_earned: number
  completed_at: string
}

export interface EnrichedChallenge {
  template: ChallengeTemplate
  eligible: boolean
  claimed: boolean
}

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
}

export interface Achievement {
  id: string
  user_id: string
  medal_key: string
  unlocked_at: string
  credits_earned: number
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export interface FriendProfile {
  friendship_id: string
  user_id: string
  username: string
  name: string | null
  photo_url: string | null
}

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface MedalDefinition {
  key: string
  name: string
  description: string
  tier: MedalTier
  icon: string
  checkProgress: (stats: AchievementStats) => { current: number; target: number }
}

export interface AchievementStats {
  totalActivities: number
  totalRunKm: number
  totalAllKm: number
  gymSessions: number
  currentStreak: number
  maxStreak: number
  weeklyGoalMetWeeks: number
  activityTypeCounts: Record<ActivityType, number>
  activeDaysInYear: number
  // new stats
  maxDistinctTypesInDay: number
  daysWithMultipleActivities: number
  earlyMorningCount: number
  weekendWorkoutCount: number
  maxActivitiesInMonth: number
  distinctTypesUsed: number
  maxDurationMinInDay: number
}
