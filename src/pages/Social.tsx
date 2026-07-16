import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { Search, ArrowLeft, Send, Users, Plus, Check, X, Clock, UserPlus, MessageCircle, Edit2, Trash2, Heart, Ban, Flag } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useFriends } from '../hooks/useFriends'
import { useMessages } from '../hooks/useMessages'
import { useGroups } from '../hooks/useGroups'
import { useFeed } from '../hooks/useFeed'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useComments, type ActivityComment } from '../hooks/useComments'
import { useBlocks } from '../hooks/useBlocks'
import { getLevelDef } from '../lib/levels'
import { REACTION_KINDS, REACTION_EMOJI, topKinds } from '../lib/reactions'
import { isRateLimitError } from '../lib/errors'
import { haptic } from '../lib/haptics'
import { useFocusTrap } from '../hooks/useFocusTrap'
import common from '../lib/i18n/common'
import social from '../lib/i18n/social'
import { ACTIVITY_OPTIONS, activityLabel } from '../lib/constants'
import SkeletonCard, { SkeletonRow } from '../components/SkeletonCard'
import ActivityIcon from '../components/ActivityIcon'
import EmptyState from '../components/EmptyState'
import PhotoLightbox from '../components/PhotoLightbox'
import type { FriendProfile } from '../types'
import type { Message } from '../hooks/useMessages'
import type { GroupMessage, GroupMember } from '../hooks/useGroups'
import type { UserSearchResult } from '../hooks/useFriends'

type Tab = 'feed' | 'classifica' | 'friends' | 'chat' | 'groups'
type ActiveView =
  | { type: 'dm'; userId: string; username: string; photo: string | null }
  | { type: 'group'; groupId: string; groupName: string }
  | { type: 'profile'; userId: string; username: string; photo: string | null; friendshipId?: string; isFriend: boolean; isPendingSent: boolean; isPendingReceived: boolean }
  | { type: 'create-group' }

// ── Avatar ────────────────────────────────────────────────────────────────────
function Av({ photo, name, size = 40 }: { photo: string | null; name: string; size?: number }) {
  const cls = size <= 24 ? 'w-6 h-6 text-[10px]'
            : size <= 32 ? 'w-8 h-8 text-xs'
            : size <= 36 ? 'w-9 h-9 text-sm'
            : 'w-10 h-10 text-base'
  if (photo) return <img src={photo} alt={name} className={`rounded-full object-cover flex-shrink-0 ${cls}`} />
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 font-bebas text-[white] bg-[var(--red)] ${cls}`}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ── Action Sheet (Portal) ─────────────────────────────────────────────────────
// Stesso pattern di accessibilità di ActivityEditModal: focus trap, Esc, dialog
function ActionSheet({ onClose, label = social.shared.actionSheetDefaultLabel, children }: { onClose: () => void; label?: string; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)
  return createPortal(
    <>
      <div className="overlay-fade fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="sheet-up fixed bottom-0 left-0 right-0 z-[71] rounded-t-2xl overflow-hidden"
        style={{ background: 'var(--grey-dark)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

// ── DM Chat View ──────────────────────────────────────────────────────────────
type ChatMessage = Message & { failed?: boolean }

function DmChatView({
  userId, username, photo, myId, onBack,
}: { userId: string; username: string; photo: string | null; myId: string; onBack: () => void }) {
  const { fetchMessages, sendMessage, markRead, editMessage, deleteMessage } = useMessages()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages(userId).then(msgs => { setMessages(msgs); markRead(userId) })

    const ch = supabase.channel(`dm-${myId}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` }, (p: any) => {
        const msg = p.new as Message
        if (msg.sender_id === userId) { setMessages(prev => [...prev, msg]); markRead(userId) }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (p: any) => {
        const updated = p.new as Message
        setMessages(prev => prev.map(m =>
          m.id === updated.id ? { ...m, content: updated.content, edited_at: updated.edited_at } : m
        ))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (p: any) => {
        setMessages(prev => prev.filter(m => m.id !== p.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const tempId = `tmp-${Date.now()}`
    const opt: ChatMessage = { id: tempId, sender_id: myId, receiver_id: userId, content, created_at: new Date().toISOString(), read_at: null }
    setMessages(prev => [...prev, opt])
    const sent = await sendMessage(userId, content)
    setMessages(prev => prev.map(m => m.id === tempId ? (sent ? { ...sent } : { ...m, failed: true }) : m))
    setSending(false)
  }

  const handleRetry = async (msg: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, failed: false } : m))
    const sent = await sendMessage(msg.receiver_id, msg.content)
    setMessages(prev => prev.map(m => m.id === msg.id ? (sent ? { ...sent } : { ...m, failed: true }) : m))
  }

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingId) return
    const now = new Date().toISOString()
    setMessages(prev => prev.map(m =>
      m.id === editingId ? { ...m, content: editText.trim(), edited_at: now } : m
    ))
    setEditingId(null)
    setEditText('')
    await editMessage(editingId, editText)
  }

  const startPress = (msg: Message) => () => {
    pressTimer.current = setTimeout(() => {
      haptic('light')
      setSelectedMsg(msg)
      pressTimer.current = null
    }, 500)
  }
  const cancelPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null }
  }

  const handleDeleteMsg = (msg: Message) => {
    setSelectedMsg(null)
    setMessages(prev => prev.filter(m => m.id !== msg.id))
    deleteMessage(msg.id)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <Av photo={photo} name={username} size={36} />
        <p className="font-semibold text-white">{username}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <MessageCircle size={32} className="opacity-30" />
            <p className="text-sm">{social.chat.dm.emptyState}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === myId
          return (
            <div
              key={msg.id}
              className={`flex flex-col select-none ${isMe ? 'items-end' : 'items-start'}`}
              onTouchStart={startPress(msg)}
              onTouchEnd={cancelPress}
              onTouchMove={cancelPress}
              onContextMenu={e => { e.preventDefault(); setSelectedMsg(msg) }}
            >
              <div
                className="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
                style={{ background: isMe ? 'var(--red)' : 'var(--grey)', color: 'var(--color-text)', opacity: msg.failed ? 0.6 : 1 }}
              >
                {msg.content}
                {msg.edited_at && (
                  <span className="block text-[9px] opacity-55 mt-0.5">{social.chat.dm.editedLabel}</span>
                )}
              </div>
              {msg.failed && (
                <button
                  type="button"
                  onClick={() => handleRetry(msg)}
                  className="flex items-center gap-1 text-[10px] text-[var(--red)] mt-0.5 px-1"
                >
                  {social.chat.sendFailedRetry}
                </button>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — normal or edit mode */}
      {editingId ? (
        <div className="border-t border-[var(--grey)]">
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--grey)]" style={{ background: 'rgba(var(--accent-rgb),0.07)' }}>
            <Edit2 size={12} className="text-[var(--red)] flex-shrink-0" />
            <span className="text-xs text-[var(--red)]">{social.chat.dm.editMessageLabel}</span>
            <button type="button" onClick={() => { setEditingId(null); setEditText('') }} aria-label={social.chat.dm.cancelEditAria} className="ml-auto text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="px-4 py-3 flex gap-2">
            <input
              className="flex-1 input-dark text-sm py-2"
              aria-label={social.chat.dm.editMessageLabel}
              placeholder={social.chat.dm.editMessagePlaceholder}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() } }}
              autoFocus
            />
            <button type="button" onClick={handleSaveEdit} disabled={!editText.trim()} aria-label={common.save} className="btn-primary px-3 py-2 disabled:opacity-40">
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-[var(--grey)] flex gap-2">
          <input
            className="flex-1 input-dark text-sm py-2"
            placeholder={social.chat.messageInputPlaceholder}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <button type="button" onClick={handleSend} disabled={!text.trim() || sending} aria-label={social.chat.sendAria} className="btn-primary px-3 py-2 disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      )}

      {/* Message action sheet */}
      {selectedMsg && (
        <ActionSheet onClose={() => setSelectedMsg(null)} label={social.chat.dm.messageActionsLabel}>
          <div className="px-4 pt-4 pb-3 border-b border-[var(--grey)]">
            <p className="text-xs text-gray-500 mb-1">{social.chat.dm.messagePreviewHeading}</p>
            <p className="text-sm text-gray-300 line-clamp-2">{selectedMsg.content}</p>
          </div>
          <div className="py-1">
            {selectedMsg.sender_id === myId && (
              <button
                onClick={() => {
                  setEditingId(selectedMsg.id)
                  setEditText(selectedMsg.content)
                  setSelectedMsg(null)
                }}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--grey)] transition-colors"
              >
                <Edit2 size={18} className="text-[var(--red)] flex-shrink-0" />
                <span className="text-white font-medium">{social.chat.dm.editMessageLabel}</span>
              </button>
            )}
            <button
              onClick={() => handleDeleteMsg(selectedMsg)}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--grey)] transition-colors"
            >
              <Trash2 size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 font-medium">{social.chat.dm.deleteMessageLabel}</span>
            </button>
          </div>
          <div className="px-4 pt-1 pb-2">
            <button
              onClick={() => setSelectedMsg(null)}
              className="w-full py-3 rounded-xl text-center text-gray-400 font-medium text-sm"
              style={{ background: 'var(--grey)' }}
            >
              {common.cancel}
            </button>
          </div>
        </ActionSheet>
      )}
    </div>
  )
}

// ── Group Chat View ───────────────────────────────────────────────────────────
function GroupChatView({
  groupId, groupName, myId, myUsername, myPhoto, onBack,
}: { groupId: string; groupName: string; myId: string; myUsername: string; myPhoto: string | null; onBack: () => void }) {
  const { fetchGroupMessages, sendGroupMessage, leaveGroup, fetchGroupMembers } = useGroups()
  const [messages, setMessages] = useState<(GroupMessage & { failed?: boolean })[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const membersRef = useRef<GroupMember[]>([])

  useEffect(() => { membersRef.current = members }, [members])

  useEffect(() => {
    fetchGroupMessages(groupId).then(setMessages)
    fetchGroupMembers(groupId).then(setMembers)

    const ch = supabase.channel(`grp-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, (p: any) => {
        const m = p.new
        if (m.sender_id === myId) return
        const sender = membersRef.current.find(mem => mem.id === m.sender_id)
        setMessages(prev => [...prev, { ...m, sender_username: sender?.username ?? social.shared.unknownUser, sender_photo: sender?.photo_url ?? null }])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const tempId = `tmp-${Date.now()}`
    const opt: GroupMessage & { failed?: boolean } = { id: tempId, group_id: groupId, sender_id: myId, sender_username: myUsername, sender_photo: myPhoto, content, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, opt])
    const sent = await sendGroupMessage(groupId, content)
    setMessages(prev => prev.map(m => m.id === tempId
      ? (sent ? { ...sent, sender_username: myUsername, sender_photo: myPhoto } : { ...m, failed: true })
      : m
    ))
    setSending(false)
  }

  const handleRetry = async (msg: GroupMessage & { failed?: boolean }) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, failed: false } : m))
    const sent = await sendGroupMessage(groupId, msg.content)
    setMessages(prev => prev.map(m => m.id === msg.id
      ? (sent ? { ...sent, sender_username: myUsername, sender_photo: myPhoto } : { ...m, failed: true })
      : m
    ))
  }

  const myRole = members.find(m => m.id === myId)?.role

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{groupName}</p>
          <p className="text-xs text-gray-500">{members.length} {social.groups.memberPlural}</p>
        </div>
        <button type="button" onClick={() => setShowMembers(v => !v)} aria-label={social.chat.group.showMembersAria} className={`p-1 transition-colors ${showMembers ? 'text-[var(--red)]' : 'text-gray-400 hover:text-white'}`}>
          <Users size={18} />
        </button>
      </div>

      {showMembers && (
        <div className="px-4 py-3 border-b border-[var(--grey)] space-y-2">
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Av photo={m.photo_url} name={m.username} size={32} />
                  {m.role === 'admin' && <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>}
                </div>
                <span className="text-[10px] text-gray-400 max-w-[48px] truncate text-center">{m.username}</span>
              </div>
            ))}
          </div>
          {myRole !== 'admin' && (
            <button onClick={async () => { await leaveGroup(groupId); onBack() }} className="text-xs text-red-400 mt-1">
              {social.groups.leaveGroupButton}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === myId
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Av photo={msg.sender_photo} name={msg.sender_username} size={32} />}
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <p className="text-[10px] text-gray-500 mb-0.5 ml-1">{msg.sender_username}</p>}
                <div className="px-3 py-2 rounded-2xl text-sm" style={{ background: isMe ? 'var(--red)' : 'var(--grey)', color: 'var(--color-text)', opacity: msg.failed ? 0.6 : 1 }}>
                  {msg.content}
                </div>
                {msg.failed && (
                  <button
                    type="button"
                    onClick={() => handleRetry(msg)}
                    className="flex items-center gap-1 text-[10px] text-[var(--red)] mt-0.5 px-1"
                  >
                    {social.chat.sendFailedRetry}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[var(--grey)] flex gap-2">
        <input
          className="flex-1 input-dark text-sm py-2"
          placeholder={social.chat.messageInputPlaceholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />
        <button type="button" onClick={handleSend} disabled={!text.trim() || sending} aria-label={social.chat.sendAria} className="btn-primary px-3 py-2 disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Friend Profile View ───────────────────────────────────────────────────────
function FriendProfileView({
  userId, username, photo, friendshipId, isFriend, isPendingSent, isPendingReceived, onBack,
  onSendRequest, onAcceptRequest, onRemove, onBlock, onReport,
}: {
  userId: string; username: string; photo: string | null
  friendshipId?: string; isFriend: boolean; isPendingSent: boolean; isPendingReceived: boolean
  onBack: () => void
  onSendRequest: (id: string) => Promise<void>
  onAcceptRequest: (fid: string) => Promise<void>
  onRemove: (fid: string) => Promise<void>
  onBlock: (id: string) => Promise<{ error: Error | null }>
  onReport: (id: string, reason: string) => Promise<{ error: Error | null }>
}) {
  const [remoteProfile, setRemoteProfile] = useState<any>(null)
  const [acting, setActing] = useState(false)
  const [showReportSheet, setShowReportSheet] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [modMsg, setModMsg] = useState('')

  const handleBlock = async () => {
    if (!confirmBlock) { setConfirmBlock(true); return }
    setActing(true)
    const { error } = await onBlock(userId)
    setActing(false)
    if (error) {
      setModMsg(social.friends.profile.blockFailedMsg)
      setConfirmBlock(false)
      setTimeout(() => setModMsg(''), 3000)
      return
    }
    onBack()
  }

  const handleReport = async (reason: string) => {
    setShowReportSheet(false)
    const { error } = await onReport(userId, reason)
    setModMsg(error ? social.friends.profile.reportFailedMsg : social.friends.profile.reportSentMsg)
    setTimeout(() => setModMsg(''), 3500)
  }

  useEffect(() => {
    supabase.from('profiles').select('username, name, photo_url, level, sport_preferiti').eq('id', userId).single()
      .then(({ data }) => setRemoteProfile(data))
  }, [userId])

  // Statistiche pubbliche (v37): solo aggregati via RPC security definer,
  // mai attività grezze. Tollerante pre-migrazione: errore → griglia nascosta.
  const [pubStats, setPubStats] = useState<{ total_activities: number; total_minutes: number; total_km: number; medals: number } | null>(null)
  useEffect(() => {
    supabase.rpc('get_public_profile_stats', { p_user_id: userId }).then(({ data, error }) => {
      const row = Array.isArray(data) ? data[0] : data
      if (!error && row) {
        setPubStats({
          total_activities: Number(row.total_activities),
          total_minutes: Number(row.total_minutes),
          total_km: Number(row.total_km),
          medals: Number(row.medals),
        })
      }
    })
  }, [userId])

  const ld = getLevelDef(remoteProfile?.level ?? 1)
  const sports = (remoteProfile?.sport_preferiti ?? []).map((s: string) => ACTIVITY_OPTIONS.find(o => o.value === s)).filter(Boolean)

  const handleAction = async () => {
    setActing(true)
    if ((isFriend || isPendingSent) && friendshipId) await onRemove(friendshipId)
    else if (isPendingReceived && friendshipId) await onAcceptRequest(friendshipId)
    else await onSendRequest(userId)
    setActing(false)
    onBack()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <p className="font-bebas text-xl text-white tracking-wider">{social.friends.profile.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[var(--red)]">
            {photo
              ? <img src={photo} className="w-full h-full object-cover" alt={username} />
              : <span className="font-bebas text-3xl text-[white]">{username[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-lg">@{username}</p>
            {remoteProfile?.name && <p className="text-sm text-gray-400">{remoteProfile.name}</p>}
            <p className="text-sm font-semibold mt-1" style={{ color: ld.color }}>
              {ld.emoji} {social.shared.levelPrefix}{remoteProfile?.level ?? 1} — {ld.title}
            </p>
          </div>
          <button
            onClick={handleAction}
            disabled={acting}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={
              isFriend ? { border: '1px solid #7f1d1d', color: '#f87171' }
              : isPendingSent ? { background: 'var(--grey)', color: '#9ca3af' }
              : isPendingReceived ? { background: '#22c55e', color: '#fff' }
              : { background: 'var(--red)', color: '#fff' }
            }
          >
            {isFriend ? social.friends.profile.removeFriendButton : isPendingSent ? social.friends.profile.pendingSentButton : isPendingReceived ? social.friends.profile.acceptRequestButton : social.friends.profile.addFriendButton}
          </button>
        </div>

        {/* Profilo pubblico presentabile (v37): la card "In numeri" */}
        {pubStats && pubStats.total_activities > 0 && (
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{social.friends.profile.statsHeading}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                [String(pubStats.total_activities), social.friends.profile.statActivities],
                [`${Math.round(pubStats.total_minutes / 60)}h`, social.friends.profile.statHours],
                [(Math.round(pubStats.total_km * 10) / 10).toLocaleString('it-IT'), social.friends.profile.statKm],
                [String(pubStats.medals), social.friends.profile.statMedals],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-bebas text-2xl text-white leading-none">{value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sports.length > 0 && (
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{social.friends.profile.favoriteSportsHeading}</p>
            <div className="flex gap-4">
              {sports.map((s: any) => (
                <div key={s.value} className="flex flex-col items-center gap-1">
                  <ActivityIcon type={s.value} className="text-[var(--red)]" />
                  <span className="text-[10px] text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderazione: segnala / blocca */}
        <div className="card space-y-2.5">
          {modMsg && (
            <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'var(--grey)', color: 'var(--color-text)' }}>
              {modMsg}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowReportSheet(true)}
              disabled={acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
            >
              <Flag size={13} /> {social.friends.profile.reportButton}
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{
                border: '1px solid rgba(var(--accent-rgb),0.5)',
                color: 'var(--red)',
                background: confirmBlock ? 'rgba(var(--accent-rgb),0.15)' : 'transparent',
              }}
            >
              <Ban size={13} /> {confirmBlock ? social.friends.profile.confirmBlockButton : social.friends.profile.blockButton}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            {social.friends.profile.blockWarning(username)}
          </p>
        </div>
      </div>

      {showReportSheet && (
        <ActionSheet onClose={() => setShowReportSheet(false)} label={social.friends.profile.reportSheetLabel}>
          <div className="px-4 pt-4 pb-2 border-b border-[var(--grey)]">
            <p className="text-sm font-semibold text-white">{social.friends.profile.reportSheetQuestion(username)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{social.friends.profile.reportSheetHint}</p>
          </div>
          {social.friends.profile.reportReasons.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => handleReport(r)}
              className="w-full text-left px-4 py-3.5 text-sm text-gray-300 active:bg-[var(--grey)]"
            >
              {r}
            </button>
          ))}
        </ActionSheet>
      )}
    </div>
  )
}

// ── Commenti di un'attività del feed ─────────────────────────────────────────
function FeedComments({
  activityId, ownerId, myId, onCountChange,
}: { activityId: string; ownerId: string; myId: string; onCountChange: (id: string, n: number) => void }) {
  const { fetchComments, addComment, deleteComment } = useComments()
  const [comments, setComments] = useState<ActivityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchComments(activityId).then(c => {
      if (cancelled) return
      setComments(c)
      setLoading(false)
      onCountChange(activityId, c.length)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const added = await addComment(activityId, text)
    setSending(false)
    if (added) {
      setComments(prev => { onCountChange(activityId, prev.length + 1); return [...prev, added] })
      setText('')
    }
  }

  const handleDelete = async (id: string) => {
    if (await deleteComment(id)) {
      setComments(prev => { onCountChange(activityId, prev.length - 1); return prev.filter(c => c.id !== id) })
    }
  }

  return (
    <div className="space-y-2.5 pt-2 border-t border-[var(--grey)]">
      {loading ? (
        <p className="text-xs text-gray-500">{social.feed.comments.loading}</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500">{social.feed.comments.empty}</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <Av photo={c.user_photo} name={c.username} size={26} />
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-semibold text-white">{c.username}</span>{' '}
                <span className="text-gray-500">{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: it })}</span>
              </p>
              <p className="text-sm text-gray-300 break-words">{c.content}</p>
            </div>
            {(c.user_id === myId || ownerId === myId) && (
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                aria-label={social.feed.comments.deleteAria}
                className="p-1 text-gray-600 hover:text-[var(--red)] flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))
      )}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          maxLength={500}
          placeholder={social.feed.comments.inputPlaceholder}
          className="input-dark flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label={social.feed.comments.sendAria}
          className="p-2.5 rounded-lg bg-[var(--red)] text-[white] disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Create Group View ─────────────────────────────────────────────────────────
function CreateGroupView({
  friends, onBack, onCreate,
}: { friends: FriendProfile[]; onBack: () => void; onCreate: (id: string, name: string) => void }) {
  const { createGroup } = useGroups()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleCreate = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    const gid = await createGroup(name, selected)
    setCreating(false)
    if (gid) {
      onCreate(gid, name.trim())
    } else {
      setCreateError(social.groups.create.errors.createFailed)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <p className="font-bebas text-xl text-white tracking-wider">{social.groups.create.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{social.groups.create.nameLabel}</label>
          <input className="input-dark" placeholder={social.groups.create.namePlaceholder} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{social.groups.create.addFriendsHeading(selected.length)}</p>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-500">{social.groups.create.noFriendsHint}</p>
          ) : (
            <div className="space-y-2">
              {friends.map(f => {
                const sel = selected.includes(f.user_id)
                return (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => toggle(f.user_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: sel ? 'rgba(var(--accent-rgb),0.1)' : 'var(--grey)', border: `1px solid ${sel ? 'var(--red)' : 'transparent'}` }}
                  >
                    <Av photo={f.photo_url} name={f.username} size={36} />
                    <p className="flex-1 text-left font-medium text-white">{f.username}</p>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: sel ? 'var(--red)' : '#4b5563', background: sel ? 'var(--red)' : 'transparent' }}
                    >
                      {sel && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--grey)]">
        {createError && <p className="text-xs text-red-400 mb-2 text-center">{createError}</p>}
        <button type="button" onClick={handleCreate} disabled={!name.trim() || creating} className="btn-primary w-full disabled:opacity-50">
          {creating ? social.groups.create.creatingLabel : social.groups.create.submitLabel(selected.length)}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const VALID_TABS: Tab[] = ['feed', 'classifica', 'friends', 'chat', 'groups']

export default function SocialPage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  const [tab, setTab] = useState<Tab>(() => {
    const requested = (location.state as { tab?: Tab } | null)?.tab
    return requested && VALID_TABS.includes(requested) ? requested : 'feed'
  })
  const [activeView, setActiveView] = useState<ActiveView | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [friendActionError, setFriendActionError] = useState('')
  const [selectedConv, setSelectedConv] = useState<{ userId: string; username: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convLongPressed = useRef(false)

  const { friends, pendingReceived, pendingSent, loading: friendsLoading, searchUsers, sendRequest, acceptRequest, rejectOrRemove, refetch: refetchFriends } = useFriends()
  const { conversations, loadingConvs, fetchConversations, deleteConversation } = useMessages()
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useGroups()
  const { feed, loading: feedLoading, react } = useFeed()
  const [lbScope, setLbScope] = useState<'friends' | 'global'>('friends')
  const { entries: lbEntries, loading: lbLoading } = useLeaderboard(lbScope)

  // Scoperta (v37): suggerimenti di utenti attivi non ancora amici. La RPC
  // esclude già amici, richieste pendenti e utenti bloccati; errore
  // pre-migrazione → lista vuota, sezione nascosta.
  const [suggestions, setSuggestions] = useState<{ user_id: string; username: string; photo_url: string | null; count: number }[]>([])
  useEffect(() => {
    supabase.rpc('get_suggested_users').then(({ data, error }) => {
      if (!error && data) {
        setSuggestions(data.map((r: { user_id: string; username: string; photo_url: string | null; count: number | string }) => ({
          user_id: r.user_id, username: r.username, photo_url: r.photo_url, count: Number(r.count),
        })))
      }
    })
  }, [friends.length])
  const { blockedIds, blockUser, reportUser } = useBlocks()
  const { fetchCommentCounts } = useComments()
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map())
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null)
  const [openReactionsId, setOpenReactionsId] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; alt: string } | null>(null)

  // Conteggi commenti per i badge del feed (i dettagli si caricano all'apertura)
  useEffect(() => {
    if (!feed.length) return
    let cancelled = false
    fetchCommentCounts(feed.map(a => a.id)).then(c => { if (!cancelled) setCommentCounts(c) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed])

  const updateCommentCount = useCallback((id: string, n: number) => {
    setCommentCounts(prev => new Map(prev).set(id, n))
  }, [])

  const runFriendAction = async (action: () => Promise<{ error: Error | null } | undefined>) => {
    const result = await action()
    if (result?.error) {
      setFriendActionError(
        isRateLimitError(result.error)
          ? social.friends.errors.rateLimited
          : social.friends.errors.actionFailed
      )
      setTimeout(() => setFriendActionError(''), 3000)
    }
  }

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchUsers(value)
      // Gli utenti che hai bloccato non compaiono nella ricerca
      setSearchResults(res.filter(r => !blockedIds.includes(r.id)))
      setSearching(false)
    }, 350)
  }, [searchUsers, blockedIds])

  const friendsMap = new Map(friends.map(f => [f.user_id, f.friendship_id]))
  const pendingSentMap = new Map(pendingSent.map(f => [f.user_id, f.friendship_id]))
  const pendingReceivedMap = new Map(pendingReceived.map(f => [f.user_id, f.friendship_id]))

  const openProfile = (userId: string, username: string, photo: string | null) => {
    setActiveView({
      type: 'profile', userId, username, photo,
      friendshipId: friendsMap.get(userId) ?? pendingSentMap.get(userId) ?? pendingReceivedMap.get(userId),
      isFriend: friendsMap.has(userId),
      isPendingSent: pendingSentMap.has(userId),
      isPendingReceived: pendingReceivedMap.has(userId),
    })
  }

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

  const myUsername = profile?.username ?? user?.user_metadata?.username ?? social.shared.selfFallbackName
  const myPhoto = profile?.photo_url ?? null

  // ── Sub-view overlay
  if (activeView) {
    const overlay = (
      <div
        className="fixed inset-x-0 z-40 flex flex-col overflow-hidden"
        style={{ background: 'var(--black)', top: 'calc(52px + env(safe-area-inset-top))', bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {activeView.type === 'dm' && (
          <DmChatView userId={activeView.userId} username={activeView.username} photo={activeView.photo} myId={user!.id}
            onBack={() => { setActiveView(null); fetchConversations() }} />
        )}
        {activeView.type === 'group' && (
          <GroupChatView groupId={activeView.groupId} groupName={activeView.groupName} myId={user!.id} myUsername={myUsername} myPhoto={myPhoto}
            onBack={() => { setActiveView(null); refetchGroups() }} />
        )}
        {activeView.type === 'profile' && (
          <FriendProfileView
            userId={activeView.userId} username={activeView.username} photo={activeView.photo}
            friendshipId={activeView.friendshipId} isFriend={activeView.isFriend}
            isPendingSent={activeView.isPendingSent} isPendingReceived={activeView.isPendingReceived}
            onBack={() => setActiveView(null)}
            onSendRequest={async (id) => { await runFriendAction(() => sendRequest(id)); await refetchFriends() }}
            onAcceptRequest={async (fid) => { await runFriendAction(() => acceptRequest(fid)); await refetchFriends() }}
            onRemove={async (fid) => { await runFriendAction(() => rejectOrRemove(fid)); await refetchFriends() }}
            onBlock={async (id) => { const r = await blockUser(id); await refetchFriends(); return r }}
            onReport={reportUser}
          />
        )}
        {activeView.type === 'create-group' && (
          <CreateGroupView friends={friends} onBack={() => setActiveView(null)}
            onCreate={(gid, gname) => { setActiveView({ type: 'group', groupId: gid, groupName: gname }); refetchGroups() }} />
        )}
      </div>
    )
    return overlay
  }

  const pendingBadge = pendingReceived.length
  const unreadBadge = conversations.filter(c => c.unread > 0).length

  return (
    <div className="page-enter pb-24 max-w-lg mx-auto">
      <div className="px-4 pt-5 pb-1">
        <span className="font-bebas text-4xl text-white tracking-widest">{social.pageTitle}</span>
        <div className="header-accent" />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--grey)] px-2 mb-4">
        {([
          { id: 'feed' as Tab, label: social.feed.tabLabel, badge: 0 },
          { id: 'classifica' as Tab, label: social.leaderboard.tabLabel, badge: 0 },
          { id: 'friends' as Tab, label: social.friends.tabLabel, badge: pendingBadge },
          { id: 'chat' as Tab, label: social.chat.tabLabel, badge: unreadBadge },
          { id: 'groups' as Tab, label: social.groups.tabLabel, badge: 0 },
        ]).map(({ id, label, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === id ? 'text-[var(--red)] border-b-2 border-[var(--red)]' : 'text-gray-500'}`}
          >
            {label}
            {badge > 0 && (
              <span className="absolute top-1.5 right-2 min-w-[16px] h-4 rounded-full bg-[var(--red)] text-[white] text-[9px] flex items-center justify-center px-1">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">

        {/* ── FEED ── */}
        {tab === 'feed' && (
          <>
            {feedLoading ? (
              <div className="space-y-4">{[1, 2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
            ) : feed.length === 0 ? (
              <div className="card py-14">
                <EmptyState icon="bolt" title={social.feed.emptyTitle} hint={social.feed.emptyHint} />
              </div>
            ) : (
              feed.map(a => {
                const opt = ACTIVITY_OPTIONS.find(o => o.value === a.type)
                const ld = getLevelDef(a.user_level)
                const ago = formatDistanceToNow(parseISO(a.date), { addSuffix: true, locale: it })
                return (
                  <div key={a.id} className="card space-y-3">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => openProfile(a.user_id, a.username, a.user_photo)} className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Av photo={a.user_photo} name={a.username} size={36} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-white text-sm">{a.username}</p>
                          <p className="text-[10px]" style={{ color: ld.color }}>{ld.emoji} {social.shared.levelPrefix}{a.user_level} {ld.title}</p>
                        </div>
                      </button>
                      <span className="text-xs text-gray-500 flex-shrink-0">{ago}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--grey)' }}>
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--red)] flex-shrink-0"
                        style={{ background: 'rgba(var(--accent-rgb),0.15)' }}
                      >
                        <ActivityIcon type={opt?.value ?? 'corsa'} size={24} />
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{activityLabel(a.type, a.indoor)}</p>
                        <p className="text-xs text-gray-400">
                          {a.duration_min} {social.shared.units.min}{a.calories ? ` · ${a.calories} ${social.shared.units.kcal}` : ''}{a.distance_km ? ` · ${a.distance_km} ${social.shared.units.km}` : ''}
                        </p>
                      </div>
                    </div>
                    {a.photo_url && (
                      <button
                        type="button"
                        onClick={() => setLightboxPhoto({ url: a.photo_url!, alt: social.feed.activityPhotoAlt(a.username) })}
                        aria-label={social.feed.openPhotoAria}
                        className="block w-full"
                      >
                        <img
                          src={a.photo_url}
                          alt={social.feed.activityPhotoAlt(a.username)}
                          loading="lazy"
                          className="w-full max-h-80 object-cover rounded-xl"
                        />
                      </button>
                    )}
                    {a.notes && <p className="text-sm text-gray-400 italic">"{a.notes}"</p>}
                    <div className="flex items-center gap-4 pt-1">
                      <div className="relative">
                        {openReactionsId === a.id && (
                          <>
                            {/* Chiusura al tocco fuori: velo trasparente sotto la strip */}
                            <button
                              type="button"
                              aria-label={social.feed.reactions.closePickerAria}
                              onClick={() => setOpenReactionsId(null)}
                              className="fixed inset-0 z-10 cursor-default"
                            />
                            <div
                              role="group"
                              aria-label={social.feed.reactions.pickerLabel}
                              className="modal-pop absolute bottom-full left-0 mb-2 z-20 flex gap-0.5 rounded-full px-1.5 py-1"
                              style={{ background: 'var(--grey-dark)', boxShadow: 'var(--shadow-lg)' }}
                            >
                              {REACTION_KINDS.map(k => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => { haptic('light'); react(a.id, k); setOpenReactionsId(null) }}
                                  aria-label={a.reactions.mine === k
                                    ? social.feed.reactions.removeAria(social.feed.reactions.kindLabels[k])
                                    : social.feed.reactions.reactWithAria(social.feed.reactions.kindLabels[k])}
                                  aria-pressed={a.reactions.mine === k}
                                  className="w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all active:scale-125"
                                  style={a.reactions.mine === k ? { background: 'rgba(var(--accent-rgb),0.25)' } : undefined}
                                >
                                  {REACTION_EMOJI[k]}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenReactionsId(prev => prev === a.id ? null : a.id)}
                          aria-label={openReactionsId === a.id ? social.feed.reactions.closePickerAria : social.feed.reactions.openPickerAria}
                          aria-expanded={openReactionsId === a.id}
                          className={`flex items-center gap-1.5 text-sm transition-all active:scale-110 ${a.reactions.mine ? 'text-[var(--red)]' : 'text-gray-500'}`}
                        >
                          {a.reactions.mine
                            ? <span className="text-lg leading-none">{REACTION_EMOJI[a.reactions.mine]}</span>
                            : <Heart size={18} stroke="#6b7280" />}
                          {a.reactions.total > 0 && (
                            <span className="flex items-center gap-0.5">
                              {topKinds(a.reactions).filter(k => k !== a.reactions.mine).map(k => (
                                <span key={k} className="text-sm leading-none">{REACTION_EMOJI[k]}</span>
                              ))}
                              <span className="font-medium ml-0.5">{a.reactions.total}</span>
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenCommentsId(prev => prev === a.id ? null : a.id)}
                        aria-label={openCommentsId === a.id ? social.feed.closeCommentsAria : social.feed.showCommentsAria}
                        aria-expanded={openCommentsId === a.id}
                        className={`flex items-center gap-1.5 text-sm transition-all active:scale-110 ${openCommentsId === a.id ? 'text-[var(--red)]' : 'text-gray-500'}`}
                      >
                        <MessageCircle size={18} />
                        {(commentCounts.get(a.id) ?? 0) > 0 && <span className="font-medium">{commentCounts.get(a.id)}</span>}
                      </button>
                    </div>
                    {openCommentsId === a.id && user && (
                      <FeedComments
                        activityId={a.id}
                        ownerId={a.user_id}
                        myId={user.id}
                        onCountChange={updateCommentCount}
                      />
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {/* ── CLASSIFICA ── */}
        {tab === 'classifica' && (
          <>
            {/* Toggle Amici / Globale */}
            <div className="flex rounded-xl overflow-hidden border border-[var(--grey)]">
              {([['friends', social.leaderboard.scopeFriendsLabel], ['global', social.leaderboard.scopeGlobalLabel]] as const).map(([scope, label]) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setLbScope(scope)}
                  className={`flex-1 py-2 text-xs font-semibold transition-all ${lbScope === scope ? 'text-[white]' : 'text-gray-500'}`}
                  style={{ background: lbScope === scope ? 'var(--red)' : 'var(--grey-dark)' }}
                >
                  {label}
                </button>
              ))}
            </div>
            {lbLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</div>
            ) : (lbScope === 'friends' ? lbEntries.length <= 1 : lbEntries.length === 0) ? (
              <div className="card py-14">
                <EmptyState
                  icon="trophy"
                  title={lbScope === 'friends' ? social.leaderboard.emptyFriendsTitle : social.leaderboard.emptyGlobalTitle}
                  hint={lbScope === 'friends' ? social.leaderboard.emptyFriendsHint : social.leaderboard.emptyGlobalHint}
                />
              </div>
            ) : (
              <div className="card">
                <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">{social.leaderboard.weekHeading}</p>
                <div className="divide-y divide-[var(--grey)]">
                  {lbEntries.map((entry, i) => (
                    /* Scoperta (v37): ogni riga apre il profilo pubblico */
                    <button
                      key={entry.user_id}
                      type="button"
                      disabled={entry.isMe}
                      onClick={() => openProfile(entry.user_id, entry.username, entry.photo_url)}
                      className="w-full flex items-center gap-3 py-2.5 text-left"
                    >
                      <span className={`font-bebas text-lg w-6 text-center flex-shrink-0 ${
                        i === 0 ? 'text-[var(--red)]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <Av photo={entry.photo_url} name={entry.username} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${entry.isMe ? 'text-[var(--red)]' : 'text-white'}`}>
                          {entry.username}{entry.isMe ? social.leaderboard.meSuffix : ''}
                        </p>
                        <p className="text-xs text-gray-500">{entry.count} {entry.count === 1 ? social.leaderboard.sessionSingular : social.leaderboard.sessionPlural} · {entry.minutes} {social.shared.units.min}</p>
                      </div>
                      <p className="text-sm font-semibold text-white flex-shrink-0">{entry.calories} {social.shared.units.kcal}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── AMICI ── */}
        {tab === 'friends' && (
          <>
            {/* Search */}
            <div className="relative">
              <div className="search-input-box flex items-center gap-2 rounded-xl px-3 focus-within:border-[var(--red)] focus-within:shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.2)]">
                <Search size={16} className="text-gray-500 flex-shrink-0" />
                <input
                  className="flex-1 min-w-0 bg-transparent py-[0.625rem] text-sm outline-none placeholder-[#888]"
                  placeholder={social.friends.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]) }} aria-label={social.friends.clearSearchAria} className="text-gray-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              {(searchResults.length > 0 || searching) && (
                <div className="search-dropdown absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-xl">
                  {searching && <div className="px-4 py-3 text-sm text-gray-500">{social.friends.searchingLabel}</div>}
                  {searchResults.map(r => {
                    const isFr = friendsMap.has(r.id)
                    const sentId = pendingSentMap.get(r.id)
                    const isRecv = pendingReceivedMap.has(r.id)
                    const busy = actionLoading === r.id
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)] last:border-0">
                        <button onClick={() => openProfile(r.id, r.username, r.photo_url ?? null)} className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Av photo={r.photo_url ?? null} name={r.username} size={36} />
                          <div className="text-left min-w-0">
                            <p className="font-medium text-white truncate">{r.username}</p>
                            {r.name && <p className="text-xs text-gray-500 truncate">{r.name}</p>}
                          </div>
                        </button>
                        {isFr ? (
                          <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/25 rounded-full px-2.5 py-0.5 flex items-center gap-1 flex-shrink-0">
                            <Check size={11} /> {social.friends.friendBadge}
                          </span>
                        ) : isRecv ? (
                          <button disabled={busy} className="text-xs bg-[var(--red)] text-[white] rounded-full px-2.5 py-0.5 flex-shrink-0 disabled:opacity-50"
                            onClick={async () => { const fid = pendingReceivedMap.get(r.id); if (fid) { setActionLoading(r.id); await runFriendAction(() => acceptRequest(fid)); await refetchFriends(); setActionLoading(null) } }}>
                            {social.friends.acceptLabel}
                          </button>
                        ) : sentId ? (
                          <button disabled={busy} className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0"
                            onClick={async () => { setActionLoading(r.id); await runFriendAction(() => rejectOrRemove(sentId)); await refetchFriends(); setActionLoading(null) }}>
                            <Clock size={12} /> {common.cancel}
                          </button>
                        ) : (
                          <button disabled={busy} aria-label={social.friends.addFriendAria} className="p-1.5 rounded-full bg-[var(--red)] text-[white] hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                            onClick={async () => { setActionLoading(r.id); await runFriendAction(() => sendRequest(r.id)); await refetchFriends(); setActionLoading(null) }}>
                            <UserPlus size={16} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Scoperta (v37): i più attivi del mese non ancora amici.
                Tollerante pre-migrazione: RPC assente → lista vuota → nascosta. */}
            {!searchQuery && suggestions.length > 0 && (
              <div className="card">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{social.friends.suggestionsHeading}</p>
                <p className="text-[10px] text-gray-600 mb-2">{social.friends.suggestionsSubtitle}</p>
                <div className="divide-y divide-[var(--grey)]">
                  {suggestions.map((s) => (
                    <button
                      key={s.user_id}
                      type="button"
                      onClick={() => openProfile(s.user_id, s.username, s.photo_url)}
                      className="w-full flex items-center gap-3 py-2.5 text-left"
                    >
                      <Av photo={s.photo_url} name={s.username} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.username}</p>
                        <p className="text-xs text-gray-500">{social.friends.suggestionSessions(s.count)}</p>
                      </div>
                      <UserPlus size={16} className="text-[var(--red)] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Richieste ricevute */}
            {pendingReceived.length > 0 && (
              <div className="card">
                <p className="text-xs text-[var(--red)] font-semibold mb-3 uppercase tracking-wider">{social.friends.receivedRequestsHeading(pendingReceived.length)}</p>
                <div className="divide-y divide-[var(--grey)]">
                  {pendingReceived.map(f => (
                    <div key={f.friendship_id} className="flex items-center gap-3 py-2.5">
                      <button onClick={() => openProfile(f.user_id, f.username, f.photo_url)} className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Av photo={f.photo_url} name={f.username} />
                        <div className="min-w-0 text-left">
                          <p className="text-white font-medium truncate">{f.username}</p>
                          {f.name && <p className="text-xs text-gray-500 truncate">{f.name}</p>}
                        </div>
                      </button>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => runFriendAction(() => acceptRequest(f.friendship_id))} aria-label={social.friends.acceptLabel} className="p-1.5 rounded-full bg-[var(--red)] text-[white] hover:opacity-80"><Check size={16} /></button>
                        <button type="button" onClick={() => runFriendAction(() => rejectOrRemove(f.friendship_id))} aria-label={social.friends.rejectAria} className="p-1.5 rounded-full border border-gray-600 text-gray-400 hover:text-white"><X size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista amici */}
            <div className="card">
              <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">{social.friends.yourFriendsHeading(friends.length)}</p>
              {friendsLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <SkeletonRow key={i} />)}</div>
              ) : friends.length === 0 ? (
                <div className="py-8">
                  <EmptyState icon="friends" compact title={social.friends.emptyTitle} hint={social.friends.emptyHint} />
                </div>
              ) : (
                <div className="divide-y divide-[var(--grey)]">
                  {friends.map(f => (
                    <button key={f.friendship_id} onClick={() => openProfile(f.user_id, f.username, f.photo_url)} className="w-full flex items-center gap-3 py-2.5 text-left">
                      <Av photo={f.photo_url} name={f.username} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{f.username}</p>
                        {f.name && <p className="text-xs text-gray-500 truncate">{f.name}</p>}
                      </div>
                      <MessageCircle size={16} className="text-gray-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Richieste inviate */}
            {pendingSent.length > 0 && (
              <div className="card">
                <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">{social.friends.sentRequestsHeading(pendingSent.length)}</p>
                <div className="divide-y divide-[var(--grey)]">
                  {pendingSent.map(f => (
                    <div key={f.friendship_id} className="flex items-center gap-3 py-2.5">
                      <Av photo={f.photo_url} name={f.username} />
                      <p className="flex-1 text-white font-medium truncate">{f.username}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /> {social.friends.pendingLabel}</span>
                        <button type="button" onClick={() => runFriendAction(() => rejectOrRemove(f.friendship_id))} aria-label={social.friends.cancelRequestAria} className="text-gray-600 hover:text-gray-400"><X size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <>
            {/* Shortcuts to friends */}
            {friends.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{social.chat.writeToFriendHeading}</p>
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {friends.map(f => (
                    <button key={f.user_id} onClick={() => setActiveView({ type: 'dm', userId: f.user_id, username: f.username, photo: f.photo_url })} className="flex flex-col items-center gap-1 min-w-[52px]">
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
                      setActiveView({ type: 'dm', userId: c.userId, username: c.username, photo: c.photo })
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
          </>
        )}

        {/* ── GRUPPI ── */}
        {tab === 'groups' && (
          <>
            <button onClick={() => setActiveView({ type: 'create-group' })} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} />
              {social.groups.createButton}
            </button>

            {groupsLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <SkeletonCard key={i} lines={2} />)}</div>
            ) : groups.length === 0 ? (
              <div className="card py-12">
                <EmptyState icon="group" title={social.groups.emptyTitle} hint={social.groups.emptyHint} />
              </div>
            ) : (
              <div className="card divide-y divide-[var(--grey)] p-0 overflow-hidden">
                {groups.map(g => (
                  <button key={g.id} onClick={() => setActiveView({ type: 'group', groupId: g.id, groupName: g.name })}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--grey)] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[var(--red)] flex items-center justify-center flex-shrink-0">
                      <span className="font-bebas text-lg text-[white]">{g.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.memberCount} {g.memberCount === 1 ? social.groups.memberSingular : social.groups.memberPlural} · {g.role === 'admin' ? social.groups.adminRole : social.groups.memberRole}</p>
                    </div>
                    <Users size={16} className="text-gray-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {friendActionError && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <X size={20} className="text-[var(--red)] shrink-0" />
          <p className="text-white text-sm">{friendActionError}</p>
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

      {/* Foto del feed a schermo intero */}
      {lightboxPhoto && (
        <PhotoLightbox
          url={lightboxPhoto.url}
          alt={lightboxPhoto.alt}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  )
}
