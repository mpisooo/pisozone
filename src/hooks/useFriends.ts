import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'
import type { Friendship, FriendProfile } from '../types'

export interface UserSearchResult {
  id: string
  username: string
  name: string | null
  photo_url: string | null
}

export function useFriends() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendProfile[]>([])
  const [pendingSent, setPendingSent] = useState<FriendProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFriends = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (friendshipsError) showError(social.friends.errors.loadFailed)

    if (!friendships || friendships.length === 0) {
      setFriends([])
      setPendingReceived([])
      setPendingSent([])
      setLoading(false)
      return
    }

    const idsNeeded = new Set<string>()
    for (const f of friendships) {
      if (f.requester_id !== user.id) idsNeeded.add(f.requester_id)
      if (f.addressee_id !== user.id) idsNeeded.add(f.addressee_id)
    }

    const profilesMap: Record<string, { username: string; name: string | null; photo_url: string | null }> = {}
    if (idsNeeded.size > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, photo_url')
        .in('id', [...idsNeeded])
      if (profilesError) showError(social.friends.errors.profilesLoadFailed)
      if (profiles) {
        for (const p of profiles) profilesMap[p.id] = p
      }
    }

    const toFriendProfile = (f: Friendship): FriendProfile => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      const p = profilesMap[otherId] ?? { username: 'Utente', name: null, photo_url: null }
      return { friendship_id: f.id, user_id: otherId, ...p }
    }

    setFriends(friendships.filter(f => f.status === 'accepted').map(toFriendProfile))
    setPendingReceived(friendships.filter(f => f.status === 'pending' && f.addressee_id === user.id).map(toFriendProfile))
    setPendingSent(friendships.filter(f => f.status === 'pending' && f.requester_id === user.id).map(toFriendProfile))
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchFriends() }, [fetchFriends])

  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!user || query.trim().length < 2) return []
    const { data } = await supabase
      .from('profiles')
      .select('id, username, name, photo_url')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', user.id)
      .limit(10)
    return (data ?? []) as UserSearchResult[]
  }

  const sendRequest = async (addresseeId: string) => {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: addresseeId })
    await fetchFriends()
    return { error }
  }

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    await fetchFriends()
    return { error }
  }

  const rejectOrRemove = async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetchFriends()
    return { error }
  }

  // Amici in comune (roadmap v6): RPC security definer (v49), batch su più
  // utenti in una sola chiamata (ricerca/scoperta mostrano fino a 10-15
  // risultati insieme). Tollerante pre-migrazione: RPC assente → mappa vuota,
  // i badge restano semplicemente nascosti.
  const fetchMutualFriendsCounts = async (userIds: string[]): Promise<Map<string, number>> => {
    if (userIds.length === 0) return new Map()
    const { data, error } = await supabase.rpc('get_mutual_friends_counts', { p_user_ids: userIds })
    if (error || !data) return new Map()
    return new Map(data.map((r: { user_id: string; mutual_count: number | string }) => [r.user_id, Number(r.mutual_count)]))
  }

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectOrRemove,
    fetchMutualFriendsCounts,
    refetch: fetchFriends,
  }
}
