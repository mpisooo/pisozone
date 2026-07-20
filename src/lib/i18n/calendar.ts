import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per src/pages/Calendar.tsx (mese, streak, pannello del giorno).
const it = {
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

  // Filtri e ricerca (roadmap v3, pilastro 02): sport, GPS, foto, note.
  // Con filtri attivi la heatmap mostra solo le attività corrispondenti e
  // sotto compare la lista dei risultati più recenti.
  filters: {
    toggle: 'Filtri',
    toggleAria: 'Mostra o nascondi i filtri delle attività',
    searchPlaceholder: 'Cerca nelle note…',
    searchAria: 'Cerca nelle note delle attività',
    sportsLabel: 'Sport',
    gpsChip: 'Con GPS',
    photoChip: 'Con foto',
    clear: 'Azzera filtri',
    heatmapHint: 'Il calendario mostra solo le attività filtrate',
    resultsCount: (n: number) => (n === 1 ? '1 attività trovata' : `${n} attività trovate`),
    resultsShownHint: (shown: number) => `Qui sotto le ${shown} più recenti`,
    noResults: 'Nessuna attività corrisponde ai filtri.',
  },
} as const

const en: Widen<typeof it> = {
  prevMonthAria: 'Previous month',
  nextMonthAria: 'Next month',

  weekdayShortLabels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],

  dayAriaLabel: (dateLabel: string, count: number) =>
    `${dateLabel}, ${count} ${count === 1 ? 'activity' : 'activities logged'}`,

  legendLabel: 'Activities/day:',

  streakCount: (days: number) => `${days} DAY STREAK`,
  streakHint: "Keep it up, don't stop!",

  restDayTitle: 'Rest day',
  restDaySubtitle: 'No workout logged',

  // Giorno di riposo intenzionale (recovery_logs, v33): distinto dal semplice
  // "nessun allenamento" — qui la streak è protetta.
  plannedRestBadge: 'Rest logged — your streak is safe',
  restDotAria: 'rest day',

  dayPanel: {
    durationLabel: (min: number) => `${min} min`,
    caloriesSuffix: (cal: number) => ` · ${cal} kcal`,
    distanceSuffix: (km: number) => ` · ${km} km`,
  },

  editHint: 'Tap an activity to edit it',

  // Filtri e ricerca (roadmap v3, pilastro 02): sport, GPS, foto, note.
  // Con filtri attivi la heatmap mostra solo le attività corrispondenti e
  // sotto compare la lista dei risultati più recenti.
  filters: {
    toggle: 'Filters',
    toggleAria: 'Show or hide activity filters',
    searchPlaceholder: 'Search notes…',
    searchAria: 'Search activity notes',
    sportsLabel: 'Sport',
    gpsChip: 'With GPS',
    photoChip: 'With photo',
    clear: 'Clear filters',
    heatmapHint: 'The calendar shows only filtered activities',
    resultsCount: (n: number) => (n === 1 ? '1 activity found' : `${n} activities found`),
    resultsShownHint: (shown: number) => `Showing the ${shown} most recent below`,
    noResults: 'No activities match the filters.',
  },
}

const calendar = createNamespaceProxy(it, en)

export default calendar
