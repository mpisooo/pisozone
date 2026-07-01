import type { ActivityType, MedalDefinition, AchievementStats } from '../types'

export const ACTIVITY_OPTIONS: { value: ActivityType; label: string; emoji: string; hasDist: boolean }[] = [
  { value: 'corsa',     label: 'Corsa',     emoji: '🏃', hasDist: true  },
  { value: 'bici',      label: 'Bici',      emoji: '🚴', hasDist: true  },
  { value: 'calcio',    label: 'Calcio',    emoji: '⚽', hasDist: false },
  { value: 'pallavolo', label: 'Pallavolo', emoji: '🏐', hasDist: false },
  { value: 'basket',    label: 'Basket',    emoji: '🏀', hasDist: false },
  { value: 'palestra',  label: 'Palestra',  emoji: '🏋️', hasDist: false },
  { value: 'nuoto',     label: 'Nuoto',     emoji: '🏊', hasDist: true  },
  { value: 'camminata', label: 'Camminata', emoji: '🚶', hasDist: true  },
  { value: 'tennis',    label: 'Tennis',    emoji: '🎾', hasDist: false },
  { value: 'yoga',        label: 'Yoga',        emoji: '🧘', hasDist: false },
  { value: 'danza',       label: 'Danza',       emoji: '💃', hasDist: false },
  { value: 'motocross',   label: 'Motocross',   emoji: '🏍️', hasDist: true  },
  { value: 'golf',        label: 'Golf',        emoji: '⛳', hasDist: false },
  { value: 'arrampicata', label: 'Arrampicata', emoji: '🧗', hasDist: false },
  { value: 'padel',       label: 'Padel',       emoji: '🏸', hasDist: false },
]

// MET values (metabolic equivalent) per activity
export const MET: Record<ActivityType, number> = {
  corsa:       9.8,
  bici:        7.5,
  calcio:      7.0,
  pallavolo:   4.0,
  basket:      6.5,
  palestra:    5.0,
  nuoto:       8.0,
  camminata:   3.5,
  tennis:      7.3,
  yoga:        2.5,
  danza:       4.8,
  motocross:   5.0,
  golf:        4.3,
  arrampicata: 7.5,
  padel:       6.0,
}

export function calcCalories(
  type: ActivityType,
  durationMin: number,
  weightKg: number,
  gender?: 'male' | 'female' | null,
): number {
  // Le donne bruciano mediamente ~10% meno kcal a parità di peso/attività
  // per via di una maggiore percentuale di massa grassa rispetto alla massa magra
  const genderFactor = gender === 'female' ? 0.9 : 1.0
  return Math.round(MET[type] * weightKg * (durationMin / 60) * genderFactor)
}

export const MEDALS: MedalDefinition[] = [
  // BRONZE
  {
    key: 'prima_mossa',
    name: 'Prima Mossa',
    description: 'Prima attività registrata',
    tier: 'bronze',
    icon: '👟',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 1), target: 1 }),
  },
  {
    key: 'settimana_attiva',
    name: 'Settimana Attiva',
    description: '3 attività in una settimana',
    tier: 'bronze',
    icon: '📅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 3), target: 3 }),
  },
  {
    key: 'runner_esordiente',
    name: 'Runner Esordiente',
    description: 'Prima corsa registrata',
    tier: 'bronze',
    icon: '🏃',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.activityTypeCounts.corsa, 1), target: 1 }),
  },
  // SILVER
  {
    key: 'maratoneta',
    name: 'Maratoneta',
    description: '50 km totali di corsa',
    tier: 'silver',
    icon: '🏅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalRunKm, 50), target: 50 }),
  },
  {
    key: 'ferro_da_stiro',
    name: 'Ferro da Stiro',
    description: '10 sessioni in palestra',
    tier: 'silver',
    icon: '🏋️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.gymSessions, 10), target: 10 }),
  },
  {
    key: 'costante',
    name: 'Costante',
    description: '7 giorni consecutivi di attività',
    tier: 'silver',
    icon: '🔥',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxStreak, 7), target: 7 }),
  },
  // GOLD
  {
    key: 'centurione',
    name: 'Centurione',
    description: '100 attività totali registrate',
    tier: 'gold',
    icon: '⚔️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 100), target: 100 }),
  },
  {
    key: 'ultra_runner',
    name: 'Ultra Runner',
    description: '500 km totali di corsa',
    tier: 'gold',
    icon: '🦅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalRunKm, 500), target: 500 }),
  },
  {
    key: 'leggenda',
    name: 'Leggenda',
    description: '365 giorni di attività in un anno',
    tier: 'gold',
    icon: '👑',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.activeDaysInYear, 365), target: 365 }),
  },
  // BRONZE extra
  {
    key: 'mattiniero',
    name: 'Mattiniero',
    description: '5 allenamenti completati prima delle 8:00',
    tier: 'bronze',
    icon: '🌅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.earlyMorningCount, 5), target: 5 }),
  },
  {
    key: 'doppio_impegno',
    name: 'Doppio Impegno',
    description: '2 attività nello stesso giorno per 5 volte',
    tier: 'bronze',
    icon: '⚡',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.daysWithMultipleActivities, 5), target: 5 }),
  },
  // SILVER extra
  {
    key: 'tuttofare',
    name: 'Tuttofare',
    description: '3 tipi diversi di attività in un solo giorno',
    tier: 'silver',
    icon: '🎯',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxDistinctTypesInDay, 3), target: 3 }),
  },
  {
    key: 'multisport',
    name: 'Multisport',
    description: 'Prova almeno 5 tipi diversi di attività',
    tier: 'silver',
    icon: '🌀',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.distinctTypesUsed, 5), target: 5 }),
  },
  {
    key: 'guerriero_weekend',
    name: 'Guerriero del Weekend',
    description: '10 allenamenti nel weekend',
    tier: 'silver',
    icon: '🛡️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.weekendWorkoutCount, 10), target: 10 }),
  },
  // GOLD extra
  {
    key: 'grande_allenatore',
    name: 'Grande Allenatore',
    description: '3 ore totali di attività in un solo giorno',
    tier: 'gold',
    icon: '💪',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxDurationMinInDay, 180), target: 180 }),
  },
  {
    key: 'stagionale',
    name: 'Stagionale',
    description: '20 attività in un solo mese',
    tier: 'gold',
    icon: '📆',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxActivitiesInMonth, 20), target: 20 }),
  },
  // DIAMOND
  {
    key: 'inarrestabile',
    name: 'Inarrestabile',
    description: '30 giorni consecutivi di attività',
    tier: 'diamond',
    icon: '💎',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxStreak, 30), target: 30 }),
  },
  {
    key: 'campione_annuale',
    name: 'Campione Annuale',
    description: 'Obiettivo settimanale rispettato per 52 settimane',
    tier: 'diamond',
    icon: '🏆',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.weeklyGoalMetWeeks, 52), target: 52 }),
  },
  {
    key: 'olimpionico',
    name: 'Olimpionico',
    description: 'Ogni tipo di attività eseguita almeno 10 volte',
    tier: 'diamond',
    icon: '🥇',
    checkProgress: (s: AchievementStats) => ({
      current: Math.min(Object.values(s.activityTypeCounts).filter((c) => c >= 10).length, 10),
      target: 10,
    }),
  },
]

export const TIER_LABELS: Record<string, string> = {
  bronze: '🥉 Bronzo',
  silver: '🥈 Argento',
  gold: '🥇 Oro',
  diamond: '💎 Diamante',
}

export const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-slate-400 to-slate-200',
  gold: 'from-yellow-500 to-yellow-300',
  diamond: 'from-cyan-400 to-purple-500',
}

// Crediti assegnati una tantum allo sblocco di una medaglia, per tier.
// Scala coerente con i crediti delle sfide giornaliere (15-50), senza esagerare.
export const TIER_CREDITS: Record<string, number> = {
  bronze: 20,
  silver: 35,
  gold: 60,
  diamond: 100,
}
