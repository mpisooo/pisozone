// Namespace per src/pages/Calendar.tsx (mese, streak, pannello del giorno).
const calendar = {
  prevMonthAria: 'Mese precedente',
  nextMonthAria: 'Mese successivo',

  weekdayShortLabels: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],

  dayAriaLabel: (dateLabel: string, count: number) =>
    `${dateLabel}, ${count} ${count === 1 ? 'attività' : 'attività registrate'}`,

  legendLabel: 'Attività/giorno:',

  streakCount: (days: number) => `${days} GIORNI CONSECUTIVI`,
  streakHint: 'Continua così, non fermarti!',

  restDayTitle: 'Giornata di riposo',
  restDaySubtitle: 'Nessun allenamento registrato',

  // Giorno di riposo intenzionale (recovery_logs, v33): distinto dal semplice
  // "nessun allenamento" — qui la streak è protetta.
  plannedRestBadge: 'Riposo segnato — la streak è al sicuro',
  restDotAria: 'giorno di riposo',

  dayPanel: {
    durationLabel: (min: number) => `${min} min`,
    caloriesSuffix: (cal: number) => ` · ${cal} kcal`,
    distanceSuffix: (km: number) => ` · ${km} km`,
  },

  editHint: 'Tocca un\'attività per modificarla',
} as const

export default calendar
