import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

const FAKE_EMAIL_SUFFIX = '@pisozone.local'

// Copia completa dei dati personali dell'utente (GDPR art. 20 — portabilità).
// Le query passano dalla RLS: ogni tabella restituisce solo le righe proprie.
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
    friendships: supabase.from('friendships').select('*').or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
    messages: supabase.from('messages').select('*').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`),
    group_memberships: supabase.from('group_members').select('*').eq('user_id', uid),
    group_messages_sent: supabase.from('group_messages').select('*').eq('sender_id', uid),
    push_subscriptions: supabase.from('push_subscriptions').select('*').eq('user_id', uid),
  }

  const entries = await Promise.all(
    Object.entries(queries).map(async ([key, query]) => {
      const { data, error } = await query
      if (error) throw new Error(`Export di "${key}" non riuscito: ${error.message}`)
      return [key, data] as const
    }),
  )

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
  }
}

export function downloadAsJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
