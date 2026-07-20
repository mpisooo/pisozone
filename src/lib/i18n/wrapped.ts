import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per PisoZone Wrapped (lib/wrapped.ts, components/WrappedOverlay.tsx
// e la card d'ingresso in Statistiche). I titoli dei periodi ("Giugno 2026")
// arrivano da wrappedTitle via date-fns, non da qui.
const it = {
  entry: {
    heading: 'PISOZONE WRAPPED',
    description: 'I tuoi allenamenti raccontati in numeri: rivivili slide dopo slide e condividili come immagine.',
    monthButton: (title: string) => `Rivivi ${title}`,
    yearButton: (title: string) => `Il tuo ${title}`,
  },

  ariaLabel: 'PisoZone Wrapped',
  close: 'Chiudi',
  back: 'Slide precedente',
  forward: 'Slide successiva',
  kicker: 'PISOZONE WRAPPED',

  intro: {
    subtitle: {
      month: 'Un mese di allenamenti, raccontato in numeri.',
      year: 'Un anno di allenamenti, raccontato in numeri.',
    },
    tapHint: 'Tocca per continuare',
  },

  sessions: {
    kicker: 'ALLENAMENTI',
    activeDays: (n: number) => (n === 1 ? 'in 1 giorno attivo' : `in ${n} giorni attivi`),
    vsPrev: {
      month: (pct: number) => `Il ${pct}% in più del mese precedente`,
      year: (pct: number) => `Il ${pct}% in più dell'anno precedente`,
    },
  },

  time: {
    kicker: 'TEMPO IN MOVIMENTO',
    calories: (formatted: string) => `${formatted} kcal bruciate`,
    km: (formatted: string) => `${formatted} km percorsi`,
  },

  topSport: {
    kicker: 'IL TUO SPORT',
    sessions: (n: number) => (n === 1 ? '1 sessione' : `${n} sessioni`),
    distinct: (n: number) => `E hai provato ${n} sport diversi`,
  },

  records: {
    kicker: 'I TUOI RECORD',
    streakLabel: 'Giorni di fila',
    busiestLabel: 'Il giorno più carico',
    longestLabel: 'La sessione più lunga',
  },

  zones: {
    kicker: 'SPETTRO DI INTENSITÀ',
    headline: (zoneLabel: string) => `Hai vissuto in zona ${zoneLabel}`,
  },

  final: {
    kicker: 'IN UNA CARD',
    share: 'Condividi come immagine',
    sharing: "Preparo l'immagine…",
    shareError: 'Condivisione non riuscita. Riprova.',
  },
} as const

const en: Widen<typeof it> = {
  entry: {
    heading: 'PISOZONE WRAPPED',
    description: 'Your workouts told in numbers: relive them slide by slide and share as an image.',
    monthButton: (title: string) => `Relive ${title}`,
    yearButton: (title: string) => `Your ${title}`,
  },

  ariaLabel: 'PisoZone Wrapped',
  close: 'Close',
  back: 'Previous slide',
  forward: 'Next slide',
  kicker: 'PISOZONE WRAPPED',

  intro: {
    subtitle: {
      month: 'A month of workouts, told in numbers.',
      year: 'A year of workouts, told in numbers.',
    },
    tapHint: 'Tap to continue',
  },

  sessions: {
    kicker: 'WORKOUTS',
    activeDays: (n: number) => (n === 1 ? 'in 1 active day' : `in ${n} active days`),
    vsPrev: {
      month: (pct: number) => `${pct}% more than last month`,
      year: (pct: number) => `${pct}% more than last year`,
    },
  },

  time: {
    kicker: 'TIME IN MOTION',
    calories: (formatted: string) => `${formatted} kcal burned`,
    km: (formatted: string) => `${formatted} km covered`,
  },

  topSport: {
    kicker: 'YOUR SPORT',
    sessions: (n: number) => (n === 1 ? '1 session' : `${n} sessions`),
    distinct: (n: number) => `And you tried ${n} different sports`,
  },

  records: {
    kicker: 'YOUR RECORDS',
    streakLabel: 'Days in a row',
    busiestLabel: 'Your busiest day',
    longestLabel: 'Your longest session',
  },

  zones: {
    kicker: 'INTENSITY SPECTRUM',
    headline: (zoneLabel: string) => `You lived in the ${zoneLabel} zone`,
  },

  final: {
    kicker: 'IN ONE CARD',
    share: 'Share as image',
    sharing: 'Preparing the image…',
    shareError: 'Couldn\'t share. Please try again.',
  },
}

const wrapped = createNamespaceProxy(it, en)

export default wrapped
