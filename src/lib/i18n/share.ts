import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per le card condivisibili come immagine (lib/shareCard.ts e i
// punti di ingresso: ActivityEditModal, WrappedOverlay). I valori numerici
// vengono formattati in lib/shareCard.ts; qui vivono etichette e messaggi.
const it = {
  activityButton: "Condividi l'attività come immagine",
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
  },
} as const

const en: Widen<typeof it> = {
  activityButton: 'Share activity as image',
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
  },
}

const share = createNamespaceProxy(it, en)

export default share
