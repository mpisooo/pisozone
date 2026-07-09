import { supabase } from './supabase'
import type { RoutePoint } from '../types'
import type { TrackedPoint } from './gps'

// Percorso GPS di un'attività tracciata (roadmap punto 12): una riga per
// campione in activity_routes, non un blob — stesso pattern relazionale delle
// altre tabelle figlie del progetto (activity_comments, weight_logs).
const BATCH_SIZE = 500

// Best effort come le foto: se fallisce, l'attività resta comunque salvata
// (durata/distanza/calorie sono già in activities), si perde solo la sagoma.
export async function saveActivityRoute(
  userId: string,
  activityId: string,
  points: TrackedPoint[],
): Promise<{ error: Error | null }> {
  if (points.length === 0) return { error: null }
  const rows = points.map((p, seq) => ({
    activity_id: activityId,
    user_id: userId,
    seq,
    lat: p.lat,
    lng: p.lng,
    recorded_at: new Date(p.t).toISOString(),
    accuracy_m: p.accuracyM ?? null,
  }))
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('activity_routes').insert(rows.slice(i, i + BATCH_SIZE))
    if (error) return { error }
  }
  return { error: null }
}

export async function fetchActivityRoute(
  activityId: string,
): Promise<{ points: RoutePoint[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('activity_routes')
    .select('lat, lng')
    .eq('activity_id', activityId)
    .order('seq')
  if (error) return { points: [], error }
  return { points: (data ?? []) as RoutePoint[], error: null }
}
