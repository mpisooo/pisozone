import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'
import type { ActivityType } from '../types'

export interface FeedActivity {
  id: string
  user_id: string
  type: ActivityType
  date: string
  duration_min: number
  calories: number | null
  distance_km: number | null
  notes: string | null
  created_at: string
  // Opzionale finché la migrazione v27 non è eseguita (colonna assente)
  photo_url?: string | null
  username: string
  user_photo: string | null
  user_level: number
  like_count: number
  liked_by_me: boolean
}

export function useFeed() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [feed, setFeed] = useState<FeedActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeed = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (friendshipsError) showError(social.feed.errors.loadFailed)

    const friendIds = (friendships ?? []).map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    )

    const allIds = [user.id, ...friendIds]

    const [{ data: activities, error: activitiesError }, { data: profiles }] = await Promise.all([
      supabase.from('activities').select('*').in('user_id', allIds).order('date', { ascending: false }).limit(50),
      supabase.from('profiles').select('id, username, photo_url, level').in('id', allIds),
    ])

    if (activitiesError) showError(social.feed.errors.loadFailed)
    if (!activities) { setLoading(false); return }

    const activityIds = activities.map(a => a.id)

    const { data: likes } = activityIds.length
      ? await supabase.from('activity_likes').select('activity_id, user_id').in('activity_id', activityIds)
      : { data: [] }

    const likeMap = new Map<string, { count: number; likedByMe: boolean }>()
    for (const l of (likes ?? [])) {
      const entry = likeMap.get(l.activity_id) ?? { count: 0, likedByMe: false }
      entry.count++
      if (l.user_id === user.id) entry.likedByMe = true
      likeMap.set(l.activity_id, entry)
    }

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    setFeed(
      activities.map(a => {
        const p = profileMap.get(a.user_id)
        const l = likeMap.get(a.id) ?? { count: 0, likedByMe: false }
        return {
          ...a,
          username: p?.username ?? 'Utente',
          user_photo: p?.photo_url ?? null,
          user_level: p?.level ?? 1,
          like_count: l.count,
          liked_by_me: l.likedByMe,
        }
      })
    )
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  const toggleLike = useCallback(async (activityId: string) => {
    if (!user) return

    const current = feed.find(a => a.id === activityId)
    if (!current) return
    const wasLiked = current.liked_by_me

    // Ottimistic update immediato
    setFeed(prev => prev.map(a => {
      if (a.id !== activityId) return a
      return {
        ...a,
        liked_by_me: !a.liked_by_me,
        like_count: a.liked_by_me ? a.like_count - 1 : a.like_count + 1,
      }
    }))

    const { error } = wasLiked
      ? await supabase.from('activity_likes').delete().eq('activity_id', activityId).eq('user_id', user.id)
      : await supabase.from('activity_likes').insert({ activity_id: activityId, user_id: user.id })

    if (error) {
      // rollback: l'operazione è fallita, ripristina lo stato precedente
      setFeed(prev => prev.map(a => {
        if (a.id !== activityId) return a
        return {
          ...a,
          liked_by_me: wasLiked,
          like_count: wasLiked ? a.like_count + 1 : a.like_count - 1,
        }
      }))
    }
  }, [user, feed])

  return { feed, loading, refetch: fetchFeed, toggleLike }
}
