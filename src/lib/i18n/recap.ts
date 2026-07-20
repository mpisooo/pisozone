import { createNamespaceProxy, type Widen } from './proxy'

// Namespace del recap dopo-allenamento GPS (components/WorkoutRecapOverlay.tsx):
// l'overlay celebrativo che accoglie il salvataggio di un allenamento tracciato.
const it = {
  ariaLabel: 'Riepilogo allenamento completato',
  kicker: 'Allenamento completato',
  credits: (n: number) => `+${n} 💎 crediti guadagnati`,

  stats: {
    duration: 'Durata',
    distance: 'Distanza',
    avgPace: 'Passo medio',
    avgSpeed: 'Velocità media',
    calories: 'Calorie',
  },

  records: {
    firstOfSport: (km: string) => `Prima distanza registrata per questo sport: ${km} km. Da qui si misura tutto.`,
    longestDistance: (km: string) => `Distanza più lunga di sempre: ${km} km`,
    fastestPace: (pace: string) => `Passo più veloce di sempre: ${pace}/km`,
    fastestSpeed: (kmh: string) => `Velocità media più alta di sempre: ${kmh} km/h`,
  },

  // Note di stato sotto il titolo: una alla volta, mai entrambe.
  offlineNote: 'Salvata sul telefono: si sincronizza appena torni online. Percorso e dettagli di questa schermata non verranno conservati.',
  routeWarning: 'Percorso non salvato — durata, distanza e calorie sono corrette.',

  // Percorso nel feed (v45): consenso esplicito, default spento.
  routeShare: {
    label: 'Mostra il percorso agli amici nel feed',
    hint: 'Solo la sagoma del giro, mai la mappa. Puoi cambiare idea in ogni momento dal Calendario.',
    error: 'Impostazione non salvata. Riprova.',
  },

  share: 'Condividi come immagine',
  sharing: 'Condivisione…',
  shareError: 'Condivisione non riuscita. Riprova.',
  close: 'Chiudi',
} as const

const en: Widen<typeof it> = {
  ariaLabel: 'Workout summary',
  kicker: 'Workout completed',
  credits: (n: number) => `+${n} 💎 credits earned`,

  stats: {
    duration: 'Duration',
    distance: 'Distance',
    avgPace: 'Avg. pace',
    avgSpeed: 'Avg. speed',
    calories: 'Calories',
  },

  records: {
    firstOfSport: (km: string) => `First distance logged for this sport: ${km} km. Everything starts here.`,
    longestDistance: (km: string) => `Longest distance ever: ${km} km`,
    fastestPace: (pace: string) => `Fastest pace ever: ${pace}/km`,
    fastestSpeed: (kmh: string) => `Highest average speed ever: ${kmh} km/h`,
  },

  offlineNote: "Saved on your phone: it will sync as soon as you're back online. The route and details on this screen won't be kept.",
  routeWarning: 'Route not saved — duration, distance and calories are correct.',

  routeShare: {
    label: 'Show route to friends in the feed',
    hint: 'Just the route outline, never the real map. You can change your mind anytime from the Calendar.',
    error: 'Setting not saved. Please try again.',
  },

  share: 'Share as image',
  sharing: 'Sharing…',
  shareError: 'Sharing failed. Please try again.',
  close: 'Close',
}

const recap = createNamespaceProxy(it, en)

export default recap
