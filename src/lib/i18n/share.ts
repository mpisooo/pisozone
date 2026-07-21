import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per le card condivisibili come immagine (lib/shareCard.ts e i
// punti di ingresso: ActivityEditModal, WrappedOverlay). I valori numerici
// vengono formattati in lib/shareCard.ts; qui vivono etichette e messaggi.
const it = {
  activityButton: "Condividi l'attività come immagine",
  readinessButton: 'Condividi la prontezza come immagine',
  segmentPrButton: 'Condividi il record come immagine',
  racePredictorButton: 'Condividi la stima gara come immagine',
  error: 'Condivisione non riuscita. Riprova.',

  card: {
    activityKicker: 'ALLENAMENTO COMPLETATO',
    wrappedKicker: 'PISOZONE WRAPPED',
    wrappedSubtitle: {
      month: 'Il mio mese in movimento',
      year: 'Il mio anno in movimento',
    },
    duration: 'Durata',
    calories: 'Calorie',
    distance: 'Distanza',
    sessions: 'Sessioni',
    time: 'Tempo totale',
    km: 'Chilometri',
    activeDays: 'Giorni attivi',
    // Share card 2.0: kicker sopra le barre del passo per km (viene reso in
    // maiuscolo dal canvas, qui resta leggibile).
    splitsKicker: (pace: string) => `Passo per km — il più veloce ${pace}`,
    footer: 'pisozone-app.vercel.app',
    // Card condivisibili per le flagship della v4 (roadmap v5, pilastro 03):
    // Prontezza e PR di segmento, sullo stesso modello di attività/Wrapped.
    readinessKicker: 'PUNTEGGIO DI PRONTEZZA',
    segmentPrKicker: 'NUOVO RECORD DI PERCORSO',
    segmentTime: 'Tempo',
    segmentDistance: 'Distanza',
    racePredictorKicker: 'PASSO GARA PREVISTO',
    racePredictorTitle: 'STIMA GARA',
  },
} as const

const en: Widen<typeof it> = {
  activityButton: 'Share activity as image',
  readinessButton: 'Share readiness as image',
  segmentPrButton: 'Share record as image',
  racePredictorButton: 'Share race estimate as image',
  error: 'Sharing failed. Please try again.',

  card: {
    activityKicker: 'WORKOUT COMPLETED',
    wrappedKicker: 'PISOZONE WRAPPED',
    wrappedSubtitle: {
      month: 'My month in motion',
      year: 'My year in motion',
    },
    duration: 'Duration',
    calories: 'Calories',
    distance: 'Distance',
    sessions: 'Sessions',
    time: 'Total time',
    km: 'Kilometers',
    activeDays: 'Active days',
    splitsKicker: (pace: string) => `Pace per km — fastest ${pace}`,
    footer: 'pisozone-app.vercel.app',
    readinessKicker: 'READINESS SCORE',
    segmentPrKicker: 'NEW SEGMENT RECORD',
    segmentTime: 'Time',
    segmentDistance: 'Distance',
    racePredictorKicker: 'PREDICTED RACE PACE',
    racePredictorTitle: 'RACE ESTIMATE',
  },
}

const share = createNamespaceProxy(it, en)

export default share
