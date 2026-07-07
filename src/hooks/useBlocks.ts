import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Blocchi e segnalazioni (v26). Tollerante pre-migrazione: se le tabelle non
// esistono ancora, l'elenco resta vuoto e le azioni restituiscono errore.
export function useBlocks() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState<string[]>([])

  const fetchBlocks = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
    if (!error) setBlockedIds((data ?? []).map((b) => b.blocked_id as string))
  }, [user])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  // Bloccare rimuove anche l'eventuale amicizia (in qualunque direzione):
  // feed, classifica amici e conversazioni si ripuliscono da sole.
  const blockUser = async (targetId: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: user.id, blocked_id: targetId })
    if (error) return { error }
    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
    setBlockedIds((prev) => [...prev, targetId])
    return { error: null }
  }

  const unblockUser = async (targetId: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetId)
    if (!error) setBlockedIds((prev) => prev.filter((id) => id !== targetId))
    return { error }
  }

  const reportUser = async (targetId: string, reason: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase
      .from('user_reports')
      .insert({ reporter_id: user.id, reported_id: targetId, reason })
    return { error }
  }

  return { blockedIds, blockUser, unblockUser, reportUser, refetch: fetchBlocks }
}
