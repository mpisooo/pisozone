import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isRateLimitError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
  edited_at?: string | null
}

export interface Conversation {
  userId: string
  username: string
  photo: string | null
  lastMessage: string
  lastAt: string
  unread: number
}

export function useMessages() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setLoadingConvs(true)

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) showError(social.chat.errors.conversationsLoadFailed)
    if (!data) { setLoadingConvs(false); return }

    const convMap = new Map<string, { lastMessage: string; lastAt: string; unread: number }>()
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          lastMessage: msg.content,
          lastAt: msg.created_at,
          unread: msg.receiver_id === user.id && !msg.read_at ? 1 : 0,
        })
      } else if (msg.receiver_id === user.id && !msg.read_at) {
        convMap.get(otherId)!.unread++
      }
    }

    const userIds = [...convMap.keys()]
    const profileMap = new Map<string, { username: string; photo_url: string | null }>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, photo_url')
        .in('id', userIds)
      for (const p of profiles ?? []) profileMap.set(p.id, p)
    }

    const convs: Conversation[] = []
    for (const [userId, conv] of convMap) {
      const p = profileMap.get(userId)
      convs.push({ userId, username: p?.username ?? 'Utente', photo: p?.photo_url ?? null, ...conv })
    }
    setConversations(convs)
    setLoadingConvs(false)
  }, [user, showError])

  const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
    if (!user) return []
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
    if (error) showError(social.chat.errors.messagesLoadFailed)
    return (data as Message[]) ?? []
  }

  const sendMessage = async (receiverId: string, content: string): Promise<Message | null> => {
    if (!user || !content.trim()) return null
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: receiverId, content: content.trim() })
      .select()
      .single()
    if (error) {
      if (isRateLimitError(error)) showError(social.chat.errors.rateLimited)
      return null
    }
    return data as Message
  }

  const markRead = async (otherUserId: string) => {
    if (!user) return
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherUserId)
      .is('read_at', null)
  }

  const editMessage = async (messageId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false
    const { error } = await supabase
      .from('messages')
      .update({ content: content.trim(), edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', user.id)
    return !error
  }

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    return !error
  }

  const deleteConversation = async (otherUserId: string): Promise<boolean> => {
    if (!user) return false
    const [r1, r2] = await Promise.all([
      supabase.from('messages').delete().eq('sender_id', user.id).eq('receiver_id', otherUserId),
      supabase.from('messages').delete().eq('sender_id', otherUserId).eq('receiver_id', user.id),
    ])
    return !r1.error && !r2.error
  }

  return {
    conversations, loadingConvs,
    fetchConversations, fetchMessages, sendMessage, markRead,
    editMessage, deleteMessage, deleteConversation,
  }
}
