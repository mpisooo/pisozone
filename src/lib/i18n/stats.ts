// Namespace per src/pages/Stats.tsx, src/components/AnalisiTabs.tsx e le
// stringhe utente di src/lib/stats.ts (etichette giorni della settimana e
// intestazione del CSV esportato). I valori del CSV/etichette giorni devono
// restare identici byte-per-byte: src/lib/stats.test.ts li verifica.
const stats = {
  tabs: {
    calendar: 'Calendario',
    stats: 'Statistiche',
  },

  periods: {
    today: 'Oggi',
    week: 'Settimana',
    month: 'Mese',
    year: 'Anno',
    all: 'Sempre',
  },

  metrics: {
    minutes: { label: 'Minuti', unit: ' min' },
    sessions: { label: 'Sessioni', unit: '' },
    calories: { label: 'Calorie', unit: ' kcal' },
    km: { label: 'Km', unit: ' km' },
  },

  cards: {
    sessions: 'Sessioni',
    totalMinutes: 'Minuti totali',
    calories: 'Calorie',
    km: 'Km percorsi',
    emptyValue: '—',
  },

  topActivity: {
    label: 'Attività più frequente',
    sessionsCount: (n: number) => `${n} sessioni`,
  },

  trend: {
    heading: 'ANDAMENTO',
  },

  weekdays: {
    heading: 'IN QUALI GIORNI TI ALLENI',
    seriesName: 'Sessioni',
  },

  goal: {
    heading: 'OBIETTIVO VS REALE',
    reachedBefore: 'Obiettivo raggiunto in ',
    reachedAfter: ' delle ultime 8 settimane',
    tooltipValue: (value: unknown, goal: number) => `${value} su ${goal}`,
    tooltipName: 'Sessioni',
    referenceLabel: (goal: number) => `Obiettivo: ${goal}`,
  },

  pie: {
    heading: 'DISTRIBUZIONE ATTIVITÀ',
  },

  zones: {
    heading: 'SPETTRO DI INTENSITÀ',
    subtitle: 'Come si distribuiscono i minuti allenati tra le zone di sforzo',
  },

  weightTraining: {
    heading: 'PESO E ALLENAMENTO',
    subtitle: 'Peso medio e minuti di allenamento, settimana per settimana (ultime 12)',
    weightLabel: 'Peso (kg)',
    weightSeriesName: 'Peso medio',
    weightTooltipValue: (value: unknown) => `${value} kg`,
    trainingLabel: 'Minuti di allenamento',
    trainingSeriesName: 'Minuti',
    trainingTooltipName: 'Allenamento',
    trainingTooltipValue: (value: unknown) => `${value} min`,
  },

  gymRecords: {
    heading: 'RECORD PALESTRA',
    subtitle: 'Il tuo carico massimo di sempre, esercizio per esercizio',
    weightValue: (kg: number) => `${kg.toLocaleString('it-IT')} kg`,
  },

  records: {
    heading: 'RECORD PERSONALI',
    longestSession: 'Sessione più lunga',
    mostCalories: 'Più calorie bruciate',
    longestDistance: 'Distanza più lunga',
    busiestDay: 'Giorno più attivo',
    busiestDayDuration: (min: number) =>
      min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}min` : `${min}min`,
  },

  export: {
    heading: 'ESPORTA I DATI',
    description: 'Scarica le attività del periodo selezionato in formato CSV, pronto per Excel o Google Sheets.',
    button: (count: number) => `📄 Scarica CSV (${count} attività)`,
  },

  emptyState: {
    titleNoActivities: 'Niente ancora!',
    titleNoDataInPeriod: 'Nessun dato qui',
    descriptionNoActivities: 'Registra la tua prima attività per vedere le statistiche prendere vita.',
    descriptionNoDataInPeriod: 'Non hai attività in questo periodo. Prova a cambiare filtro o registra un allenamento.',
    ctaFirstActivity: '🏃 Prima attività',
    ctaLogActivity: '+ Registra allenamento',
  },

  // Anno in pixel: un quadratino per giorno, colorato per zona di intensità.
  yearPixels: {
    heading: (year: number) => `IL TUO ${year} IN PIXEL`,
    subtitle: 'Un quadratino per giorno: il colore è la zona di intensità dominante',
    activeDays: (n: number) => n === 1 ? '1 giorno attivo' : `${n} giorni attivi`,
    restLegend: 'Senza attività',
    gridAriaLabel: (year: number) => `Griglia dei giorni attivi del ${year} per zona di intensità`,
  },

  weekdayLabels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  monthInitials: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'],

  csv: {
    header: ['Data', 'Ora', 'Attività', 'Durata (min)', 'Calorie', 'Distanza (km)', 'Crediti', 'Note'],
  },
} as const

export default stats
