import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { it as itLocale } from 'date-fns/locale'
import { ChevronDown, Trash2, Swords, Share2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { useDuels } from '../hooks/useDuels'
import { useToast } from '../context/ToastContext'
import { fetchUserSegments, fetchAllUserAttempts, deleteSegment } from '../lib/routeSegments'
import { buildSegmentPrMap, formatSegmentTime } from '../lib/segments'
import { isSegmentHasActiveDuelError } from '../lib/errors'
import { buildSegmentPrShareData, shareCardImage } from '../lib/shareCard'
import { haptic } from '../lib/haptics'
import ActivityIcon from '../components/ActivityIcon'
import EmptyState from '../components/EmptyState'
import SkeletonCard from '../components/SkeletonCard'
import SegmentDuelCreateModal from '../components/SegmentDuelCreateModal'
import common from '../lib/i18n/common'
import segmentsText from '../lib/i18n/segments'
import shareText from '../lib/i18n/share'
import type { RouteSegment, SegmentAttempt } from '../types'

// Segmenti personali (v47, roadmap v4 pilastro 02): lista dei tratti creati
// dall'utente (mai da altri: la pagina mostra solo route_segments di
// proprietà), con lo storico dei propri tentativi (buildSegmentPrMap ne
// ricava il record) e l'avvio di una sfida di percorso su uno di essi.
export default function SegmentsPage() {
  const { user } = useAuth()
  const { friends } = useFriends()
  const { createDuel, working: duelWorking } = useDuels()
  const { showError } = useToast()
  const [segments, setSegments] = useState<RouteSegment[]>([])
  const [attempts, setAttempts] = useState<SegmentAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [challengeSegment, setChallengeSegment] = useState<RouteSegment | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    Promise.all([fetchUserSegments(user.id), fetchAllUserAttempts(user.id)]).then(([s, a]) => {
      if (cancelled) return
      setSegments(s.segments)
      setAttempts(a.attempts)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const prMap = useMemo(() => buildSegmentPrMap(attempts), [attempts])
  const attemptsBySegment = useMemo(() => {
    const map = new Map<string, SegmentAttempt[]>()
    for (const a of attempts) {
      const list = map.get(a.segment_id) ?? []
      list.push(a)
      map.set(a.segment_id, list)
    }
    for (const list of map.values()) list.sort((x, y) => x.time_seconds - y.time_seconds)
    return map
  }, [attempts])

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    const { error } = await deleteSegment(id)
    if (error) {
      showError(isSegmentHasActiveDuelError(error) ? segmentsText.page.deleteBlockedByDuel : segmentsText.page.deleteFailed)
      setConfirmDeleteId(null)
      return
    }
    setSegments((prev) => prev.filter((s) => s.id !== id))
    setConfirmDeleteId(null)
  }

  // Card condivisibile (roadmap v5, pilastro 03): il PR di segmento era una
  // delle flagship v4 mai diventata un'immagine, come attività/Wrapped.
  async function handleShare(segment: RouteSegment, bestTimeSeconds: number) {
    setSharingId(segment.id)
    const outcome = await shareCardImage(
      buildSegmentPrShareData(segment, bestTimeSeconds),
      `pisozone-${segment.name}.png`,
    )
    setSharingId(null)
    if (outcome === 'failed') showError(shareText.error)
    else if (outcome !== 'cancelled') haptic('success')
  }

  async function handleCreateDuel(opponentId: string, days: number): Promise<boolean> {
    if (!challengeSegment) return false
    const { error } = await createDuel({ opponent_id: opponentId }, 'segment_time', days, {
      id: challengeSegment.id,
      name: challengeSegment.name,
      activity_type: challengeSegment.activity_type,
      start_lat: challengeSegment.start_lat,
      start_lng: challengeSegment.start_lng,
      end_lat: challengeSegment.end_lat,
      end_lng: challengeSegment.end_lng,
      distance_m: challengeSegment.distance_m,
    })
    return !error
  }

  if (loading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{segmentsText.page.pageTitle}</span>
        <div className="header-accent" />
        <p className="text-xs text-gray-500 mt-2">{segmentsText.page.subtitle}</p>
      </div>

      {segments.length === 0 && (
        <div className="card py-10">
          <EmptyState icon="bolt" title={segmentsText.page.emptyState.title} hint={segmentsText.page.emptyState.hint} />
        </div>
      )}

      {segments.map((s) => {
        const segAttempts = attemptsBySegment.get(s.id) ?? []
        const best = prMap.get(s.id)
        return (
          <details key={s.id} className="card group !p-0 overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
              <span className="text-[var(--red)] flex-shrink-0">
                <ActivityIcon type={s.activity_type} size={32} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{s.name}</p>
                <p className="text-xs text-gray-500">
                  {(s.distance_m / 1000).toFixed(2)} km
                  {best != null && <> · {segmentsText.page.bestLabel}: <span className="text-[var(--red)]">{formatSegmentTime(best)}</span></>}
                </p>
              </div>
              <ChevronDown size={18} className="text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  {segmentsText.page.attemptsCount(segAttempts.length)}
                </p>
                {segAttempts.length > 0 ? (
                  <div className="space-y-1.5">
                    {segAttempts.slice(0, 10).map((a, i) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className={i === 0 ? 'text-[var(--red)] font-semibold' : 'text-gray-400'}>
                          {formatSegmentTime(a.time_seconds)}
                        </span>
                        <span className="text-gray-600">{format(parseISO(a.created_at), 'd MMM yyyy', { locale: itLocale })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">{segmentsText.page.noAttemptsYet}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                  onClick={() => setChallengeSegment(s)}
                >
                  <Swords size={14} />
                  {segmentsText.page.challengeButton}
                </button>
                {best != null && (
                  <button
                    type="button"
                    onClick={() => handleShare(s, best)}
                    disabled={sharingId === s.id}
                    aria-label={shareText.segmentPrButton}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white disabled:opacity-40 flex-shrink-0 tap"
                    style={{ border: '1px solid var(--grey-light)' }}
                  >
                    <Share2 size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  aria-label={confirmDeleteId === s.id ? common.confirmQuestion : segmentsText.page.deleteButton}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 tap ${
                    confirmDeleteId === s.id ? 'text-white' : 'text-red-400 hover:bg-red-900/20'
                  }`}
                  style={confirmDeleteId === s.id ? { background: 'var(--red)' } : { border: '1px solid #7f1d1d' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </details>
        )
      })}

      {challengeSegment && (
        <SegmentDuelCreateModal
          segment={challengeSegment}
          friends={friends}
          working={duelWorking}
          onCreate={handleCreateDuel}
          onClose={() => setChallengeSegment(null)}
        />
      )}
    </div>
  )
}
