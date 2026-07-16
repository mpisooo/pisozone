import type { Activity, ActivityType } from '../types'
import type { TrackedPoint } from './gps'

// Recap del dopo-allenamento GPS (roadmap v3, pilastro 01 punto 1 — flagship).
// Qui vive SOLO la logica pura dei "record di percorso": il confronto tra
// l'attività appena salvata e lo storico dello stesso sport, testato con
// Vitest. La UI celebrativa sta in components/WorkoutRecapOverlay.tsx.

export type GpsRecordKind = 'firstOfSport' | 'longestDistance' | 'fastestPace'

export interface GpsRecord {
  kind: GpsRecordKind
  // km per firstOfSport/longestDistance, min/km per fastestPace
  value: number
}

// Tutto ciò che serve all'overlay di recap, assemblato in Log.tsx al
// salvataggio: i punti restano quelli locali del tracciamento, così il recap
// funziona anche quando il percorso non è arrivato sul server (offline).
export interface WorkoutRecapData {
  activity: Activity
  points: TrackedPoint[]
  records: GpsRecord[]
  // In coda offline: crediti a zero e percorso/dettagli GPS non conservati.
  pending: boolean
  // false = attività salvata ma percorso rifiutato dal server (best effort).
  routeSaved: boolean
}

// Sotto il km né la distanza né il passo sono un confronto sensato: un test
// di pochi metri sotto casa non deve diventare "record" (né "prima volta").
const MIN_RECORD_KM = 1

// Confronta l'attività appena chiusa con lo storico dello STESSO sport
// (qualunque attività con distanza, anche inserita a mano: il record è del
// corpo, non del GPS). `current.id` viene escluso perché la lista attività
// potrebbe già contenere l'attività appena salvata (update ottimistico).
export function detectGpsRecords(
  history: Activity[],
  current: { id?: string; type: ActivityType; distanceKm: number; durationMin: number },
): GpsRecord[] {
  if (current.distanceKm < MIN_RECORD_KM || current.durationMin <= 0) return []

  const previous = history.filter(
    (a) =>
      a.id !== current.id &&
      a.type === current.type &&
      a.distance_km != null &&
      a.distance_km > 0,
  )
  if (previous.length === 0) {
    return [{ kind: 'firstOfSport', value: current.distanceKm }]
  }

  const records: GpsRecord[] = []
  const maxKm = Math.max(...previous.map((a) => a.distance_km!))
  if (current.distanceKm > maxKm) {
    records.push({ kind: 'longestDistance', value: current.distanceKm })
  }

  // Il passo si confronta solo con attività comparabili (almeno 1 km, durata
  // valida): il passo medio di un tratto brevissimo non racconta nulla.
  const comparable = previous.filter((a) => a.distance_km! >= MIN_RECORD_KM && a.duration_min > 0)
  if (comparable.length > 0) {
    const currentPace = current.durationMin / current.distanceKm
    const bestPace = Math.min(...comparable.map((a) => a.duration_min / a.distance_km!))
    if (currentPace < bestPace) {
      records.push({ kind: 'fastestPace', value: currentPace })
    }
  }
  return records
}
