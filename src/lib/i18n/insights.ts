import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per gli insight personalizzati (lib/insights.ts e
// components/InsightsCard.tsx). Le emoji degli insight vivono nelle regole in
// lib/insights.ts (linguaggio della gamification, come le sfide): qui c'è
// solo il testo. Ogni frase deve reggersi da sola, senza contesto.
const it = {
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

const en: Widen<typeof it> = {
  heading: 'YOUR INSIGHTS',
  subtitle: 'What your recent workouts are telling you',

  // Niente articolo in inglese (a differenza dell'italiano "Il lunedì"):
  // weekdayHabit compone comunque una frase naturale. Ordine lun→dom come
  // stats.weekdayLabels.
  weekdayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

  texts: {
    gettingStarted: (n: number) =>
      n === 1
        ? 'First activity logged! Keep training: insights unlock as your data grows.'
        : `${n} activities logged. Keep it up: the more you train, the more interesting these insights get.`,
    recordWeek: (time: string) =>
      `Record week: ${time} of training, your best in the last 12 weeks.`,
    volumeUp: (pct: number) =>
      `Ramping up: over the last 7 days you trained ${pct}% more than the previous week.`,
    volumeDown:
      'Lighter week than the last one: it happens to everyone. A short session today gets things moving again.',
    consistency: (weeks: number) =>
      `Real consistency: you hit your weekly goal in ${weeks} of the last 4 weeks.`,
    topSport: (sport: string, sessions: number) =>
      `Your month says it all: ${sessions} sessions of ${sport.toLowerCase()}. It's your go-to sport right now.`,
    weekdayHabit: (dayWithArticle: string) =>
      `${dayWithArticle} is your day: that's when you train most often.`,
    timeOfDay: {
      morning: 'Early bird: most of your workouts start before noon.',
      afternoon: "Afternoons are your time: that's when most of your workouts happen.",
      evening: 'Evening athlete: your workouts come alive after sunset.',
    },
    kmUp: (pct: number) =>
      `Covering ground: ${pct}% more kilometers in the last 30 days than the previous 30.`,
    rpeHigh:
      'Perceived effort has been high all week: your body improves when it recovers. Give yourself a light session or a rest day.',
    zonePush:
      "You're always going flat out: almost no minutes in the recovery zone. A walk or a yoga session would round things out nicely.",
    moodHigh:
      'Sport puts you in a good mood: after training your mood is almost always through the roof.',
  },
}

const insights = createNamespaceProxy(it, en)

export default insights
