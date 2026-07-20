import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per src/pages/Stats.tsx, src/components/AnalisiTabs.tsx e le
// stringhe utente di src/lib/stats.ts (etichette giorni della settimana e
// intestazione del CSV esportato). I valori del CSV/etichette giorni devono
// restare identici byte-per-byte: src/lib/stats.test.ts li verifica.
const it = {
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
    chartAriaLabel: 'Grafico dell\'andamento nel tempo',
  },

  weekdays: {
    heading: 'IN QUALI GIORNI TI ALLENI',
    chartAriaLabel: 'Grafico delle sessioni per giorno della settimana',
  },

  goal: {
    heading: 'OBIETTIVO VS REALE',
    reachedBefore: 'Obiettivo raggiunto in ',
    reachedAfter: ' delle ultime 8 settimane',
    referenceLabel: (goal: number) => `Obiettivo: ${goal}`,
    chartAriaLabel: 'Grafico delle sessioni settimanali rispetto all\'obiettivo',
  },

  pie: {
    heading: 'DISTRIBUZIONE ATTIVITÀ',
    chartAriaLabel: 'Grafico della distribuzione delle attività per tipo',
  },

  zones: {
    heading: 'SPETTRO DI INTENSITÀ',
    subtitle: 'Come si distribuiscono i minuti allenati tra le zone di sforzo',
  },

  // Carico settimanale session-RPE (roadmap v3, pilastro 02): sforzo
  // percepito × minuti, con avviso quando il salto supera il +50%.
  trainingLoad: {
    heading: 'CARICO SETTIMANALE',
    subtitle: 'Sforzo percepito × minuti (session-RPE), settimana per settimana (ultime 8)',
    chartAriaLabel: 'Grafico del carico allenante settimanale',
    jumpWarning: (pct: number) =>
      `Carico in forte aumento: +${pct}% rispetto alla settimana scorsa. Sali gradualmente per ridurre il rischio di infortuni.`,
    coverageHint: (withRpe: number, total: number) =>
      `Calcolato sulle ${withRpe} sessioni con sforzo percepito su ${total}: compilarlo su ogni attività rende il grafico più fedele.`,
  },

  weightTraining: {
    heading: 'PESO E ALLENAMENTO',
    subtitle: 'Peso medio e minuti di allenamento, settimana per settimana (ultime 12)',
    weightLabel: 'Peso (kg)',
    weightChartAriaLabel: 'Grafico del peso medio settimanale',
    trainingLabel: 'Minuti di allenamento',
    trainingChartAriaLabel: 'Grafico dei minuti di allenamento settimanali',
  },

  gymRecords: {
    heading: 'RECORD PALESTRA',
    subtitle: 'Il tuo carico massimo di sempre, esercizio per esercizio',
    weightValue: (kg: number) => `${kg.toLocaleString('it-IT')} kg`,
  },

  // Progressione carichi: il grafico per esercizio dal log palestra (v32).
  progression: {
    heading: 'PROGRESSIONE CARICHI',
    subtitle: 'Il carico massimo di ogni giornata, sessione dopo sessione',
    chartAriaLabel: 'Grafico della progressione del carico per l\'esercizio selezionato',
    pointValue: (kg: number) => `${kg.toLocaleString('it-IT')} kg`,
    delta: (kg: number) => `${kg > 0 ? '+' : ''}${kg.toLocaleString('it-IT')} kg dalla prima giornata`,
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

  // Passo gara previsto (roadmap v4, pilastro 01): stima Riegel dal miglior
  // passo corso negli ultimi 90 giorni. Card indipendente dal filtro periodo
  // della pagina — la stima guarda sempre agli ultimi 90 giorni veri.
  racePredictor: {
    heading: 'PASSO GARA PREVISTO',
    subheading: (km: number, time: string) => `Stima dal tuo passo migliore recente: ${km.toLocaleString('it-IT')} km in ${time}`,
    chartAriaLabel: 'Tempi di gara previsti per 5K, 10K, mezza maratona e maratona',
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
    ctaFirstActivity: 'Prima attività',
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

const en: Widen<typeof it> = {
  tabs: {
    calendar: 'Calendar',
    stats: 'Stats',
  },

  periods: {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    all: 'All time',
  },

  metrics: {
    minutes: { label: 'Minutes', unit: ' min' },
    sessions: { label: 'Sessions', unit: '' },
    calories: { label: 'Calories', unit: ' kcal' },
    km: { label: 'Km', unit: ' km' },
  },

  cards: {
    sessions: 'Sessions',
    totalMinutes: 'Total minutes',
    calories: 'Calories',
    km: 'Km covered',
    emptyValue: '—',
  },

  topActivity: {
    label: 'Most frequent activity',
    sessionsCount: (n: number) => `${n} session${n === 1 ? '' : 's'}`,
  },

  trend: {
    heading: 'TREND',
    chartAriaLabel: 'Chart of trend over time',
  },

  weekdays: {
    heading: 'WHICH DAYS YOU TRAIN',
    chartAriaLabel: 'Chart of sessions by day of the week',
  },

  goal: {
    heading: 'GOAL VS ACTUAL',
    reachedBefore: 'Goal reached in ',
    reachedAfter: ' of the last 8 weeks',
    referenceLabel: (goal: number) => `Goal: ${goal}`,
    chartAriaLabel: 'Chart of weekly sessions versus your goal',
  },

  pie: {
    heading: 'ACTIVITY BREAKDOWN',
    chartAriaLabel: 'Chart of activity breakdown by type',
  },

  zones: {
    heading: 'INTENSITY SPECTRUM',
    subtitle: 'How your trained minutes are spread across effort zones',
  },

  trainingLoad: {
    heading: 'WEEKLY LOAD',
    subtitle: 'Perceived effort × minutes (session-RPE), week by week (last 8)',
    chartAriaLabel: 'Chart of weekly training load',
    jumpWarning: (pct: number) =>
      `Load rising sharply: +${pct}% versus last week. Ramp up gradually to lower your injury risk.`,
    coverageHint: (withRpe: number, total: number) =>
      `Calculated from ${withRpe} of ${total} sessions with a perceived effort logged: fill it in on every activity for a more accurate chart.`,
  },

  weightTraining: {
    heading: 'WEIGHT AND TRAINING',
    subtitle: 'Average weight and training minutes, week by week (last 12)',
    weightLabel: 'Weight (kg)',
    weightChartAriaLabel: 'Chart of average weekly weight',
    trainingLabel: 'Training minutes',
    trainingChartAriaLabel: 'Chart of weekly training minutes',
  },

  gymRecords: {
    heading: 'GYM RECORDS',
    subtitle: 'Your all-time max load, exercise by exercise',
    weightValue: (kg: number) => `${kg.toLocaleString('en-US')} kg`,
  },

  progression: {
    heading: 'LOAD PROGRESSION',
    subtitle: 'Your max load each day, session after session',
    chartAriaLabel: 'Chart of load progression for the selected exercise',
    pointValue: (kg: number) => `${kg.toLocaleString('en-US')} kg`,
    delta: (kg: number) => `${kg > 0 ? '+' : ''}${kg.toLocaleString('en-US')} kg since day one`,
  },

  records: {
    heading: 'PERSONAL RECORDS',
    longestSession: 'Longest session',
    mostCalories: 'Most calories burned',
    longestDistance: 'Longest distance',
    busiestDay: 'Busiest day',
    busiestDayDuration: (min: number) =>
      min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}min` : `${min}min`,
  },

  racePredictor: {
    heading: 'PREDICTED RACE PACE',
    subheading: (km: number, time: string) => `Estimated from your best recent pace: ${km.toLocaleString('en-US')} km in ${time}`,
    chartAriaLabel: 'Predicted race times for 5K, 10K, half marathon and marathon',
  },

  export: {
    heading: 'EXPORT YOUR DATA',
    description: 'Download the activities from the selected period as a CSV, ready for Excel or Google Sheets.',
    button: (count: number) => `📄 Download CSV (${count} ${count === 1 ? 'activity' : 'activities'})`,
  },

  emptyState: {
    titleNoActivities: 'Nothing yet!',
    titleNoDataInPeriod: 'No data here',
    descriptionNoActivities: 'Log your first activity to see your stats come to life.',
    descriptionNoDataInPeriod: 'You have no activities in this period. Try changing the filter or log a workout.',
    ctaFirstActivity: 'First activity',
    ctaLogActivity: '+ Log a workout',
  },

  yearPixels: {
    heading: (year: number) => `YOUR ${year} IN PIXELS`,
    subtitle: 'One little square per day: color shows the dominant intensity zone',
    activeDays: (n: number) => n === 1 ? '1 active day' : `${n} active days`,
    restLegend: 'No activity',
    gridAriaLabel: (year: number) => `Grid of active days in ${year} by intensity zone`,
  },

  weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  monthInitials: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],

  csv: {
    header: ['Date', 'Time', 'Activity', 'Duration (min)', 'Calories', 'Distance (km)', 'Credits', 'Notes'],
  },
}

const stats = createNamespaceProxy(it, en)

export default stats
