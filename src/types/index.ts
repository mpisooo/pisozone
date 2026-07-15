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
  | 'beach_volley'
  | 'ping_pong'
  | 'salto_corda'
  | 'trekking'
  | 'boxe'

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
  // Opzionale: esiste solo dopo la migrazione v27. URL pubblico della foto
  // allegata nel bucket "activity-photos"; undefined = colonna non ancora creata.
  photo_url?: string | null
  // Opzionale: esiste solo dopo la migrazione v29. true = registrata con il
  // tracciamento GPS (i punti del percorso vivono in activity_routes).
  gps_tracked?: boolean
  // Opzionali: esistono solo dopo la migrazione v30. Metriche soggettive,
  // sempre nullable anche a colonna presente: chi non le compila resta null,
  // non c'è un default che finga un valore mai inserito. rpe: sforzo
  // percepito 1-10. mood: umore/energia post-sessione 1-5.
  rpe?: number | null
  mood?: number | null
  // Opzionale: esiste solo dopo la migrazione v38. true = al chiuso (tapis
  // roulant, cyclette, piscina...), false = all'aperto, null = non indicato.
  // Ha senso solo per gli sport in INDOOR_VARIANTS (lib/constants).
  indoor?: boolean | null
}

export interface RoutePoint {
  lat: number
  lng: number
}

// Riga di exercise_sets (v32): un "blocco" di lavoro di una sessione in
// palestra — esercizio + serie × ripetizioni allo stesso carico.
// weight_kg null = corpo libero, non un peso ignoto.
export interface ExerciseSet {
  id: string
  activity_id: string
  user_id: string
  seq: number
  exercise: string
  sets: number
  reps: number
  weight_kg: number | null
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
  // Opzionale: esiste solo dopo la migrazione v35. Ultima "ondata" di novità
  // vista (NEWS_VERSION in WhatsNewOverlay); undefined = colonna assente,
  // annuncio disattivato.
  news_seen_version?: number
  // Opzionali: esistono solo dopo la migrazione v28. undefined = colonna non
  // ancora creata (tutte le notifiche attive, nessuna fascia di silenzio).
  notif_reminder_enabled?: boolean
  notif_messages_enabled?: boolean
  notif_friend_requests_enabled?: boolean
  notif_quiet_start?: number | null
  notif_quiet_end?: number | null
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

// Riga di plan_enrollments (v34): iscrizione a un programma del catalogo
// (PLAN_CATALOG in lib/plans.ts). L'avanzamento non è persistito: si deriva
// dalle attività con computePlanProgress. Attivo = né completato né abbandonato.
export interface PlanEnrollment {
  id: string
  user_id: string
  plan_key: string
  started_on: string
  completed_at: string | null
  abandoned_at: string | null
  credits_earned: number
  created_at: string
}

// Riga di personal_goals (v36): meta libera scelta dall'utente — metrica
// (sessions/minutes/km/kcal) + traguardo + sport opzionale (null = tutti) +
// finestra di date. L'avanzamento si deriva dalle attività (lib/goals.ts).
export interface PersonalGoal {
  id: string
  user_id: string
  metric: string
  target: number
  activity_type: ActivityType | null
  starts_on: string
  ends_on: string
  created_at: string
}

// Riga di duels (v37): sfida a tempo tra due amici (opponent_id) o dentro un
// gruppo (group_id) — una sola delle due valorizzata. L'avanzamento non è
// persistito: lo calcola la RPC get_duel_progress dalle attività.
export interface Duel {
  id: string
  creator_id: string
  opponent_id: string | null
  group_id: string | null
  metric: string
  starts_on: string
  ends_on: string
  status: 'pending' | 'active' | 'declined' | 'finished'
  winner_id: string | null
  credits_earned: number
  created_at: string
}

// Riga di seasonal_claims (v39): riscatto one-shot del podio (rank 1-3) di un
// evento stagionale (SEASONAL_EVENTS in lib/seasonalEvents.ts) a finestra
// chiusa. rank e credits_earned sono CALCOLATI dal trigger Postgres dai dati
// reali, mai dal client — quello che il client invia in insert è ignorato.
export interface SeasonalClaim {
  id: string
  event_key: string
  user_id: string
  metric: string
  activity_type: ActivityType | null
  starts_on: string
  ends_on: string
  rank: number
  credits_earned: number
  created_at: string
}

// Riga di recovery_logs (v33): una per utente per giorno. rest = giorno di
// riposo intenzionale (protegge la streak, max 2 a settimana lato client);
// water_ml e sleep_hours restano null finché non tracciati — nessun default
// che finga un valore mai inserito.
export interface RecoveryLog {
  id: string
  user_id: string
  day: string
  rest: boolean
  water_ml: number | null
  sleep_hours: number | null
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
