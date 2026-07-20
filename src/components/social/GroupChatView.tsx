import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useGroups, type GroupMessage, type GroupMember } from '../../hooks/useGroups'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import Av from './Av'

// ── Group Chat View ───────────────────────────────────────────────────────────
interface Props {
  groupId: string
  groupName: string
  myId: string
  myUsername: string
  myPhoto: string | null
  onBack: () => void
}

export default function GroupChatView({ groupId, groupName, myId, myUsername, myPhoto, onBack }: Props) {
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
