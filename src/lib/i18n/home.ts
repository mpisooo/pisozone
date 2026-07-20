import { createNamespaceProxy, type Widen } from './proxy'

// Namespace esclusivo di Home.tsx (dashboard): saluto, streak, obiettivo
// settimanale, streak freeze, obiettivo calorico, ultima attività, medaglia
// più vicina, classifica e sfide di oggi in anteprima.
const it = {
  athleteFallback: 'Atleta',
  greeting: (hour: number) => (hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'),
  streakUnit: (streak: number) => (streak === 1 ? 'giorno streak' : 'giorni streak'),
  weeklyGoalLabel: 'Obiettivo settimana',
  weekGoalReached: '🎉 Obiettivo raggiunto!',
  weekGoalRemaining: (n: number) => `ancora ${n} sessioni`,

  freezeOffer: {
    title: 'Streak a rischio!',
    prefix: 'Non hai registrato nulla ieri. Proteggi il tuo streak di',
    dayUnit: (n: number) => (n === 1 ? 'giorno' : 'giorni'),
    suffix: 'spendendo 300 crediti.',
    freezing: 'Congelamento...',
    freezeButton: '🧊 Congela streak (−300 💰)',
    insufficientCredits: (credits: number) => `Crediti insufficienti (${credits}/300)`,
  },

  dailyCalorieGoal: {
    title: 'Calorie bruciate oggi',
    suffix: (goal: number) => ` / ${goal} kcal`,
    noGoalSuffix: ' kcal',
    reached: '🎉 Obiettivo calorico raggiunto!',
  },

  ring: {
    centerLabel: 'Settimana',
    streakLabel: 'Streak',
    streakDaysLabel: (n: number) => (n === 1 ? '1 giorno' : `${n} giorni`),
    srSummary: (sessions: number, goal: number, calories: number, streakDays: number) =>
      `Obiettivo settimanale: ${sessions} su ${goal} sessioni. Calorie di oggi: ${calories}. Streak: ${streakDays} ${streakDays === 1 ? 'giorno' : 'giorni'}.`,
  },

  // Etichette dei "capitoli" che raggruppano la Home in una storia leggibile
  // scorrendo (roadmap v2, pilastro 01 punto 6): il colpo d'occhio del
  // PisoRing, poi il dettaglio. Niente etichetta per le sfide di oggi: il
  // titolo della card ("Sfide di oggi") la renderebbe ridondante.
  sections: {
    recovery: 'Recupero',
    recent: 'Attività recente',
    progress: 'Il tuo percorso',
    circle: 'La tua cerchia',
  },

  lastActivity: {
    title: 'Ultima attività',
    meta: (durationMin: number, calories: number | null | undefined, distanceKm: number | null | undefined) =>
      `${durationMin} min${calories ? ` · ${calories} kcal` : ''}${distanceKm ? ` · ${distanceKm} km` : ''}`,
    // Log lampo (roadmap v3, pilastro 02): apre Registra col form già compilato.
    repeat: 'Ripeti questo allenamento',
  },

  emptyState: {
    title: 'Pronto a sudare?',
    body: 'Registra la tua prima attività e inizia a costruire la tua streak. Ogni grande atleta ha avuto un giorno zero.',
    cta: '💪 Inizia ora',
  },

  nearestMedal: {
    title: 'Medaglia più vicina',
  },

  leaderboard: {
    title: 'Classifica settimanale',
    youSuffix: ' (tu)',
    caloriesLabel: (n: number) => `${n} kcal`,
    sessionsLabel: (n: number) => `${n} sessioni`,
    addFriendsTitle: 'Aggiungi amici',
    addFriendsBody: 'Sfida i tuoi amici nella classifica settimanale',
  },

  challengesWidget: {
    title: 'Sfide di oggi',
    progress: (completed: number, total: number) => `${completed}/${total} completate`,
    claimLabel: (credits: number) => `Riscatta +${credits} 💰`,
    pendingLabel: (credits: number) => `+${credits} 💰`,
  },

  // Incentivi al ritorno (v2, pilastro 04): rientro morbido dopo un'assenza
  comeback: {
    title: 'Bentornato!',
    body: (days: number) => `Sono passati ${days} giorni dall'ultimo allenamento. Nessun problema: si riparte da dove sei, non da zero.`,
    hint: 'Bastano 15 minuti per rimettere in moto tutto — e le sfide di oggi ti aspettano.',
    cta: 'Riparti con poco',
  },

  cta: 'Registra allenamento',
} as const

const en: Widen<typeof it> = {
  athleteFallback: 'Athlete',
  greeting: (hour: number) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'),
  streakUnit: (streak: number) => (streak === 1 ? 'day streak' : 'day streak'),
  weeklyGoalLabel: 'Weekly goal',
  weekGoalReached: '🎉 Goal reached!',
  weekGoalRemaining: (n: number) => `${n} session${n === 1 ? '' : 's'} to go`,

  freezeOffer: {
    title: 'Streak at risk!',
    prefix: 'You didn\'t log anything yesterday. Protect your streak of',
    dayUnit: (n: number) => (n === 1 ? 'day' : 'days'),
    suffix: 'by spending 300 credits.',
    freezing: 'Freezing...',
    freezeButton: '🧊 Freeze streak (−300 💰)',
    insufficientCredits: (credits: number) => `Not enough credits (${credits}/300)`,
  },

  dailyCalorieGoal: {
    title: 'Calories burned today',
    suffix: (goal: number) => ` / ${goal} kcal`,
    noGoalSuffix: ' kcal',
    reached: '🎉 Calorie goal reached!',
  },

  ring: {
    centerLabel: 'Week',
    streakLabel: 'Streak',
    streakDaysLabel: (n: number) => (n === 1 ? '1 day' : `${n} days`),
    srSummary: (sessions: number, goal: number, calories: number, streakDays: number) =>
      `Weekly goal: ${sessions} of ${goal} sessions. Today's calories: ${calories}. Streak: ${streakDays} ${streakDays === 1 ? 'day' : 'days'}.`,
  },

  sections: {
    recovery: 'Recovery',
    recent: 'Recent activity',
    progress: 'Your journey',
    circle: 'Your circle',
  },

  lastActivity: {
    title: 'Last activity',
    meta: (durationMin: number, calories: number | null | undefined, distanceKm: number | null | undefined) =>
      `${durationMin} min${calories ? ` · ${calories} kcal` : ''}${distanceKm ? ` · ${distanceKm} km` : ''}`,
    repeat: 'Repeat this workout',
  },

  emptyState: {
    title: 'Ready to sweat?',
    body: 'Log your first activity and start building your streak. Every great athlete had a day one.',
    cta: '💪 Start now',
  },

  nearestMedal: {
    title: 'Closest medal',
  },

  leaderboard: {
    title: 'Weekly leaderboard',
    youSuffix: ' (you)',
    caloriesLabel: (n: number) => `${n} kcal`,
    sessionsLabel: (n: number) => `${n} session${n === 1 ? '' : 's'}`,
    addFriendsTitle: 'Add friends',
    addFriendsBody: 'Challenge your friends on the weekly leaderboard',
  },

  challengesWidget: {
    title: 'Today\'s challenges',
    progress: (completed: number, total: number) => `${completed}/${total} completed`,
    claimLabel: (credits: number) => `Claim +${credits} 💰`,
    pendingLabel: (credits: number) => `+${credits} 💰`,
  },

  comeback: {
    title: 'Welcome back!',
    body: (days: number) => `It's been ${days} days since your last workout. No worries: you pick up right where you left off, not from zero.`,
    hint: 'Just 15 minutes to get everything moving again — and today\'s challenges are waiting for you.',
    cta: 'Ease back in',
  },

  cta: 'Log a workout',
}

const home = createNamespaceProxy(it, en)

export default home
