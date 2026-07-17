import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { X, Share2, Trophy, CloudOff, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { haptic } from '../lib/haptics'
import { activityLabel } from '../lib/constants'
import { formatMinutesCompact } from '../lib/stats'
import { computeSplits, formatPaceClock } from '../lib/gps'
import { buildActivityShareData, shareCardImage } from '../lib/shareCard'
import type { WorkoutRecapData } from '../lib/workoutRecap'
import RouteShape from './RouteShape'
import RouteInsights from './RouteInsights'
import recapText from '../lib/i18n/recap'

// Stessa strategia di ActivityEditModal: Leaflet arriva solo quando serve
// davvero, e senza key o senza rete si ripiega sulla sagoma RouteShape.
const RouteMap = lazy(() => import('./RouteMap'))
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

interface Props {
  data: WorkoutRecapData
  onClose: () => void
  // Percorso nel feed (v45): il consenso si offre nel momento più naturale,
  // subito dopo il salvataggio. Facoltativo: senza callback il toggle sparisce.
  updateActivity?: (
    id: string,
    updates: { route_visible: boolean },
  ) => Promise<{ data: unknown; error: Error | null }>
}

// Recap del dopo-allenamento GPS (roadmap v3, pilastro 01 punto 1 — flagship):
// l'overlay celebrativo che sostituisce il toast al salvataggio di un
// allenamento tracciato. Mappa, passo per km, altimetria e record del percorso
// in un colpo solo, con la condivisione (share card 2.0) a portata di pollice.
// Tema dell'app (non il vestito scuro fisso del Wrapped): la mappa segue già
// il tema, e questa schermata vive dentro il flusso, non fuori.
export default function WorkoutRecapOverlay({ data, onClose, updateActivity }: Props) {
  const { activity, points, records } = data
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  // Consenso al percorso nel feed (v45): ottimistico con rollback. Il toggle
  // esiste solo se la colonna c'è (attività tornata dal server con
  // route_visible), il percorso è arrivato sul DB e non siamo in coda offline.
  const [routeShared, setRouteShared] = useState(activity.route_visible ?? false)
  const [routeShareError, setRouteShareError] = useState(false)
  const canShareRoute =
    !!updateActivity && !data.pending && data.routeSaved && activity.route_visible !== undefined
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  const handleToggleRouteShare = async () => {
    const next = !routeShared
    setRouteShared(next)
    setRouteShareError(false)
    haptic('light')
    const { error } = await updateActivity!(activity.id, { route_visible: next })
    if (error) {
      setRouteShared(!next)
      setRouteShareError(true)
    }
  }

  // Blocco scroll del body come ogni overlay con scroller interno (iOS).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Un record merita l'aptica della festa, il resto il tick di conferma è già
  // arrivato dal salvataggio.
  useEffect(() => {
    if (records.length > 0) haptic('celebrate')
  }, [records])

  const splits = useMemo(() => computeSplits(points), [points])

  const isBike = activity.type === 'bici'
  const distanceKm = activity.distance_km ?? 0
  const paceMinPerKm = distanceKm > 0 ? activity.duration_min / distanceKm : null
  const avgSpeedKmh = activity.duration_min > 0 ? distanceKm / (activity.duration_min / 60) : 0

  async function handleShare() {
    setSharing(true)
    setShareError(false)
    const outcome = await shareCardImage(
      buildActivityShareData(activity, { route: points, splits }),
      `pisozone-${activity.type}.png`,
    )
    setSharing(false)
    if (outcome === 'failed') {
      setShareError(true)
      haptic('error')
    } else if (outcome !== 'cancelled') {
      haptic('success')
    }
  }

  const recordText = (kind: string, value: number): string => {
    const km = distanceKm.toLocaleString('it-IT', { maximumFractionDigits: 2 })
    if (kind === 'firstOfSport') return recapText.records.firstOfSport(km)
    if (kind === 'longestDistance') return recapText.records.longestDistance(km)
    return isBike
      ? recapText.records.fastestSpeed((60 / value).toLocaleString('it-IT', { maximumFractionDigits: 1 }))
      : recapText.records.fastestPace(formatPaceClock(value))
  }

  const stats: { value: string; label: string }[] = [
    { value: formatMinutesCompact(activity.duration_min), label: recapText.stats.duration },
    { value: `${distanceKm.toLocaleString('it-IT', { maximumFractionDigits: 2 })} km`, label: recapText.stats.distance },
    isBike
      ? { value: `${avgSpeedKmh.toLocaleString('it-IT', { maximumFractionDigits: 1 })} km/h`, label: recapText.stats.avgSpeed }
      : { value: paceMinPerKm ? `${formatPaceClock(paceMinPerKm)}/km` : '--', label: recapText.stats.avgPace },
  ]
  if (activity.calories != null && activity.calories > 0) {
    stats.push({ value: `${activity.calories.toLocaleString('it-IT')} kcal`, label: recapText.stats.calories })
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={recapText.ariaLabel}
      className="overlay-fade fixed inset-0 z-[120] flex flex-col"
      style={{ background: 'var(--black)' }}
    >
      {/* Bagliore celebrativo dell'accento, l'eco di .hero-glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb),0.2), transparent 55%)' }}
      />

      <div
        className="relative flex justify-end px-3 pb-1"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
      >
        <button type="button" onClick={onClose} aria-label={recapText.close} className="p-2 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 space-y-4 max-w-lg mx-auto w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="celebration-pop text-center pt-2">
          <p className="text-xs tracking-[0.3em] font-semibold uppercase text-gray-400">{recapText.kicker}</p>
          <h2 className="font-bebas text-5xl text-white tracking-wider mt-2 leading-none">
            {activityLabel(activity.type, activity.indoor).toUpperCase()}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {format(parseISO(activity.date), "EEEE d MMMM · HH:mm", { locale: it })}
          </p>
          {activity.credits_earned > 0 && (
            <p className="text-sm font-medium text-[var(--red)] mt-3">{recapText.credits(activity.credits_earned)}</p>
          )}
        </div>

        <div className={`grid gap-3 text-center ${stats.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {stats.map((s) => (
            <div key={s.label} className="card py-3">
              <p className="text-2xl font-semibold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {records.length > 0 && (
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.kind}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
              >
                <Trophy size={18} className="text-amber-300 flex-shrink-0" />
                <p className="text-sm text-amber-200 font-medium">{recordText(r.kind, r.value)}</p>
              </div>
            ))}
          </div>
        )}

        {data.pending ? (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs text-gray-400" style={{ background: 'var(--grey)' }}>
            <CloudOff size={14} className="shrink-0 mt-0.5" />
            {recapText.offlineNote}
          </div>
        ) : !data.routeSaved ? (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs text-[var(--red)]" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {recapText.routeWarning}
          </div>
        ) : null}

        {points.length >= 2 && (
          <div className="card space-y-2">
            {MAPTILER_KEY && navigator.onLine ? (
              <Suspense fallback={<div className="skeleton rounded-xl" style={{ height: 192 }} />}>
                <RouteMap points={points} />
              </Suspense>
            ) : (
              <RouteShape points={points} width={280} height={140} />
            )}
            <RouteInsights points={points} />
            {canShareRoute && (
              <div className="pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300">{recapText.routeShare.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{recapText.routeShare.hint}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={routeShared ? 'true' : 'false'}
                    aria-label={recapText.routeShare.label}
                    onClick={handleToggleRouteShare}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      routeShared ? 'bg-[var(--red)]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        routeShared ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                {routeShareError && (
                  <p className="text-xs text-[var(--red)] mt-1">{recapText.routeShare.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Share2 size={16} />
            {sharing ? recapText.sharing : recapText.share}
          </button>
          {shareError && <p className="text-xs text-[var(--red)] text-center">{recapText.shareError}</p>}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {recapText.close}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
