import { useState, useRef, useCallback } from 'react'
import { Search, UserPlus, Check, X, Clock, Users } from 'lucide-react'
import { useFriends } from '../hooks/useFriends'
import type { UserSearchResult } from '../hooks/useFriends'
import type { FriendProfile } from '../types'

function Avatar({ photo_url, username, size = 40 }: { photo_url: string | null; username: string; size?: number }) {
  const sizeClass = size === 36 ? 'w-9 h-9' : 'w-10 h-10'
  const textClass = size === 36 ? 'text-[14px]' : 'text-base'

  if (photo_url) {
    return (
      <img
        src={photo_url}
        alt={username}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass}`}
      />
    )
  }
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 font-bebas text-[white] bg-[#F44352] ${sizeClass} ${textClass}`}>
      {username[0]?.toUpperCase()}
    </div>
  )
}

function FriendRow({ friend, onRemove }: { friend: FriendProfile; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar photo_url={friend.photo_url} username={friend.username} />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{friend.username}</p>
        {friend.name && <p className="text-xs text-gray-500 truncate">{friend.name}</p>}
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-red-400 border border-red-400 rounded px-2 py-1"
            onClick={onRemove}
          >
            Rimuovi
          </button>
          <button
            type="button"
            className="text-xs text-gray-400"
            onClick={() => setConfirming(false)}
          >
            Annulla
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="text-gray-600 hover:text-gray-400 transition-colors"
          onClick={() => setConfirming(true)}
          title="Rimuovi amico"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

function PendingReceivedRow({
  friend,
  onAccept,
  onReject,
}: {
  friend: FriendProfile
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar photo_url={friend.photo_url} username={friend.username} />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{friend.username}</p>
        {friend.name && <p className="text-xs text-gray-500 truncate">{friend.name}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="p-1.5 rounded-full bg-[#F44352] text-[white] hover:opacity-80 transition-opacity"
          onClick={onAccept}
          title="Accetta"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          className="p-1.5 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          onClick={onReject}
          title="Rifiuta"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function PendingSentRow({ friend, onCancel }: { friend: FriendProfile; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar photo_url={friend.photo_url} username={friend.username} />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{friend.username}</p>
        {friend.name && <p className="text-xs text-gray-500 truncate">{friend.name}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          In attesa
        </span>
        <button
          type="button"
          className="text-gray-600 hover:text-gray-400 transition-colors"
          onClick={onCancel}
          title="Annulla richiesta"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default function FriendsPage() {
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectOrRemove,
  } = useFriends()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingSentMap = new Map(pendingSent.map(f => [f.user_id, f.friendship_id]))

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchUsers(value)
      setResults(res)
      setSearching(false)
    }, 350)
  }, [searchUsers])

  const handleSend = async (userId: string) => {
    setActionLoading(userId)
    await sendRequest(userId)
    setResults(prev => prev.filter(r => r.id !== userId))
    setActionLoading(null)
  }

  const handleCancel = async (friendshipId: string, userId: string) => {
    setActionLoading(userId)
    await rejectOrRemove(friendshipId)
    setActionLoading(null)
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-6 max-w-lg mx-auto">
      <h1 className="font-bebas text-4xl text-white tracking-wider pt-2">Amici</h1>

      {/* Search */}
      <div className="relative">
        <div className="search-input-box flex items-center gap-2 rounded-lg px-3 transition-all duration-200 focus-within:border-[#F44352] focus-within:shadow-[0_0_0_2px_rgba(244,67,82,0.2)]">
          <Search size={16} className="text-gray-500 flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent py-[0.625rem] text-sm outline-none placeholder-[#888]"
            placeholder="Cerca per username…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {(results.length > 0 || searching) && (
          <div className="search-dropdown absolute z-10 w-full mt-1 rounded-lg overflow-hidden">
            {searching && (
              <div className="px-4 py-3 text-sm text-gray-500">Ricerca…</div>
            )}
            {results.map(r => {
              const isFriend = friends.some(f => f.user_id === r.id)
              const sentId = pendingSentMap.get(r.id)
              const isReceived = pendingReceived.some(f => f.user_id === r.id)
              const busy = actionLoading === r.id

              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)] last:border-0 ${isFriend ? 'opacity-60' : ''}`}>
                  <Avatar photo_url={r.photo_url} username={r.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isFriend ? 'text-gray-400' : 'text-white'}`}>{r.username}</p>
                    {r.name && <p className="text-xs text-gray-500 truncate">{r.name}</p>}
                  </div>
                  {isFriend ? (
                    <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/25 rounded-full px-2.5 py-0.5 flex items-center gap-1 flex-shrink-0">
                      <Check size={11} /> Amico
                    </span>
                  ) : isReceived ? (
                    <span className="text-xs text-gray-500">Ti ha aggiunto</span>
                  ) : sentId ? (
                    <button
                      type="button"
                      className="text-xs text-gray-500 flex items-center gap-1"
                      disabled={busy}
                      onClick={() => handleCancel(sentId, r.id)}
                    >
                      <Clock size={12} /> Annulla
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-1.5 rounded-full bg-[#F44352] text-[white] hover:opacity-80 transition-opacity disabled:opacity-40"
                      disabled={busy}
                      onClick={() => handleSend(r.id)}
                      title="Aggiungi amico"
                    >
                      <UserPlus size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Richieste ricevute */}
      {pendingReceived.length > 0 && (
        <div className="card">
          <p className="text-xs text-[#F44352] font-semibold mb-3 uppercase tracking-wider">
            Richieste ricevute ({pendingReceived.length})
          </p>
          <div className="divide-y divide-[var(--grey)]">
            {pendingReceived.map(f => (
              <PendingReceivedRow
                key={f.friendship_id}
                friend={f}
                onAccept={() => acceptRequest(f.friendship_id)}
                onReject={() => rejectOrRemove(f.friendship_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista amici */}
      <div className="card">
        <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">
          I tuoi amici ({friends.length})
        </p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[var(--grey)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[var(--grey)] rounded w-1/3" />
                  <div className="h-2.5 bg-[var(--grey)] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-5xl mb-3">🏆</p>
            <p className="font-bebas text-xl text-white tracking-wider mb-1">Sfida qualcuno!</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Aggiungi un amico e compete nella classifica settimanale.
              <br />Cerca il suo username qui sopra.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--grey)]">
            {friends.map(f => (
              <FriendRow
                key={f.friendship_id}
                friend={f}
                onRemove={() => rejectOrRemove(f.friendship_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Richieste inviate */}
      {pendingSent.length > 0 && (
        <div className="card">
          <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">
            Richieste inviate ({pendingSent.length})
          </p>
          <div className="divide-y divide-[var(--grey)]">
            {pendingSent.map(f => (
              <PendingSentRow
                key={f.friendship_id}
                friend={f}
                onCancel={() => rejectOrRemove(f.friendship_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
