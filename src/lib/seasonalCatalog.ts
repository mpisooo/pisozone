import type { ActivityType } from '../types'

// SOLO il catalogo degli eventi stagionali: dati puri, zero dipendenze.
// Separato da lib/seasonalEvents.ts (che lo ri-esporta insieme agli helper
// con date-fns) perché la campanella delle notifiche — nel chunk d'ingresso —
// ha bisogno solo dei titoli per la voce "podio": importare gli helper da lì
// trascinerebbe date-fns nel bundle iniziale (successo davvero: +18 kB gzip).
//
// GEMELLO SERVER: SEASONAL_WINDOWS in api/_lib/seasonalPodium.ts replica
// chiavi e finestre per il cron del podio — aggiornare in coppia (il test
// seasonalPodium.test.ts fallisce se divergono).

export type SeasonalMetric = 'sessions' | 'minutes' | 'km' | 'kcal'

export interface SeasonalEventDef {
  key: string
  title: string
  subtitle: string
  icon: string // emoji: linguaggio della gamification, come sfide e programmi
  metric: SeasonalMetric
  activityType?: ActivityType // opzionale: l'evento vale solo per questo sport
  startsOn: string // yyyy-MM-dd
  endsOn: string   // yyyy-MM-dd
}

// Crediti al podio, decrescenti: anteprima in UI, ma l'importo vero lo decide
// comunque il trigger DB (guard_seasonal_claim) dai dati reali.
export const SEASONAL_PODIUM_CREDITS: Record<1 | 2 | 3, number> = { 1: 150, 2: 100, 3: 60 }

// Finestra massima di un evento (coerente col check DB): una stagione intera,
// non un anno.
export const SEASONAL_MAX_WINDOW_DAYS = 120

export const SEASONAL_EVENTS: SeasonalEventDef[] = [
  {
    key: 'estate-2026',
    title: 'Sfida d\'estate',
    subtitle: 'Chi percorre più chilometri entro fine agosto sale sul podio.',
    icon: '☀️',
    metric: 'km',
    startsOn: '2026-07-01',
    endsOn: '2026-08-31',
  },
  {
    key: 'rientro-2026',
    title: 'Rientro in forma',
    subtitle: 'Settembre riparte: chi totalizza più sessioni sale sul podio.',
    icon: '🍂',
    metric: 'sessions',
    startsOn: '2026-09-01',
    endsOn: '2026-09-30',
  },
  // Autunno/inverno (roadmap v3, pilastro 03): senza queste voci la sezione
  // sarebbe morta a ottobre. La finestra invernale scavalca il capodanno
  // (62 giorni, entro il tetto di 120): la classifica non si azzera al 1/1.
  {
    key: 'autunno-2026',
    title: 'Maratona d\'autunno',
    subtitle: 'Ottobre e novembre: chi accumula più minuti di movimento sale sul podio.',
    icon: '🍁',
    metric: 'minutes',
    startsOn: '2026-10-01',
    endsOn: '2026-11-30',
  },
  {
    key: 'inverno-2026',
    title: 'Fuoco d\'inverno',
    subtitle: 'Il freddo non ti ferma: chi brucia più calorie fino a fine gennaio sale sul podio.',
    icon: '❄️',
    metric: 'kcal',
    startsOn: '2026-12-01',
    endsOn: '2027-01-31',
  },
]
