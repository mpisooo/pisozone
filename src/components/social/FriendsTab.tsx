import { useState, useRef, useCallback } from 'react'
import { Search, X, Check, Clock, UserPlus, MessageCircle } from 'lucide-react'
import { SkeletonRow } from '../SkeletonCard'
import EmptyState from '../EmptyState'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import type { FriendProfile } from '../../types'
import type { UserSearchResult } from '../../hooks/useFriends'
import Av from './Av'

// ── Tab AMICI ─────────────────────────────────────────────────────────────────
interface Suggestion { user_id: string; username: string; photo_url: string | null; count: number }

interface Props {
  friends: FriendProfile[]
  friendsLoading: boolean
  pendingReceived: FriendProfile[]
  pendingSent: FriendProfile[]
  friendsMap: Map<string, string>
  pendingSentMap: Map<string, string>
  pendingReceivedMap: Map<string, string>
  suggestions: Suggestion[]
  searchUsers: (query: string) => Promise<UserSearchResult[]>
  blockedIds: string[]
  sendRequest: (addresseeId: string) => Promise<{ error: Error | null }>
  acceptRequest: (friendshipId: string) => Promise<{ error: Error | null }>
  rejectOrRemove: (friendshipId: string) => Promise<{ error: Error | null }>
  refetchFriends: () => Promise<void>
  runFriendAction: (action: () => Promise<{ error: Error | null } | undefined>) => Promise<void>
  openProfile: (userId: string, username: string, photo: string | null) => void
}

export default function FriendsTab({
  friends, friendsLoading, pendingReceived, pendingSent,
  friendsMap, pendingSentMap, pendingReceivedMap,
  suggestions, searchUsers, blockedIds,
  sendRequest, acceptRequest, rejectOrRemove, refetchFriends, runFriendAction,
  openProfile,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
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
  )
}
