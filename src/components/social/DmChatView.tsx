import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, MessageCircle, Edit2, Trash2, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useMessages, type Message } from '../../hooks/useMessages'
import { haptic } from '../../lib/haptics'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import Av from './Av'
import ActionSheet from './ActionSheet'

// ── DM Chat View ──────────────────────────────────────────────────────────────
type ChatMessage = Message & { failed?: boolean }

interface Props {
  userId: string
  username: string
  photo: string | null
  myId: string
  onBack: () => void
}

export default function DmChatView({ userId, username, photo, myId, onBack }: Props) {
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
              {/* Orario sotto ogni messaggio (roadmap v6): created_at arriva
                  già da ogni fetch, semplicemente non era mai renderizzato. */}
              {!msg.id.startsWith('tmp-') && (
                <span className="text-[9px] text-gray-600 mt-0.5 px-1">{format(parseISO(msg.created_at), 'HH:mm')}</span>
              )}
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
            <button onClick={() => setSelectedMsg(null)} className="btn-secondary w-full text-sm">
              {common.cancel}
            </button>
          </div>
        </ActionSheet>
      )}
    </div>
  )
}
