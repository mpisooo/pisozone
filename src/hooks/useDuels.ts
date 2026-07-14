import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DUEL_WIN_CREDITS, type DuelProgressRow } from '../lib/duels'
import type { Duel } from '../types'

// Sfide 1v1 e di gruppo (v37). Tollerante pre-migrazione: se la tabella non
// esiste ancora, unavailable = true e la sezione non viene mostrata.
export function useDuels() {
  const { user } = useAuth()
  const [duels, setDuels] = useState<Duel[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [working, setWorking] = useState(false)

  const fetchDuels = useCallback(async () => {
    if (!user) { setLoading(false); return }
    // La RLS restituisce solo i duelli in cui sono coinvolto (anche via gruppo)
    const { data, error } = await supabase
      .from('duels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) {
      setUnavailable(true)
      setLoading(false)
      return
    }
    const rows = (data ?? []) as Duel[]
    setDuels(rows)

    // Username dell'altro partecipante per i duelli 1v1
    const ids = new Set<string>()
    for (const d of rows) {
      if (d.creator_id !== user.id) ids.add(d.creator_id)
      if (d.opponent_id && d.opponent_id !== user.id) ids.add(d.opponent_id)
      if (d.winner_id) ids.add(d.winner_id)
    }
    if (ids.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles').select('id, username').in('id', [...ids])
      setNames(new Map((profiles ?? []).map((p) => [p.id as string, p.username as string])))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDuels() }, [fetchDuels])

  const createDuel = async (target: { opponent_id?: string; group_id?: string }, metric: string, days: number) => {
    if (!user) return { error: new Error('Not authenticated') }
    setWorking(true)
    const today = new Date()
    const { error } = await supabase.from('duels').insert({
      creator_id: user.id,
      opponent_id: target.opponent_id ?? null,
      group_id: target.group_id ?? null,
      metric,
      starts_on: format(today, 'yyyy-MM-dd'),
      ends_on: format(addDays(today, days - 1), 'yyyy-MM-dd'),
      // 1v1 parte in attesa dell'avversario; il gruppo parte subito
      status: target.group_id ? 'active' : 'pending',
    })
    if (!error) await fetchDuels()
    setWorking(false)
    return { error }
  }

  const respondDuel = async (duelId: string, accept: boolean) => {
    setWorking(true)
    const { error } = await supabase
      .from('duels')
      .update({ status: accept ? 'active' : 'declined' })
      .eq('id', duelId)
    if (!error) await fetchDuels()
    setWorking(false)
    return { error }
  }

  const withdrawDuel = async (duelId: string) => {
    setWorking(true)
    const { error } = await supabase.from('duels').delete().eq('id', duelId)
    if (!error) await fetchDuels()
    setWorking(false)
    return { error }
  }

  // A finestra chiusa: il vincitore incassa, chiunque può archiviare un
  // pareggio (winner null, zero crediti). Il trigger fa da arbitro.
  const finishDuel = async (duelId: string, winnerId: string | null) => {
    setWorking(true)
    const { error } = await supabase
      .from('duels')
      .update({
        status: 'finished',
        winner_id: winnerId,
        credits_earned: winnerId ? DUEL_WIN_CREDITS : 0,
      })
      .eq('id', duelId)
    if (!error) await fetchDuels()
    setWorking(false)
    return { error }
  }

  const fetchProgress = useCallback(async (duelId: string): Promise<DuelProgressRow[]> => {
    const { data, error } = await supabase.rpc('get_duel_progress', { p_duel_id: duelId })
    if (error) return []
    return (data ?? []).map((r: { user_id: string; username: string; photo_url: string | null; value: number | string }) => ({
      user_id: r.user_id, username: r.username, photo_url: r.photo_url, value: Number(r.value),
    }))
  }, [])

  return { duels, names, loading, unavailable, working, createDuel, respondDuel, withdrawDuel, finishDuel, fetchProgress, refetch: fetchDuels }
}
