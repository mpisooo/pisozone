import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Users, Pencil, Check, X, Plus, Camera, UserMinus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useGroups, type GroupMessage, type GroupMember } from '../../hooks/useGroups'
import { uploadGroupPhoto } from '../../lib/groupPhotos'
import { haptic } from '../../lib/haptics'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import type { FriendProfile } from '../../types'
import Av from './Av'
import ActionSheet from './ActionSheet'
import AddMembersSheet from './AddMembersSheet'

// ── Group Chat View ───────────────────────────────────────────────────────────
interface Props {
  groupId: string
  groupName: string
  groupPhoto: string | null
  friends: FriendProfile[]
  myId: string
  myUsername: string
  myPhoto: string | null
  onBack: () => void
}

export default function GroupChatView({ groupId, groupName, groupPhoto, friends, myId, myUsername, myPhoto, onBack }: Props) {
  const { fetchGroupMessages, sendGroupMessage, leaveGroup, fetchGroupMembers, renameGroup, updateGroupPhoto, addMembers, removeMember } = useGroups()
  const [messages, setMessages] = useState<(GroupMessage & { failed?: boolean })[]>([])
  // null = ancora in caricamento (fix P1-5 dell'audit tecnico del 24/07/2026):
  // partire da [] mostrava "0 membri" per lo scampolo di tempo prima che il
  // fetch asincrono risolvesse, indistinguibile da un gruppo vuoto — i dati in
  // DB sono corretti fin da subito (createGroup li inserisce già), è solo
  // uno stato di caricamento non distinto da quello vuoto.
  const [members, setMembers] = useState<GroupMember[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const membersRef = useRef<GroupMember[] | null>(null)

  // Gruppi vivi (roadmap v6): nome e foto restano locali a questa vista —
  // niente header duplicato altrove da tenere sincronizzato, si aggiornano
  // da soli quando la lista gruppi si ricarica al ritorno indietro.
  const [displayName, setDisplayName] = useState(groupName)
  const [photoUrl, setPhotoUrl] = useState(groupPhoto)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(groupName)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [kickTarget, setKickTarget] = useState<GroupMember | null>(null)
  const [kicking, setKicking] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { membersRef.current = members }, [members])

  useEffect(() => {
    fetchGroupMessages(groupId).then(setMessages)
    fetchGroupMembers(groupId).then(setMembers)

    const ch = supabase.channel(`grp-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, (p: any) => {
        const m = p.new
        if (m.sender_id === myId) return
        const sender = membersRef.current?.find(mem => mem.id === m.sender_id)
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

  const myRole = members?.find(m => m.id === myId)?.role
  const isAdmin = myRole === 'admin'

  const handleSaveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === displayName) { setRenaming(false); return }
    const ok = await renameGroup(groupId, nameDraft)
    if (ok) setDisplayName(nameDraft.trim())
    setRenaming(false)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingPhoto(true)
    const { url, error } = await uploadGroupPhoto(groupId, file)
    if (!error && url) {
      const ok = await updateGroupPhoto(groupId, url)
      if (ok) setPhotoUrl(url)
    }
    setUploadingPhoto(false)
  }

  const handleAddMembers = async (userIds: string[]) => {
    await addMembers(groupId, userIds)
    setMembers(await fetchGroupMembers(groupId))
    setShowAddMembers(false)
  }

  const handleConfirmKick = async () => {
    if (!kickTarget || kicking) return
    setKicking(true)
    const { error } = await removeMember(groupId, kickTarget.id)
    setKicking(false)
    setKickTarget(null)
    if (!error) setMembers(prev => prev && prev.filter(m => m.id !== kickTarget.id))
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="tap p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>

        {/* Foto di gruppo (roadmap v6): tap per cambiarla, solo admin */}
        <button
          type="button"
          onClick={() => isAdmin && photoInputRef.current?.click()}
          aria-label={social.groups.manage.changePhotoAria}
          disabled={!isAdmin}
          className={isAdmin ? 'tap relative flex-shrink-0' : 'flex-shrink-0'}
        >
          <Av photo={photoUrl} name={displayName} size={36} />
          {isAdmin && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--red)' }}>
              <Camera size={9} className="text-white" />
            </span>
          )}
        </button>
        {isAdmin && (
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        )}

        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1.5">
              <input
                className="input-dark text-sm py-1 flex-1 min-w-0"
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setRenaming(false) }}
                autoFocus
              />
              <button type="button" onClick={handleSaveName} aria-label={social.groups.manage.saveNameAria} className="tap text-[var(--red)] flex-shrink-0"><Check size={18} /></button>
              <button type="button" onClick={() => setRenaming(false)} aria-label={social.groups.manage.cancelRenameAria} className="tap text-gray-500 flex-shrink-0"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-semibold text-white truncate">{displayName}</p>
              {isAdmin && (
                <button type="button" onClick={() => { setNameDraft(displayName); setRenaming(true) }} aria-label={social.groups.manage.renameAria} className="tap text-gray-500 hover:text-white flex-shrink-0">
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
          {!renaming && (
            members === null
              ? <span className="skeleton h-3 w-16 rounded inline-block" />
              : <p className="text-xs text-gray-500">{members.length} {social.groups.memberPlural}</p>
          )}
        </div>
        <button type="button" onClick={() => setShowMembers(v => !v)} aria-label={social.chat.group.showMembersAria} className={`tap p-1 transition-colors ${showMembers ? 'text-[var(--red)]' : 'text-gray-400 hover:text-white'}`}>
          <Users size={18} />
        </button>
      </div>

      {showMembers && (
        <div className="px-4 py-3 border-b border-[var(--grey)] space-y-2">
          <div className="flex flex-wrap gap-3">
            {(members ?? []).map(m => {
              const canKick = isAdmin && m.id !== myId
              const avatar = (
                <div className="relative">
                  <Av photo={m.photo_url} name={m.username} size={32} />
                  {m.role === 'admin' && <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>}
                </div>
              )
              return canKick ? (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setKickTarget(m)}
                  aria-label={social.groups.manage.removeMemberAria(m.username)}
                  className="tap flex flex-col items-center gap-1"
                >
                  {avatar}
                  <span className="text-[10px] text-gray-400 max-w-[48px] truncate text-center">{m.username}</span>
                </button>
              ) : (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  {avatar}
                  <span className="text-[10px] text-gray-400 max-w-[48px] truncate text-center">{m.username}</span>
                </div>
              )
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddMembers(true)}
                aria-label={social.groups.manage.addMembersTileAria}
                className="tap flex flex-col items-center gap-1"
              >
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-500">
                  <Plus size={16} />
                </div>
                <span className="text-[10px] text-gray-500">{social.groups.manage.addMembersTileAria}</span>
              </button>
            )}
          </div>
          {!isAdmin && (
            <button onClick={async () => { await leaveGroup(groupId); onBack() }} className="tap text-xs text-red-400 mt-1">
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

      {showAddMembers && (
        <AddMembersSheet
          friends={friends}
          existingMemberIds={(members ?? []).map(m => m.id)}
          onClose={() => setShowAddMembers(false)}
          onSubmit={handleAddMembers}
        />
      )}

      {kickTarget && (
        <ActionSheet onClose={() => setKickTarget(null)} label={social.groups.manage.removeConfirmSheetLabel}>
          <div className="px-4 pt-4 pb-3 border-b border-[var(--grey)]">
            <p className="text-sm font-semibold text-white">{social.groups.manage.removeConfirmQuestion(kickTarget.username)}</p>
            <p className="text-xs text-gray-500 mt-1">{social.groups.manage.removeConfirmHint}</p>
          </div>
          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => { haptic('light'); handleConfirmKick() }}
              disabled={kicking}
              className="btn-destructive w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserMinus size={16} /> {social.groups.manage.removeConfirmButton}
            </button>
            <button type="button" onClick={() => setKickTarget(null)} className="btn-secondary w-full">
              {common.cancel}
            </button>
          </div>
        </ActionSheet>
      )}
    </div>
  )
}
