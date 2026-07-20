import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { haptic } from '../../lib/haptics'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import { SkeletonRow } from '../SkeletonCard'
import EmptyState from '../EmptyState'
import type { FriendProfile } from '../../types'
import type { Conversation } from '../../hooks/useMessages'
import Av from './Av'
import ActionSheet from './ActionSheet'

// ── Tab CHAT ──────────────────────────────────────────────────────────────────
interface Props {
  friends: FriendProfile[]
  conversations: Conversation[]
  loadingConvs: boolean
  deleteConversation: (userId: string) => Promise<boolean>
  fetchConversations: () => Promise<void>
  onOpenDm: (userId: string, username: string, photo: string | null) => void
}

export default function ChatTab({ friends, conversations, loadingConvs, deleteConversation, fetchConversations, onOpenDm }: Props) {
  const [selectedConv, setSelectedConv] = useState<{ userId: string; username: string } | null>(null)
  const convPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convLongPressed = useRef(false)

  // Long press handlers for conversation list
  const startConvPress = (conv: { userId: string; username: string }) => () => {
    convPressTimer.current = setTimeout(() => {
      convLongPressed.current = true
      haptic('light')
      setSelectedConv(conv)
      convPressTimer.current = null
    }, 500)
  }
  const cancelConvPress = () => {
    if (convPressTimer.current) { clearTimeout(convPressTimer.current); convPressTimer.current = null }
  }

  return (
    <>
      {/* Shortcuts to friends */}
      {friends.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{social.chat.writeToFriendHeading}</p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {friends.map(f => (
              <button key={f.user_id} onClick={() => onOpenDm(f.user_id, f.username, f.photo_url)} className="flex flex-col items-center gap-1 min-w-[52px]">
                <Av photo={f.photo_url} name={f.username} />
                <span className="text-[10px] text-gray-400 w-12 truncate text-center">{f.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingConvs ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="p-2"><SkeletonRow avatarSize={48} lines={2} /></div>)}</div>
      ) : conversations.length === 0 ? (
        <div className="card py-12">
          <EmptyState icon="chat" title={social.chat.emptyTitle} hint={social.chat.emptyHint} />
        </div>
      ) : (
        <div className="card divide-y divide-[var(--grey)] p-0 overflow-hidden">
          {conversations.map(c => (
            <button
              key={c.userId}
              onClick={() => {
                if (convLongPressed.current) { convLongPressed.current = false; return }
                onOpenDm(c.userId, c.username, c.photo)
              }}
              onTouchStart={startConvPress({ userId: c.userId, username: c.username })}
              onTouchEnd={cancelConvPress}
              onTouchMove={cancelConvPress}
              onContextMenu={e => { e.preventDefault(); setSelectedConv({ userId: c.userId, username: c.username }) }}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--grey)] transition-colors select-none"
            >
              <div className="relative">
                <Av photo={c.photo} name={c.username} />
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[var(--red)] text-[white] text-[9px] flex items-center justify-center px-1">
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${c.unread > 0 ? 'text-white' : 'text-gray-300'}`}>{c.username}</p>
                <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0">
                {formatDistanceToNow(parseISO(c.lastAt), { addSuffix: false, locale: it })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Conversation action sheet */}
      {selectedConv && (
        <ActionSheet onClose={() => setSelectedConv(null)} label={social.chat.conversationActionsLabel}>
          <div className="px-4 pt-4 pb-3 border-b border-[var(--grey)]">
            <p className="text-sm font-semibold text-white">@{selectedConv.username}</p>
            <p className="text-xs text-gray-500 mt-0.5">{social.chat.deleteConversationHint}</p>
          </div>
          <div className="py-1">
            <button
              onClick={async () => {
                setSelectedConv(null)
                await deleteConversation(selectedConv.userId)
                await fetchConversations()
              }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--grey)] transition-colors"
            >
              <Trash2 size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 font-medium">{social.chat.deleteConversationLabel}</span>
            </button>
          </div>
          <div className="px-4 pt-1 pb-2">
            <button
              onClick={() => setSelectedConv(null)}
              className="w-full py-3 rounded-xl text-center text-gray-400 font-medium text-sm"
              style={{ background: 'var(--grey)' }}
            >
              {common.cancel}
            </button>
          </div>
        </ActionSheet>
      )}
    </>
  )
}
