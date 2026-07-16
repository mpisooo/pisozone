// Namespace del recap dopo-allenamento GPS (components/WorkoutRecapOverlay.tsx):
// l'overlay celebrativo che accoglie il salvataggio di un allenamento tracciato.
const recap = {
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

  share: 'Condividi come immagine',
  sharing: 'Condivisione…',
  shareError: 'Condivisione non riuscita. Riprova.',
  close: 'Chiudi',
} as const

export default recap
