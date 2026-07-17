// Podio stagionale → centro notifiche (roadmap v3, pilastro 03): un trigger
// non può scattare "allo scadere" di una finestra, quindi è il cron serale a
// controllare se un evento si è appena chiuso e ad avvisare il podio.
//
// GEMELLO SERVER di SEASONAL_EVENTS (src/lib/seasonalEvents.ts): qui vivono
// solo chiave, metrica e finestra — quanto basta per ricalcolare il podio con
// gli stessi criteri del trigger guard_seasonal_claim (v39). Le due liste
// vanno aggiornate IN COPPIA: il test seasonalPodium.test.ts confronta i due
// cataloghi e fallisce se divergono (stesso patto di comeback.ts col suo
// gemello client).

export type SeasonalMetric = 'sessions' | 'minutes' | 'km' | 'kcal'

export interface SeasonalWindow {
  key: string
  metric: SeasonalMetric
  activityType?: string
  startsOn: string // yyyy-MM-dd
  endsOn: string   // yyyy-MM-dd
}

export const SEASONAL_WINDOWS: SeasonalWindow[] = [
  { key: 'estate-2026',  metric: 'km',       startsOn: '2026-07-01', endsOn: '2026-08-31' },
  { key: 'rientro-2026', metric: 'sessions', startsOn: '2026-09-01', endsOn: '2026-09-30' },
  { key: 'autunno-2026', metric: 'minutes',  startsOn: '2026-10-01', endsOn: '2026-11-30' },
  { key: 'inverno-2026', metric: 'kcal',     startsOn: '2026-12-01', endsOn: '2027-01-31' },
]

// Aritmetica su date yyyy-MM-dd senza dipendenze: qui non serve un fuso, le
// stringhe sono già giorni di calendario.
export function plusDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Eventi chiusi da poco, da annunciare: finestra di ripescaggio di qualche
// giorno così un cron saltato (deploy, incidente) non fa sparire il podio
// per sempre. L'idempotenza vera è il controllo "già notificato" nel cron.
export function seasonalEventsToAnnounce(romeToday: string, graceDays = 3): SeasonalWindow[] {
  return SEASONAL_WINDOWS.filter(
    (e) => e.endsOn < romeToday && e.endsOn >= plusDays(romeToday, -graceDays),
  )
}

export interface PodiumActivityRow {
  user_id: string
  duration_min: number | null
  distance_km: number | null
  calories: number | null
}

export interface PodiumEntry {
  user_id: string
  rank: number
  value: number
}

// Podio dai dati grezzi della finestra: stessa aggregazione e stesso rank del
// trigger guard_seasonal_claim (1 + quanti hanno STRETTAMENTE di più: i pari
// merito condividono la posizione), stesso requisito di valore positivo. Le
// righe arrivano già filtrate per finestra e sport dalla query del cron.
export function computeSeasonalPodium(rows: PodiumActivityRow[], metric: SeasonalMetric): PodiumEntry[] {
  const totals = new Map<string, number>()
  for (const r of rows) {
    const value =
      metric === 'sessions' ? 1
      : metric === 'minutes' ? (r.duration_min ?? 0)
      : metric === 'km' ? (r.distance_km ?? 0)
      : (r.calories ?? 0)
    totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + value)
  }

  const entries = [...totals.entries()]
    .filter(([, value]) => value > 0)
    .map(([user_id, value]) => ({
      user_id,
      value,
      rank: 1 + [...totals.values()].filter((v) => v > value).length,
    }))

  return entries
    .filter((e) => e.rank <= 3)
    .sort((a, b) => a.rank - b.rank || b.value - a.value)
}
