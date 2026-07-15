import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { countUnread } from '../lib/notifications'
import type { AppNotification } from '../types'

interface NotificationRow {
  id: string
  user_id: string
  type: AppNotification['type']
  actor_id: string | null
  activity_id: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
  actor: { username: string; photo_url: string | null } | null
}

const LIMIT = 30

interface NotificationsCtx {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  unavailable: boolean
  refresh: () => void
  markAllRead: () => void
}

// Default no-op: come UnreadContext/ChallengesBadgeContext, usare l'hook
// fuori dal provider non rompe.
const NotificationsContext = createContext<NotificationsCtx>({
  notifications: [], unreadCount: 0, loading: false, unavailable: false,
  refresh: () => {}, markAllRead: () => {},
})
export const useNotifications = () => useContext(NotificationsContext)

// Centro notifiche in-app (v40): richieste/accettazioni di amicizia,
// reazioni e commenti ricevuti, level-up — cronologia persistente al posto
// delle sole push effimere. Tollerante pre-migrazione: tabella assente →
// unavailable, la campanella sparisce (stesso pattern di useDuels).
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) { setNotifications([]); setUnreadCount(0); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, actor_id, activity_id, payload, read_at, created_at, actor:profiles!actor_id(username, photo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
    if (error) {
      setUnavailable(true)
      setLoading(false)
      return
    }
    const rows: AppNotification[] = ((data ?? []) as unknown as NotificationRow[]).map((n) => ({
      id: n.id,
      user_id: n.user_id,
      type: n.type,
      actor_id: n.actor_id,
      activity_id: n.activity_id,
      payload: n.payload ?? {},
      read_at: n.read_at,
      created_at: n.created_at,
      actor_username: n.actor?.username,
      actor_photo: n.actor?.photo_url ?? null,
    }))
    setNotifications(rows)
    setUnreadCount(countUnread(rows))
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // Realtime (stesso meccanismo del badge messaggi in UnreadContext): un
  // nuovo evento fa ricomparire subito il pallino, senza polling.
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('notifications-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, refresh])

  // Segna tutto letto all'apertura del pannello (stesso momento in cui
  // useMessages segna letta una conversazione aperta), non per singola voce.
  const markAllRead = useCallback(async () => {
    if (!user || unreadCount === 0) return
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    setUnreadCount(0)
    await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)
  }, [user, unreadCount])

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, unavailable, refresh, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}
