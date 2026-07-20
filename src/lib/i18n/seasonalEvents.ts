import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per gli eventi stagionali (lib/seasonalEvents.ts,
// hooks/useSeasonalEvent.ts, components/SeasonalEventSection.tsx nella
// pagina Sfide). Classifica aperta a tutta la community, non solo agli
// amici — a differenza dei duelli (namespace duels).
const it = {
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

// Suffisso ordinale inglese per il podio (1°/2°/3° posto).
const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)

const en: Widen<typeof it> = {
  heading: 'SEASONAL EVENT',
  daysLeft: (n: number) => (n === 0 ? 'Last day' : n === 1 ? '1 day left' : `${n} days left`),
  youSuffix: ' (you)',
  emptyHint: 'No activities logged for this event yet: be the first to get in the game!',
  andMore: (n: number) => `+${n} more`,

  metricLabels: {
    sessions: 'Sessions',
    minutes: 'Minutes',
    km: 'Kilometers',
    kcal: 'Calories',
  } as Record<string, string>,

  podiumEmoji: { 1: '🥇', 2: '🥈', 3: '🥉' } as Record<number, string>,

  claim: {
    heading: (rank: number, eventTitle: string) => `${ordinal(rank)} place in "${eventTitle}"!`,
    body: (credits: number) => `Event closed, you made the podium: claim +${credits} 💰`,
    button: 'Claim',
    claiming: 'Claiming…',
    failed: 'Claim failed. Please try again.',
  },

  upcoming: {
    label: (title: string, dateLabel: string) => `Next event: ${title}, starting ${dateLabel}`,
  },
}

const seasonalEvents = createNamespaceProxy(it, en)

export default seasonalEvents
