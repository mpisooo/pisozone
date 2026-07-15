import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Bell, User } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'
import { notificationTarget } from '../lib/notifications'
import { REACTION_EMOJI, type ReactionKind } from '../lib/reactions'
import { getLevelDef } from '../lib/levels'
import notifText from '../lib/i18n/notifications'
import type { AppNotification } from '../types'

function messageFor(n: AppNotification): string {
  const name = n.actor_username ?? notifText.fallbackActor
  switch (n.type) {
    case 'friend_request': return notifText.messages.friend_request(name)
    case 'friend_accepted': return notifText.messages.friend_accepted(name)
    case 'reaction': return notifText.messages.reaction(name, REACTION_EMOJI[(n.payload.kind as ReactionKind) ?? 'heart'])
    case 'comment': return notifText.messages.comment(name)
    case 'level_up': return notifText.messages.level_up(Number(n.payload.level) || 1)
  }
}

// Campanella del centro notifiche (v40), nella TopBar. Sparisce del tutto
// pre-migrazione (unavailable, stesso pattern di DuelsSection). Il pannello
// si apre come il menu profilo accanto (.topbar-dropdown, outside-click per
// chiudere, nessun portal/focus-trap: non è un dialog modale).
export default function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, unavailable, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  // Chi era non letto ALL'APERTURA: markAllRead segna tutto letto subito, ma
  // questo pallino resta finché il pannello non si richiude, per far vedere
  // cos'era nuovo in questa apertura.
  const [openUnreadIds, setOpenUnreadIds] = useState<Set<string>>(new Set())
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (unavailable) return null

  const handleToggle = () => {
    if (!open) {
      setOpenUnreadIds(new Set(notifications.filter((n) => !n.read_at).map((n) => n.id)))
      markAllRead()
    }
    setOpen((v) => !v)
  }

  const handleClick = (n: AppNotification) => {
    setOpen(false)
    const target = notificationTarget(n.type)
    navigate(target.path, target.tab ? { state: { tab: target.tab }, viewTransition: true } : { viewTransition: true })
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={notifText.bellAriaLabel}
        className="relative p-1.5 -mr-1 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[15px] h-[15px] rounded-full bg-[var(--red)] text-[white] text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="topbar-dropdown absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-[var(--grey)]">
            <span className="font-bebas text-lg text-white tracking-wider">{notifText.heading}</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">{notifText.emptyTitle}</p>
                <p className="text-xs text-gray-600 mt-1">{notifText.emptyHint}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--grey)] transition-colors"
                  style={openUnreadIds.has(n.id) ? { background: 'rgba(var(--accent-rgb),0.08)' } : undefined}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--grey)] flex-shrink-0 mt-0.5 text-base leading-none">
                    {n.type === 'level_up' ? (
                      getLevelDef(Number(n.payload.level) || 1).emoji
                    ) : n.actor_photo ? (
                      <img src={n.actor_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-snug">{messageFor(n)}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: it })}
                    </p>
                  </div>
                  {openUnreadIds.has(n.id) && <span className="w-2 h-2 rounded-full bg-[var(--red)] flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
