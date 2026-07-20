import type { Activity, ActivityType } from '../types'

// Log lampo (roadmap v3, pilastro 02): ripetere un allenamento già fatto senza
// ricompilare il form. Un prefill è il sottoinsieme dei campi del form di Log
// che ha senso ricopiare da un'attività passata: data e ora restano quelle di
// adesso, le calorie restano al calcolo automatico (dipendono dal peso di
// OGGI, non da quello di allora) e note/foto non si ereditano.
export interface QuickLogPrefill {
  type: ActivityType
  durationMin: number
  distanceKm: number | null
  indoor: boolean | null
  elevationGainM: number | null
}

export function prefillFromActivity(a: Activity): QuickLogPrefill {
  return {
    type: a.type,
    durationMin: a.duration_min,
    distanceKm: a.distance_km ?? null,
    indoor: a.indoor ?? null,
    elevationGainM: a.elevation_gain_m ?? null,
  }
}

// Ultima attività di un dato sport. Le liste di useActivities arrivano già in
// ordine di data discendente, ma non fidarsi dell'ordinamento è gratis (le
// pending in coda offline vengono accodate fuori sequenza).
export function lastActivityOfType(activities: Activity[], type: ActivityType): Activity | null {
  let best: Activity | null = null
  for (const a of activities) {
    if (a.type !== type) continue
    if (!best || a.date > best.date) best = a
  }
  return best
}
