import { supabase } from './supabase'
import profileText from './i18n/profile'
import type { User } from '@supabase/supabase-js'

const FAKE_EMAIL_SUFFIX = '@pisozone.local'

// I percorsi GPS sono l'unica tabella con migliaia di righe per utente (un
// campione ogni ~5 secondi): PostgREST tronca silenziosamente a 1000 righe
// per richiesta, quindi un select singolo esporterebbe solo il primo scampolo
// dei giri. Si pagina finché una pagina torna incompleta.
const ROUTES_PAGE_SIZE = 1000

async function fetchAllActivityRoutes(uid: string): Promise<unknown[]> {
  const rows: unknown[] = []
  for (let from = 0; ; from += ROUTES_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('activity_routes')
      .select('*')
      .eq('user_id', uid)
      .order('activity_id')
      .order('seq')
      .range(from, from + ROUTES_PAGE_SIZE - 1)
    if (error) throw new Error(profileText.export.fieldFailed('activity_routes', error.message))
    rows.push(...(data ?? []))
    if (!data || data.length < ROUTES_PAGE_SIZE) break
  }
  return rows
}

// Copia completa dei dati personali dell'utente (GDPR art. 20 — portabilità).
// Le query passano dalla RLS: ogni tabella restituisce solo le righe proprie
// (per i commenti, quelle che la policy di visibilità consente ancora di leggere).
export async function buildUserDataExport(user: User): Promise<Record<string, unknown>> {
  const uid = user.id

  const queries = {
    profile: supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    activities: supabase.from('activities').select('*').eq('user_id', uid).order('date', { ascending: true }),
    achievements: supabase.from('achievements').select('*').eq('user_id', uid),
    weight_logs: supabase.from('weight_logs').select('*').eq('user_id', uid).order('logged_at', { ascending: true }),
    daily_challenge_completions: supabase.from('daily_challenge_completions').select('*').eq('user_id', uid),
    streak_freezes: supabase.from('streak_freezes').select('*').eq('user_id', uid),
    activity_likes: supabase.from('activity_likes').select('*').eq('user_id', uid),
    activity_comments: supabase.from('activity_comments').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    exercise_sets: supabase.from('exercise_sets').select('*').eq('user_id', uid),
    recovery_logs: supabase.from('recovery_logs').select('*').eq('user_id', uid).order('day', { ascending: true }),
    plan_enrollments: supabase.from('plan_enrollments').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    personal_goals: supabase.from('personal_goals').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    duels: supabase.from('duels').select('*').or(`creator_id.eq.${uid},opponent_id.eq.${uid}`).order('created_at', { ascending: true }),
    seasonal_claims: supabase.from('seasonal_claims').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    notifications: supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    user_blocks: supabase.from('user_blocks').select('*').eq('blocker_id', uid),
    friendships: supabase.from('friendships').select('*').or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
    messages: supabase.from('messages').select('*').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`),
    group_memberships: supabase.from('group_members').select('*').eq('user_id', uid),
    group_messages_sent: supabase.from('group_messages').select('*').eq('sender_id', uid),
    push_subscriptions: supabase.from('push_subscriptions').select('*').eq('user_id', uid),
  }

  // Tabelle più recenti dello schema: se la migrazione non è ancora eseguita
  // la tabella può mancare, e non deve far fallire l'intero export —
  // pre-migrazione non c'è comunque alcun dato da restituire.
  const optionalTables = new Set(['exercise_sets', 'recovery_logs', 'plan_enrollments', 'personal_goals', 'duels', 'seasonal_claims', 'notifications'])

  const [entries, activityRoutes] = await Promise.all([
    Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const { data, error } = await query
        if (error) {
          if (optionalTables.has(key)) return [key, []] as const
          throw new Error(profileText.export.fieldFailed(key, error.message))
        }
        return [key, data] as const
      }),
    ),
    // Il gap di conformità chiuso dalla roadmap v3 (pilastro 04): i percorsi
    // GPS sono dati personali a tutti gli effetti — anzi, i più sensibili.
    fetchAllActivityRoutes(uid),
  ])

  return {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      username: user.user_metadata?.username ?? null,
      // L'email interna {username}@pisozone.local è un artefatto tecnico, non un dato dell'utente
      recovery_email: user.email && !user.email.endsWith(FAKE_EMAIL_SUFFIX) ? user.email : null,
      created_at: user.created_at,
    },
    ...Object.fromEntries(entries),
    activity_routes: activityRoutes,
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAsJson(data: unknown, filename: string) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename)
}

export function downloadAsCsv(csv: string, filename: string) {
  // BOM UTF-8: senza, Excel su Windows legge male le lettere accentate
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename)
}

// Export GPX di un singolo percorso (roadmap v4, pilastro 04): il documento
// lo costruisce lib/gpxExport.ts, qui solo il download \u2014 stesso pattern di
// downloadAsCsv/downloadAsJson.
export function downloadAsGpx(xml: string, filename: string) {
  downloadBlob(new Blob([xml], { type: 'application/gpx+xml' }), filename)
}
