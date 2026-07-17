import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { reportBadgeCount } from '../lib/appBadge'
import { useAuth } from './AuthContext'

interface UnreadCtx {
  totalUnread: number
  refresh: () => void
}

const UnreadContext = createContext<UnreadCtx>({ totalUnread: 0, refresh: () => {} })
export const useUnread = () => useContext(UnreadContext)

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [totalUnread, setTotalUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) { setTotalUnread(0); return }
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .is('read_at', null)
    setTotalUnread(count ?? 0)
  }, [user])

  // Badge sull'icona dell'app (roadmap v3, pilastro 02): i messaggi non letti
  // sono una delle due fonti del numerino, insieme al centro notifiche.
  useEffect(() => { reportBadgeCount('messages', totalUnread) }, [totalUnread])

  useEffect(() => {
    refresh()
    if (!user) return

    const ch = supabase
      .channel('global-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => refresh())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user, refresh])

  return (
    <UnreadContext.Provider value={{ totalUnread, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}
