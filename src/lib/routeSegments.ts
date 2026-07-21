import { supabase } from './supabase'
import type { RouteSegment, SegmentAttempt, ActivityType } from '../types'
import type { TrackedPoint } from './gps'
import { matchSegments, type SegmentCandidate, type SegmentMatch } from './segments'

// I/O per i segmenti personali (route_segments, segment_attempts — v47,
// roadmap v4 pilastro 02). Funzioni semplici come activityRoutes.ts, non un
// hook: servono sia da un contesto React (pagina Segmenti) sia da uno che
// non lo è (il salvataggio GPS in WorkoutTrackingOverlay).

export async function fetchUserSegments(userId: string): Promise<{ segments: RouteSegment[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('route_segments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return { segments: [], error }
  return { segments: (data ?? []) as RouteSegment[], error: null }
}

export async function createSegment(
  segment: Omit<RouteSegment, 'id' | 'created_at'>,
): Promise<{ segment: RouteSegment | null; error: Error | null }> {
  const { data, error } = await supabase.from('route_segments').insert(segment).select().single()
  if (error || !data) return { segment: null, error: error ?? new Error('insert failed') }
  return { segment: data as RouteSegment, error: null }
}

export async function deleteSegment(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('route_segments').delete().eq('id', id)
  return { error }
}

export async function fetchSegmentAttempts(segmentId: string): Promise<{ attempts: SegmentAttempt[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('segment_attempts')
    .select('*')
    .eq('segment_id', segmentId)
    .order('time_seconds', { ascending: true })
  if (error) return { attempts: [], error }
  return { attempts: (data ?? []) as SegmentAttempt[], error: null }
}

// Tutti i tentativi dell'utente su ogni proprio segmento in un colpo solo
// (RLS restituisce comunque solo le proprie righe): la pagina Segmenti li usa
// per PR e conteggio senza una query per segmento.
export async function fetchAllUserAttempts(userId: string): Promise<{ attempts: SegmentAttempt[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('segment_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return { attempts: [], error }
  return { attempts: (data ?? []) as SegmentAttempt[], error: null }
}

export async function insertSegmentAttempt(
  attempt: Omit<SegmentAttempt, 'id' | 'created_at'>,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('segment_attempts').insert(attempt)
  return { error }
}

// Candidati da confrontare con un'attività appena tracciata: i propri
// segmenti di quello sport + i segmenti di sfide di percorso attive a cui si
// partecipa (il proprio o quello dell'avversario — le coordinate viaggiano
// copiate sul duello proprio perché route_segments resta owner-only). Un
// segmento posseduto non viene duplicato dalla sua eventuale sfida.
export async function fetchMatchCandidates(userId: string, activityType: ActivityType): Promise<SegmentCandidate[]> {
  const candidates: SegmentCandidate[] = []
  const seen = new Set<string>()

  const { data: own } = await supabase
    .from('route_segments')
    .select('id, start_lat, start_lng, end_lat, end_lng')
    .eq('user_id', userId)
    .eq('activity_type', activityType)
  for (const s of own ?? []) {
    candidates.push({ segmentId: s.id, startLat: s.start_lat, startLng: s.start_lng, endLat: s.end_lat, endLng: s.end_lng })
    seen.add(s.id)
  }

  const { data: duelRows } = await supabase
    .from('duels')
    .select('segment_id, segment_start_lat, segment_start_lng, segment_end_lat, segment_end_lng')
    .eq('metric', 'segment_time')
    .eq('status', 'active')
    .eq('segment_activity_type', activityType)
  for (const d of duelRows ?? []) {
    if (!d.segment_id || seen.has(d.segment_id)) continue
    if (d.segment_start_lat == null || d.segment_start_lng == null || d.segment_end_lat == null || d.segment_end_lng == null) continue
    candidates.push({
      segmentId: d.segment_id,
      startLat: d.segment_start_lat, startLng: d.segment_start_lng,
      endLat: d.segment_end_lat, endLng: d.segment_end_lng,
    })
    seen.add(d.segment_id)
  }
  return candidates
}

// Best effort come il salvataggio del percorso stesso: un'attività si
// considera comunque salvata anche se questo passo fallisce o non trova
// nulla. Chiamata solo per attività online (id reale, mai in coda offline).
export async function matchAndRecordSegments(
  userId: string, activityId: string, activityType: ActivityType, points: TrackedPoint[],
): Promise<SegmentMatch[]> {
  const candidates = await fetchMatchCandidates(userId, activityType)
  if (candidates.length === 0) return []
  const matches = matchSegments(points, candidates)
  for (const m of matches) {
    await insertSegmentAttempt({ segment_id: m.segmentId, user_id: userId, activity_id: activityId, time_seconds: m.timeSeconds })
  }
  return matches
}
