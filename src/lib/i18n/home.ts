// Namespace esclusivo di Home.tsx (dashboard): saluto, streak, obiettivo
// settimanale, streak freeze, obiettivo calorico, ultima attività, medaglia
// più vicina, classifica e sfide di oggi in anteprima.
const home = {
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
    recent: 'Attività recente',
    progress: 'Il tuo percorso',
    circle: 'La tua cerchia',
  },

  lastActivity: {
    title: 'Ultima attività',
    meta: (durationMin: number, calories: number | null | undefined, distanceKm: number | null | undefined) =>
      `${durationMin} min${calories ? ` · ${calories} kcal` : ''}${distanceKm ? ` · ${distanceKm} km` : ''}`,
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

  cta: 'Registra allenamento',
} as const

export default home
