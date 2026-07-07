import { useState, useEffect } from 'react'
import { startOfWeek } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export interface LeaderboardEntry {
  user_id: string
  username: string
  photo_url: string | null
  calories: number
  minutes: number
  count: number
  isMe: boolean
}

// scope 'friends': aggrega client-side le attività visibili via RLS (io + amici).
// scope 'global': RPC get_global_leaderboard (v26) — solo aggregati settimanali,
// mai attività grezze di sconosciuti.
export function useLeaderboard(scope: 'friends' | 'global' = 'friends') {
  const { user } = useAuth()
  const { showError } = useToast()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [hasFriends, setHasFriends] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchGlobal = async () => {
      setLoading(true)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const { data, error } = await supabase.rpc('get_global_leaderboard', {
        p_start: weekStart.toISOString(),
      })
      if (error) {
        showError('Classifica globale non disponibile. Riprova.')
        setEntries([])
      } else {
        setEntries(
          (data ?? []).map((r: { user_id: string; username: string; photo_url: string | null; calories: number; minutes: number; count: number }) => ({
            user_id: r.user_id,
            username: r.username,
            photo_url: r.photo_url,
            calories: Number(r.calories),
            minutes: Number(r.minutes),
            count: Number(r.count),
            isMe: r.user_id === user.id,
          })),
        )
      }
      setLoading(false)
    }

    if (scope === 'global') { fetchGlobal(); return }

    const fetch = async () => {
      setLoading(true)

      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendshipsError) showError('Errore nel caricamento della classifica. Riprova.')

      const friendIds = (friendships ?? []).map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      setHasFriends(friendIds.length > 0)

      const userIds = [user.id, ...friendIds]
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

      const [profilesRes, activitiesRes] = await Promise.all([
        supabase.from('profiles').select('id, username, photo_url').in('id', userIds),
        supabase
          .from('activities')
          .select('user_id, calories, duration_min')
          .in('user_id', userIds)
          .gte('date', weekStart.toISOString()),
      ])

      if (profilesRes.error || activitiesRes.error) {
        showError('Errore nel caricamento della classifica. Riprova.')
      }

      const profilesMap: Record<string, { username: string; photo_url: string | null }> = {}
      for (const p of profilesRes.data ?? []) profilesMap[p.id] = p

      const agg: Record<string, { calories: number; minutes: number; count: number }> = {}
      for (const uid of userIds) agg[uid] = { calories: 0, minutes: 0, count: 0 }
      for (const a of activitiesRes.data ?? []) {
        if (!agg[a.user_id]) continue
        agg[a.user_id].calories += a.calories ?? 0
        agg[a.user_id].minutes += a.duration_min ?? 0
        agg[a.user_id].count += 1
      }

      const result: LeaderboardEntry[] = userIds.map(uid => ({
        user_id: uid,
        username: profilesMap[uid]?.username ?? 'Utente',
        photo_url: profilesMap[uid]?.photo_url ?? null,
        ...agg[uid],
        isMe: uid === user.id,
      })).sort((a, b) => b.calories - a.calories)

      setEntries(result)
      setLoading(false)
    }

    fetch()
  }, [user, showError, scope])

  return { entries, hasFriends, loading }
}
