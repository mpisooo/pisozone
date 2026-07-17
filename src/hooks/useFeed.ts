import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'
import { buildReactionSummaries, emptyReactionSummary, withMyReaction } from '../lib/reactions'
import type { ReactionKind, ReactionSummary } from '../lib/reactions'
import type { ActivityType, RoutePoint } from '../types'

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
  // Opzionale finché la migrazione v38 non è eseguita (colonna assente)
  indoor?: boolean | null
  // Opzionali finché la migrazione v45 non è eseguita (colonne assenti)
  gps_tracked?: boolean
  route_visible?: boolean
  // Punti del percorso condiviso (solo sagoma: lat/lng, niente tempi),
  // caricati best-effort per le attività con route_visible.
  route?: RoutePoint[]
  username: string
  user_photo: string | null
  user_level: number
  reactions: ReactionSummary
}

// Quante sagome caricare per un feed: ogni percorso è una query a parte
// (centinaia di righe), oltre questo tetto il costo non vale la coda del feed.
const MAX_FEED_ROUTES = 10

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

    // Reazioni (v31). Se la colonna `kind` non esiste ancora (migrazione non
    // eseguita) la select fallisce: si riprova senza, e ogni riga vale ❤️.
    let likeRows: { activity_id: string; user_id: string; kind?: string | null }[] = []
    if (activityIds.length) {
      const res = await supabase.from('activity_likes').select('activity_id, user_id, kind').in('activity_id', activityIds)
      if (res.error) {
        const legacy = await supabase.from('activity_likes').select('activity_id, user_id').in('activity_id', activityIds)
        likeRows = legacy.data ?? []
      } else {
        likeRows = res.data ?? []
      }
    }
    const reactionMap = buildReactionSummaries(likeRows, user.id)

    // Percorso nel feed (v45): la sagoma delle attività GPS che il
    // proprietario ha scelto di condividere (route_visible, consenso esplicito
    // per attività — la policy "friends read shared routes" fa da guardiano
    // vero). Best effort: pre-migrazione la colonna non esiste e non si
    // seleziona nulla; un fetch fallito lascia la card senza sagoma.
    const routeMap = new Map<string, RoutePoint[]>()
    const shared = activities.filter(a => a.gps_tracked && a.route_visible).slice(0, MAX_FEED_ROUTES)
    if (shared.length > 0) {
      await Promise.all(shared.map(async a => {
        const { data: pts } = await supabase
          .from('activity_routes')
          .select('lat, lng')
          .eq('activity_id', a.id)
          .order('seq')
        if (pts && pts.length >= 2) routeMap.set(a.id, pts as RoutePoint[])
      }))
    }

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    setFeed(
      activities.map(a => {
        const p = profileMap.get(a.user_id)
        return {
          ...a,
          route: routeMap.get(a.id),
          username: p?.username ?? 'Utente',
          user_photo: p?.photo_url ?? null,
          user_level: p?.level ?? 1,
          reactions: reactionMap.get(a.id) ?? emptyReactionSummary(),
        }
      })
    )
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  // Reagisce a un'attività: stesso tipo = rimuove, tipo diverso = cambia
  // (upsert sulla riga unica utente+attività), nessuna reazione = aggiunge.
  const react = useCallback(async (activityId: string, kind: ReactionKind) => {
    if (!user) return

    const current = feed.find(a => a.id === activityId)
    if (!current) return
    const before = current.reactions
    const nextMine = before.mine === kind ? null : kind

    // Optimistic update immediato, rollback se la scrittura fallisce
    setFeed(prev => prev.map(a =>
      a.id === activityId ? { ...a, reactions: withMyReaction(a.reactions, nextMine) } : a
    ))

    let error
    if (nextMine === null) {
      ({ error } = await supabase.from('activity_likes').delete().eq('activity_id', activityId).eq('user_id', user.id))
    } else {
      ({ error } = await supabase
        .from('activity_likes')
        .upsert({ activity_id: activityId, user_id: user.id, kind: nextMine }, { onConflict: 'activity_id,user_id' }))
      if (error && !before.mine) {
        // Migrazione v31 non ancora eseguita (colonna `kind` assente): si
        // degrada al like binario di v11 — l'inserimento senza kind resta valido.
        ({ error } = await supabase.from('activity_likes').insert({ activity_id: activityId, user_id: user.id }))
      }
    }

    if (error) {
      setFeed(prev => prev.map(a =>
        a.id === activityId ? { ...a, reactions: before } : a
      ))
    }
  }, [user, feed])

  return { feed, loading, refetch: fetchFeed, react }
}
