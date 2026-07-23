import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useFriends } from '../hooks/useFriends'
import { useMessages } from '../hooks/useMessages'
import { useGroups } from '../hooks/useGroups'
import { useFeed } from '../hooks/useFeed'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useComments } from '../hooks/useComments'
import { useBlocks } from '../hooks/useBlocks'
import { isRateLimitError } from '../lib/errors'
import social from '../lib/i18n/social'
import PhotoLightbox from '../components/PhotoLightbox'
import ContextualTip from '../components/ContextualTip'
import DmChatView from '../components/social/DmChatView'
import GroupChatView from '../components/social/GroupChatView'
import FriendProfileView from '../components/social/FriendProfileView'
import CreateGroupView from '../components/social/CreateGroupView'
import FeedTab from '../components/social/FeedTab'
import LeaderboardTab from '../components/social/LeaderboardTab'
import FriendsTab from '../components/social/FriendsTab'
import ChatTab from '../components/social/ChatTab'
import GroupsTab from '../components/social/GroupsTab'

type Tab = 'feed' | 'classifica' | 'friends' | 'chat' | 'groups'
type ActiveView =
  | { type: 'dm'; userId: string; username: string; photo: string | null }
  | { type: 'group'; groupId: string; groupName: string; groupPhoto: string | null }
  | { type: 'profile'; userId: string; username: string; photo: string | null; friendshipId?: string; isFriend: boolean; isPendingSent: boolean; isPendingReceived: boolean }
  | { type: 'create-group' }

// ── Main Page ─────────────────────────────────────────────────────────────────
const VALID_TABS: Tab[] = ['feed', 'classifica', 'friends', 'chat', 'groups']

export default function SocialPage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  const [tab, setTab] = useState<Tab>(() => {
    // Lo state arriva dalla navigazione interna (Home, campanella); il query
    // param dalle push (?tab=friends), che attraversano un vero page load.
    const requested = (location.state as { tab?: Tab } | null)?.tab
      ?? (new URLSearchParams(location.search).get('tab') as Tab | null)
    return requested && VALID_TABS.includes(requested) ? requested : 'feed'
  })
  const [activeView, setActiveView] = useState<ActiveView | null>(null)
  const [friendActionError, setFriendActionError] = useState('')

  const { friends, pendingReceived, pendingSent, loading: friendsLoading, searchUsers, sendRequest, acceptRequest, rejectOrRemove, fetchMutualFriendsCounts, refetch: refetchFriends } = useFriends()
  const { conversations, loadingConvs, fetchConversations, deleteConversation } = useMessages()
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useGroups()
  const { feed, loading: feedLoading, refetch: refetchFeed, react, fetchReactors } = useFeed()
  const { indicator: pullIndicator, handlers: pullHandlers } = usePullToRefresh(refetchFeed)
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

  // Deep-link dalla push di un messaggio (roadmap v3, pilastro 04): la
  // notifica porta ?dm=<userId> attraverso un vero page load (il service
  // worker naviga, non passa uno state di rotta). Si apre la conversazione
  // esatta e si pulisce l'URL, così un refresh non la riapre a sorpresa.
  useEffect(() => {
    const dmId = new URLSearchParams(location.search).get('dm')
    if (new URLSearchParams(location.search).toString()) {
      window.history.replaceState(window.history.state, '', '/social')
    }
    if (!dmId || !user || dmId === user.id) return
    let cancelled = false
    supabase.from('profiles').select('username, photo_url').eq('id', dmId).single().then(({ data }) => {
      if (cancelled || !data) return
      setTab('chat')
      setActiveView({ type: 'dm', userId: dmId, username: data.username, photo: data.photo_url })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Deep-link dalla campanella (pilastro 04): reazioni e commenti portano
  // all'attività esatta — scroll al centro e bordo acceso per qualche
  // secondo. Se l'attività non è tra le 50 del feed, resta la scheda giusta.
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)
  const highlightConsumedRef = useRef(false)
  useEffect(() => {
    const targetId = (location.state as { activityId?: string } | null)?.activityId
    if (!targetId || feedLoading || highlightConsumedRef.current) return
    highlightConsumedRef.current = true
    if (!feed.some(a => a.id === targetId)) return
    setHighlightedActivityId(targetId)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scrollTimer = setTimeout(() => {
      document.getElementById(`feed-act-${targetId}`)?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'center',
      })
    }, 100)
    const clearTimer = setTimeout(() => setHighlightedActivityId(null), 3000)
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedLoading, feed])

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
          <GroupChatView
            groupId={activeView.groupId} groupName={activeView.groupName} groupPhoto={activeView.groupPhoto}
            friends={friends} myId={user!.id} myUsername={myUsername} myPhoto={myPhoto}
            onBack={() => { setActiveView(null); refetchGroups() }}
          />
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
            fetchMutualFriendsCounts={fetchMutualFriendsCounts}
          />
        )}
        {activeView.type === 'create-group' && (
          <CreateGroupView friends={friends} onBack={() => setActiveView(null)}
            onCreate={(gid, gname) => { setActiveView({ type: 'group', groupId: gid, groupName: gname, groupPhoto: null }); refetchGroups() }} />
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

      <ContextualTip tipId="social" icon="👥" title={social.tip.title} text={social.tip.text} className="mx-4 mb-4" />

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
          <div {...pullHandlers}>
            {pullIndicator}
            <FeedTab
              loading={feedLoading}
              feed={feed}
              highlightedActivityId={highlightedActivityId}
              myId={user?.id}
              openProfile={openProfile}
              openReactionsId={openReactionsId}
              setOpenReactionsId={setOpenReactionsId}
              react={react}
              fetchReactors={fetchReactors}
              openCommentsId={openCommentsId}
              setOpenCommentsId={setOpenCommentsId}
              commentCounts={commentCounts}
              onCommentCountChange={updateCommentCount}
              onOpenLightbox={setLightboxPhoto}
              onGoToFriends={() => setTab('friends')}
            />
          </div>
        )}

        {/* ── CLASSIFICA ── */}
        {tab === 'classifica' && (
          <LeaderboardTab
            lbScope={lbScope}
            setLbScope={setLbScope}
            loading={lbLoading}
            entries={lbEntries}
            openProfile={openProfile}
          />
        )}

        {/* ── AMICI ── */}
        {tab === 'friends' && (
          <FriendsTab
            username={profile?.username ?? ''}
            friends={friends}
            friendsLoading={friendsLoading}
            pendingReceived={pendingReceived}
            pendingSent={pendingSent}
            friendsMap={friendsMap}
            pendingSentMap={pendingSentMap}
            pendingReceivedMap={pendingReceivedMap}
            suggestions={suggestions}
            searchUsers={searchUsers}
            fetchMutualFriendsCounts={fetchMutualFriendsCounts}
            blockedIds={blockedIds}
            sendRequest={sendRequest}
            acceptRequest={acceptRequest}
            rejectOrRemove={rejectOrRemove}
            refetchFriends={refetchFriends}
            runFriendAction={runFriendAction}
            openProfile={openProfile}
          />
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <ChatTab
            friends={friends}
            conversations={conversations}
            loadingConvs={loadingConvs}
            deleteConversation={deleteConversation}
            fetchConversations={fetchConversations}
            onOpenDm={(userId, username, photo) => setActiveView({ type: 'dm', userId, username, photo })}
          />
        )}

        {/* ── GRUPPI ── */}
        {tab === 'groups' && (
          <GroupsTab
            groups={groups}
            loading={groupsLoading}
            onCreateGroup={() => setActiveView({ type: 'create-group' })}
            onOpenGroup={(groupId, groupName, groupPhoto) => setActiveView({ type: 'group', groupId, groupName, groupPhoto })}
          />
        )}

      </div>

      {friendActionError && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <X size={20} className="text-[var(--red)] shrink-0" />
          <p className="text-[var(--color-text)] text-sm">{friendActionError}</p>
        </div>
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
