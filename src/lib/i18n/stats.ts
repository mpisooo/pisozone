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

export default stats
