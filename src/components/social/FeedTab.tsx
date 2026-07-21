import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { getLevelDef } from '../../lib/levels'
import { REACTION_KINDS, REACTION_EMOJI, topKinds, type ReactionKind } from '../../lib/reactions'
import { haptic } from '../../lib/haptics'
import social from '../../lib/i18n/social'
import { ACTIVITY_OPTIONS, activityLabel } from '../../lib/constants'
import SkeletonCard from '../SkeletonCard'
import ActivityIcon from '../ActivityIcon'
import EmptyState from '../EmptyState'
import RouteShape from '../RouteShape'
import type { FeedActivity, Reactor } from '../../hooks/useFeed'
import Av from './Av'
import ActionSheet from './ActionSheet'
import FeedComments from './FeedComments'

// ── Tab FEED ──────────────────────────────────────────────────────────────────
interface Props {
  loading: boolean
  feed: FeedActivity[]
  highlightedActivityId: string | null
  myId: string | undefined
  openProfile: (userId: string, username: string, photo: string | null) => void
  openReactionsId: string | null
  setOpenReactionsId: Dispatch<SetStateAction<string | null>>
  react: (activityId: string, kind: ReactionKind) => void
  fetchReactors: (activityId: string) => Promise<Reactor[]>
  openCommentsId: string | null
  setOpenCommentsId: Dispatch<SetStateAction<string | null>>
  commentCounts: Map<string, number>
  onCommentCountChange: (id: string, n: number) => void
  onOpenLightbox: (photo: { url: string; alt: string }) => void
}

export default function FeedTab({
  loading, feed, highlightedActivityId, myId, openProfile,
  openReactionsId, setOpenReactionsId, react, fetchReactors,
  openCommentsId, setOpenCommentsId, commentCounts, onCommentCountChange, onOpenLightbox,
}: Props) {
  // Chi ha reagito (roadmap v6): la lista nominale si scarica su richiesta,
  // non tenuta in memoria per tutte le attività del feed.
  const [reactorsSheetId, setReactorsSheetId] = useState<string | null>(null)
  const [reactors, setReactors] = useState<Reactor[]>([])
  const [reactorsLoading, setReactorsLoading] = useState(false)

  const openReactorsSheet = async (activityId: string) => {
    setReactorsSheetId(activityId)
    setReactorsLoading(true)
    setReactors(await fetchReactors(activityId))
    setReactorsLoading(false)
  }
  return (
    <>
      {loading ? (
        <div className="space-y-4">{[1, 2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
      ) : feed.length === 0 ? (
        <div className="card py-14">
          <EmptyState icon="bolt" title={social.feed.emptyTitle} hint={social.feed.emptyHint} />
        </div>
      ) : (
        feed.map((a, i) => {
          const opt = ACTIVITY_OPTIONS.find(o => o.value === a.type)
          const ld = getLevelDef(a.user_level)
          const ago = formatDistanceToNow(parseISO(a.date), { addSuffix: true, locale: it })
          return (
            <div
              key={a.id}
              id={`feed-act-${a.id}`}
              className="card space-y-3 stagger-in"
              style={{
                // Evidenziazione deep-link: outline, non box-shadow — la
                // .card ha già la sua elevazione e non va soppressa.
                outline: highlightedActivityId === a.id ? '2px solid var(--red)' : '2px solid transparent',
                outlineOffset: 2,
                transition: 'outline-color 0.4s ease',
                // Cascata solo sulle prime card (roadmap v5, pilastro 02 punto
                // 2): il feed può avere fino a 50 attività, un ritardo
                // cumulativo su tutte sembrerebbe lentezza, non cura.
                ...({ '--stagger-i': Math.min(i, 8) } as React.CSSProperties),
              }}
            >
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
              {/* Percorso condiviso (v45): la sagoma stilizzata, mai una
                  mappa — "guarda che giro" senza coordinate leggibili. */}
              {a.route && a.route.length >= 2 && (
                <div className="flex justify-center rounded-xl py-2" style={{ background: 'var(--grey)' }}>
                  <RouteShape points={a.route} width={280} height={110} />
                </div>
              )}
              {a.photo_url && (
                <button
                  type="button"
                  onClick={() => onOpenLightbox({ url: a.photo_url!, alt: social.feed.activityPhotoAlt(a.username) })}
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
                  </button>
                </div>
                {/* Chi ha reagito (roadmap v6): tocco separato dal toggle del
                    picker sopra — qui si vede CHI, non solo quanti. */}
                {a.reactions.total > 0 && (
                  <button
                    type="button"
                    onClick={() => openReactorsSheet(a.id)}
                    aria-label={social.feed.reactions.viewReactorsAria(a.reactions.total)}
                    className="flex items-center gap-0.5 text-sm text-gray-400 transition-all active:scale-110"
                  >
                    {topKinds(a.reactions).filter(k => k !== a.reactions.mine).map(k => (
                      <span key={k} className="text-sm leading-none">{REACTION_EMOJI[k]}</span>
                    ))}
                    <span className="font-medium ml-0.5">{a.reactions.total}</span>
                  </button>
                )}
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
              {openCommentsId === a.id && myId && (
                <FeedComments
                  activityId={a.id}
                  ownerId={a.user_id}
                  myId={myId}
                  onCountChange={onCommentCountChange}
                />
              )}
            </div>
          )
        })
      )}

      {reactorsSheetId && (
        <ActionSheet onClose={() => setReactorsSheetId(null)} label={social.feed.reactions.reactorsSheetLabel}>
          <div className="px-4 pt-4 pb-3 border-b border-[var(--grey)]">
            <p className="text-sm font-semibold text-white">{social.feed.reactions.reactorsSheetLabel}</p>
          </div>
          <div className="max-h-[50vh] overflow-y-auto py-1">
            {reactorsLoading ? (
              <p className="px-5 py-4 text-sm text-gray-500">{social.feed.reactions.reactorsLoading}</p>
            ) : (
              reactors.map(r => (
                <div key={r.userId} className="w-full flex items-center gap-3 px-5 py-2.5">
                  <Av photo={r.photo} name={r.username} size={32} />
                  <span className="flex-1 text-white font-medium truncate">{r.username}</span>
                  <span className="text-lg leading-none flex-shrink-0">{REACTION_EMOJI[r.kind]}</span>
                </div>
              ))
            )}
          </div>
        </ActionSheet>
      )}
    </>
  )
}
