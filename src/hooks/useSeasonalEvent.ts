import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getCurrentSeasonalEvent, getRecentlyEndedEvents, getUpcomingSeasonalEvent,
  type SeasonalEventDef,
} from '../lib/seasonalEvents'
import type { SeasonalClaim } from '../types'

export interface SeasonalLeaderboardEntry {
  user_id: string
  username: string
  photo_url: string | null
  value: number
}

interface EndedEntry {
  event: SeasonalEventDef
  leaderboard: SeasonalLeaderboardEntry[]
}

// Eventi stagionali (v39): tollerante pre-migrazione — se seasonal_claims non
// esiste ancora, unavailable = true e la sezione sparisce (stesso pattern di
// useDuels).
export function useSeasonalEvent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [working, setWorking] = useState(false)
  const [currentLeaderboard, setCurrentLeaderboard] = useState<SeasonalLeaderboardEntry[]>([])
  const [ended, setEnded] = useState<EndedEntry[]>([])
  const [claims, setClaims] = useState<SeasonalClaim[]>([])

  const current = getCurrentSeasonalEvent()
  const upcoming = getUpcomingSeasonalEvent()

  const fetchLeaderboard = useCallback(async (event: SeasonalEventDef): Promise<SeasonalLeaderboardEntry[]> => {
    const { data, error } = await supabase.rpc('get_seasonal_leaderboard', {
      p_start: event.startsOn, p_end: event.endsOn, p_metric: event.metric, p_activity_type: event.activityType ?? null,
    })
    if (error) return []
    return (data ?? []).map((r: { user_id: string; username: string; photo_url: string | null; value: number | string }) => ({
      user_id: r.user_id, username: r.username, photo_url: r.photo_url, value: Number(r.value),
    }))
  }, [])

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const { data: claimRows, error: claimError } = await supabase
      .from('seasonal_claims').select('*').eq('user_id', user.id)
    if (claimError) {
      setUnavailable(true)
      setLoading(false)
      return
    }
    const myClaims = (claimRows ?? []) as SeasonalClaim[]
    setClaims(myClaims)

    const claimedKeys = new Set(myClaims.map((c) => c.event_key))
    const [currentBoard, endedBoards] = await Promise.all([
      current ? fetchLeaderboard(current) : Promise.resolve([]),
      Promise.all(
        getRecentlyEndedEvents()
          .filter((e) => !claimedKeys.has(e.key))
          .map(async (e) => ({ event: e, leaderboard: await fetchLeaderboard(e) })),
      ),
    ])
    setCurrentLeaderboard(currentBoard)
    // Solo gli eventi dove l'utente è davvero sul podio: altrimenti non c'è
    // nulla da riscattare e la card non deve comparire.
    setEnded(endedBoards.filter(({ leaderboard }) => {
      const idx = leaderboard.findIndex((r) => r.user_id === user.id)
      return idx >= 0 && idx < 3
    }))
    setLoading(false)
  }, [user, current?.key, fetchLeaderboard])

  useEffect(() => { fetchAll() }, [fetchAll])

  const claim = async (event: SeasonalEventDef) => {
    if (!user) return { error: new Error('Not authenticated') }
    setWorking(true)
    const { error } = await supabase.from('seasonal_claims').insert({
      event_key: event.key,
      user_id: user.id,
      metric: event.metric,
      activity_type: event.activityType ?? null,
      starts_on: event.startsOn,
      ends_on: event.endsOn,
    })
    if (!error) await fetchAll()
    setWorking(false)
    return { error }
  }

  return {
    loading, unavailable, working,
    current, upcoming, currentLeaderboard,
    ended, claims, claim,
    refetch: fetchAll,
  }
}
