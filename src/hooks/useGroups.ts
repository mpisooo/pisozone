import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isRateLimitError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'

export interface Group {
  id: string
  name: string
  photo_url: string | null
  created_by: string
  role: 'admin' | 'member'
  memberCount: number
}

export interface GroupMember {
  id: string
  username: string
  photo_url: string | null
  level: number
  role: 'admin' | 'member'
}

export interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  sender_username: string
  sender_photo: string | null
  content: string
  created_at: string
}

export function useGroups() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)

    if (membershipsError) showError(social.groups.errors.loadFailed)

    if (!memberships || memberships.length === 0) {
      setGroups([])
      setLoading(false)
      return
    }

    const groupIds = memberships.map(m => m.group_id)
    const roleMap = new Map(memberships.map(m => [m.group_id, m.role as 'admin' | 'member']))

    const [{ data: groupData, error: groupsError }, { data: memberCounts }] = await Promise.all([
      supabase.from('groups').select('id, name, photo_url, created_by').in('id', groupIds),
      supabase.from('group_members').select('group_id').in('group_id', groupIds),
    ])

    if (groupsError) showError(social.groups.errors.loadFailed)

    const countMap = new Map<string, number>()
    for (const m of memberCounts ?? []) {
      countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1)
    }

    setGroups(
      (groupData ?? []).map(g => ({
        ...g,
        role: roleMap.get(g.id) ?? 'member',
        memberCount: countMap.get(g.id) ?? 1,
      }))
    )
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const createGroup = async (name: string, memberIds: string[]): Promise<string | null> => {
    if (!user || !name.trim()) return null

    // Generate ID client-side to avoid needing a SELECT after INSERT.
    // The SELECT RLS blocks reading back a newly created group before the creator
    // is added to group_members, which happens in the next step.
    const groupId = crypto.randomUUID()

    const { error: groupError } = await supabase
      .from('groups')
      .insert({ id: groupId, name: name.trim(), created_by: user.id })
    if (groupError) { console.error('createGroup INSERT groups error:', groupError); return null }

    const { error: adminError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id, role: 'admin' })
    if (adminError) { console.error('createGroup INSERT admin error:', adminError); return null }

    if (memberIds.length > 0) {
      await supabase.from('group_members').insert(
        memberIds.map(uid => ({ group_id: groupId, user_id: uid, role: 'member' }))
      )
    }

    await fetchGroups()
    return groupId
  }

  const leaveGroup = async (groupId: string) => {
    if (!user) return
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
    await fetchGroups()
  }

  const fetchGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('id, group_id, sender_id, content, created_at, sender:profiles!sender_id(username, photo_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) showError(social.chat.errors.groupMessagesLoadFailed)
    return (data ?? []).map((m: any) => ({
      id: m.id,
      group_id: m.group_id,
      sender_id: m.sender_id,
      sender_username: m.sender?.username ?? 'Utente',
      sender_photo: m.sender?.photo_url ?? null,
      content: m.content,
      created_at: m.created_at,
    }))
  }

  const sendGroupMessage = async (groupId: string, content: string): Promise<GroupMessage | null> => {
    if (!user || !content.trim()) return null
    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, sender_id: user.id, content: content.trim() })
      .select('id, group_id, sender_id, content, created_at')
      .single()
    if (error || !data) {
      if (isRateLimitError(error)) showError(social.chat.errors.rateLimited)
      return null
    }
    return { ...data, sender_username: '', sender_photo: null }
  }

  const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
      .from('group_members')
      .select('role, user_id, profile:profiles!user_id(id, username, photo_url, level)')
      .eq('group_id', groupId)
    if (error) showError(social.groups.errors.membersLoadFailed)
    return (data ?? []).map((m: any) => ({
      id: m.user_id,
      username: m.profile?.username ?? 'Utente',
      photo_url: m.profile?.photo_url ?? null,
      level: m.profile?.level ?? 1,
      role: m.role,
    }))
  }

  return { groups, loading, createGroup, leaveGroup, fetchGroupMessages, sendGroupMessage, fetchGroupMembers, refetch: fetchGroups }
}
