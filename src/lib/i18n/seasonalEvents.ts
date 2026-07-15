// Namespace per gli eventi stagionali (lib/seasonalEvents.ts,
// hooks/useSeasonalEvent.ts, components/SeasonalEventSection.tsx nella
// pagina Sfide). Classifica aperta a tutta la community, non solo agli
// amici — a differenza dei duelli (namespace duels).
const seasonalEvents = {
  heading: 'EVENTO STAGIONALE',
  daysLeft: (n: number) => (n === 0 ? 'Ultimo giorno' : n === 1 ? '1 giorno rimasto' : `${n} giorni rimasti`),
  youSuffix: ' (tu)',
  emptyHint: 'Nessuna attività registrata ancora in questo evento: sii il primo a scendere in campo!',
  andMore: (n: number) => `+ altri ${n}`,

  metricLabels: {
    sessions: 'Sessioni',
    minutes: 'Minuti',
    km: 'Chilometri',
    kcal: 'Calorie',
  } as Record<string, string>,

  podiumEmoji: { 1: '🥇', 2: '🥈', 3: '🥉' } as Record<number, string>,

  claim: {
    heading: (rank: number, eventTitle: string) => `${rank}° posto in "${eventTitle}"!`,
    body: (credits: number) => `Evento chiuso, sei sul podio: riscatta +${credits} 💰`,
    button: 'Riscatta',
    claiming: 'Riscatto…',
    failed: 'Riscatto non riuscito. Riprova.',
  },

  upcoming: {
    label: (title: string, dateLabel: string) => `Prossimo evento: ${title}, dal ${dateLabel}`,
  },
} as const

export default seasonalEvents
