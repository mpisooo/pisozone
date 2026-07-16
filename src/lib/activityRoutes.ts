import { supabase } from './supabase'
import type { RoutePoint } from '../types'
import type { TrackedPoint } from './gps'

// Percorso GPS di un'attività tracciata (roadmap punto 12): una riga per
// campione in activity_routes, non un blob — stesso pattern relazionale delle
// altre tabelle figlie del progetto (activity_comments, weight_logs).
const BATCH_SIZE = 500

// La colonna altitude_m esiste solo dalla v42: PostgREST rifiuta l'INSERT di
// una colonna sconosciuta (PGRST204) e fallirebbe il SELECT (42703). In
// entrambi i casi si riprova senza — meglio perdere la quota che il percorso.
function isMissingAltitudeColumn(error: { message?: string } | null): boolean {
  return !!error?.message?.includes('altitude_m')
}

// Best effort come le foto: se fallisce, l'attività resta comunque salvata
// (durata/distanza/calorie sono già in activities), si perde solo la sagoma.
export async function saveActivityRoute(
  userId: string,
  activityId: string,
  points: TrackedPoint[],
): Promise<{ error: Error | null }> {
  if (points.length === 0) return { error: null }
  // Se nessun campione ha la quota (dispositivo che non la fornisce) la
  // colonna si omette del tutto: l'insert resta valido anche pre-migrazione.
  let withAltitude = points.some((p) => p.altitudeM != null)
  const buildRows = (includeAltitude: boolean) =>
    points.map((p, seq) => ({
      activity_id: activityId,
      user_id: userId,
      seq,
      lat: p.lat,
      lng: p.lng,
      recorded_at: new Date(p.t).toISOString(),
      accuracy_m: p.accuracyM ?? null,
      ...(includeAltitude ? { altitude_m: p.altitudeM ?? null } : {}),
    }))
  let rows = buildRows(withAltitude)
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    let { error } = await supabase.from('activity_routes').insert(rows.slice(i, i + BATCH_SIZE))
    if (error && withAltitude && isMissingAltitudeColumn(error)) {
      withAltitude = false
      rows = buildRows(false)
      ;({ error } = await supabase.from('activity_routes').insert(rows.slice(i, i + BATCH_SIZE)))
    }
    if (error) return { error }
  }
  return { error: null }
}

// Riporta anche recorded_at (come `t` in ms) perché gli split per km hanno
// bisogno del tempo, non solo della forma — retroattivo: la colonna esiste
// per ogni percorso salvato dalla v29 — e altitude_m (v42) per l'altimetria,
// con fallback pre-migrazione: mai perdere la sagoma per colpa della quota.
export async function fetchActivityRoute(
  activityId: string,
): Promise<{ points: TrackedPoint[]; error: Error | null }> {
  type RouteRow = RoutePoint & { recorded_at: string; altitude_m?: number | null }
  const select = (columns: string) =>
    supabase.from('activity_routes').select(columns).eq('activity_id', activityId).order('seq')

  let { data, error } = await select('lat, lng, recorded_at, altitude_m')
  if (error && isMissingAltitudeColumn(error)) {
    ;({ data, error } = await select('lat, lng, recorded_at'))
  }
  if (error) return { points: [], error }
  const rows = (data ?? []) as unknown as RouteRow[]
  return {
    points: rows.map(({ lat, lng, recorded_at, altitude_m }) => ({
      lat,
      lng,
      t: Date.parse(recorded_at),
      altitudeM: altitude_m ?? null,
    })),
    error: null,
  }
}
