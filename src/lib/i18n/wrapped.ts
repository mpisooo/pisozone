// Namespace per PisoZone Wrapped (lib/wrapped.ts, components/WrappedOverlay.tsx
// e la card d'ingresso in Statistiche). I titoli dei periodi ("Giugno 2026")
// arrivano da wrappedTitle via date-fns, non da qui.
const wrapped = {
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

export default wrapped
