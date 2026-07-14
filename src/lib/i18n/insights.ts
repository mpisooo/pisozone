// Namespace per gli insight personalizzati (lib/insights.ts e
// components/InsightsCard.tsx). Le emoji degli insight vivono nelle regole in
// lib/insights.ts (linguaggio della gamification, come le sfide): qui c'è
// solo il testo. Ogni frase deve reggersi da sola, senza contesto.
const insights = {
  heading: 'I TUOI INSIGHT',
  subtitle: 'Cosa raccontano i tuoi ultimi allenamenti',

  // Con l'articolo, per comporre frasi come "Il martedì è il tuo giorno"
  // (la domenica è femminile). Ordine lun→dom come stats.weekdayLabels.
  weekdayNames: ['Il lunedì', 'Il martedì', 'Il mercoledì', 'Il giovedì', 'Il venerdì', 'Il sabato', 'La domenica'],

  texts: {
    gettingStarted: (n: number) =>
      n === 1
        ? 'Prima attività registrata! Continua ad allenarti: gli insight si sbloccano man mano che i dati crescono.'
        : `${n} attività registrate. Continua così: più ti alleni, più questi insight diventano interessanti.`,
    recordWeek: (time: string) =>
      `Settimana record: ${time} di allenamento, il tuo massimo delle ultime 12 settimane.`,
    volumeUp: (pct: number) =>
      `Ritmo in crescita: negli ultimi 7 giorni ti sei allenato il ${pct}% in più della settimana precedente.`,
    volumeDown:
      'Settimana più leggera della scorsa: capita a tutti. Una sessione breve oggi rimette tutto in moto.',
    consistency: (weeks: number) =>
      `Costanza vera: obiettivo settimanale centrato in ${weeks} delle ultime 4 settimane.`,
    topSport: (sport: string, sessions: number) =>
      `Il tuo mese parla chiaro: ${sessions} sessioni di ${sport.toLowerCase()}. È il tuo sport del momento.`,
    weekdayHabit: (dayWithArticle: string) =>
      `${dayWithArticle} è il tuo giorno: è lì che ti alleni più spesso.`,
    timeOfDay: {
      morning: 'Tipo mattiniero: la maggior parte dei tuoi allenamenti parte prima di mezzogiorno.',
      afternoon: 'Il pomeriggio è il tuo momento: è lì che si concentra la maggior parte dei tuoi allenamenti.',
      evening: 'Atleta serale: i tuoi allenamenti vivono dopo il tramonto.',
    },
    kmUp: (pct: number) =>
      `Macini strada: ${pct}% di chilometri in più negli ultimi 30 giorni rispetto ai 30 precedenti.`,
    rpeHigh:
      'Sforzo percepito alto per tutta la settimana: il corpo migliora quando recupera. Concediti una sessione leggera o un giorno di riposo.',
    zonePush:
      'Vai sempre a tutto gas: quasi nessun minuto in zona recupero. Una camminata o una sessione di yoga completerebbero il quadro.',
    moodHigh:
      "Lo sport ti mette di buon umore: dopo l'allenamento il tuo umore è quasi sempre alle stelle.",
  },
} as const

export default insights
