import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, AlertTriangle, Pause, Play, Square } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useGpsTracking, type GpsTrackingSummary } from '../hooks/useGpsTracking'
import { calcCaloriesFromSpeed, type GpsTrackableType } from '../lib/constants'
import { computeRecentSpeedKmh, formatPaceClock } from '../lib/gps'
import { zoneForSpeed } from '../lib/zones'
import { saveActivityRoute } from '../lib/activityRoutes'
import { isPendingActivityId } from '../lib/offlineQueue'
import { haptic } from '../lib/haptics'
import RouteShape from './RouteShape'
import common from '../lib/i18n/common'
import log from '../lib/i18n/log'
import type { Activity } from '../types'

interface Props {
  activityType: GpsTrackableType
  addActivity: (
    activity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>
  ) => Promise<{ data: Activity | null; error: Error | null }>
  onClose: () => void
  onSaved: (creditsEarned: number) => void
  onSaveWarning: () => void
}

const RELOCK_MS = 6000
const UNLOCK_THRESHOLD = 90

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function formatPace(paceMinPerKm: number | null): string {
  if (paceMinPerKm == null || !Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return '--:--'
  return `${formatPaceClock(paceMinPerKm)} /km`
}

function formatSpeed(speedKmh: number): string {
  return `${speedKmh.toFixed(1)} km/h`
}

// Schermata di tracciamento "a schermo acceso" (roadmap punto 12): di default
// bloccata (solo lo slide-to-unlock in basso reagisce ai tocchi) così un
// telefono in tasca durante la corsa non chiude l'app o ferma il tracciamento
// per un tocco accidentale. Struttura full-screen come ActivityEditModal, ma
// senza useFocusTrap: il suo Esc-per-chiudere immediato contraddice il
// concetto di schermata bloccata, e non c'è nulla "dietro" da raggiungere.
export default function WorkoutTrackingOverlay({ activityType, addActivity, onClose, onSaved, onSaveWarning }: Props) {
  const { profile } = useProfile()
  const { status, error, weakSignal, elapsedMs, stats, points, start, pause, resume, finish, cancel } =
    useGpsTracking(activityType)

  const [unlocked, setUnlocked] = useState(false)
  const [sliderValue, setSliderValue] = useState(0)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [summary, setSummary] = useState<GpsTrackingSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const relockTimerRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  // Zone Live (roadmap v3, pilastro 01 punto 6): la zona di intensità della
  // velocità recente tinge la schermata — il linguaggio delle 4 zone applicato
  // al momento in cui lo sforzo accade, non solo alle statistiche a posteriori.
  const liveZone = useMemo(
    () => zoneForSpeed(activityType, computeRecentSpeedKmh(points)),
    [activityType, points],
  )

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    start()
  }, [start])

  // Stesso blocco scroll di ActivityEditModal/PhotoLightbox: su iOS, senza,
  // il gesto a metà corsa "aggancia" il body dietro.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => () => {
    if (relockTimerRef.current != null) window.clearTimeout(relockTimerRef.current)
  }, [])

  const scheduleRelock = () => {
    if (relockTimerRef.current != null) window.clearTimeout(relockTimerRef.current)
    relockTimerRef.current = window.setTimeout(() => {
      setUnlocked(false)
      setConfirmFinish(false)
    }, RELOCK_MS)
  }

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (v >= UNLOCK_THRESHOLD) {
      setSliderValue(0)
      setUnlocked(true)
      haptic('light')
      scheduleRelock()
    } else {
      setSliderValue(v)
    }
  }

  const handleSliderRelease = () => {
    if (!unlocked) setSliderValue(0)
  }

  const handleCancelAcquiring = () => {
    cancel()
    onClose()
  }

  const handlePauseResume = () => {
    if (status === 'paused') resume()
    else pause()
    haptic('light')
    scheduleRelock()
  }

  const handleDiscard = () => {
    cancel()
    onClose()
  }

  const attemptSave = async (s: GpsTrackingSummary) => {
    setSaving(true)
    setSaveError('')
    const calories = profile?.weight_kg
      ? calcCaloriesFromSpeed(activityType, s.durationMin, s.avgSpeedKmh, profile.weight_kg, profile.gender)
      : null
    const { data, error: addError } = await addActivity({
      type: activityType,
      date: new Date(s.startedAt).toISOString(),
      duration_min: s.durationMin,
      calories,
      distance_km: Number(s.distanceKm.toFixed(2)),
      notes: null,
      gps_tracked: true,
    })
    if (addError || !data) {
      setSaving(false)
      setSaveError(log.tracking.saveFailed)
      return
    }
    // In coda offline (roadmap v2, pilastro 05): niente id reale ancora, il
    // salvataggio del percorso fallirebbe comunque — non ha senso tentarlo.
    const pending = isPendingActivityId(data.id)
    const routeError = pending ? true : (await saveActivityRoute(data.user_id, data.id, s.points)).error
    setSaving(false)
    haptic('success')
    if (routeError) onSaveWarning()
    onSaved(data.credits_earned)
  }

  const handleFinishSave = () => {
    const finalSummary = finish()
    setSummary(finalSummary)
    attemptSave(finalSummary)
  }

  const safeTop = { paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }
  const safeBottom = { paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }

  let content: ReactElement
  if (status === 'acquiring') {
    content = (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ ...safeTop, ...safeBottom }}>
        <Loader2 size={40} className="animate-spin text-[var(--red)]" />
        <p className="text-white font-semibold">{log.tracking.acquiringTitle}</p>
        <p className="text-xs text-gray-500">{log.tracking.acquiringHint}</p>
        <button
          type="button"
          onClick={handleCancelAcquiring}
          className="mt-6 px-5 py-2 rounded-lg text-sm text-gray-400 border border-gray-600"
        >
          {common.cancel}
        </button>
      </div>
    )
  } else if (status === 'idle' && error) {
    content = (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ ...safeTop, ...safeBottom }}>
        <AlertTriangle size={40} className="text-[var(--red)]" />
        <p className="text-white font-semibold">{log.tracking.startErrorTitle}</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button type="button" onClick={onClose} className="btn-primary mt-4">{common.close}</button>
      </div>
    )
  } else if (summary) {
    content = (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ ...safeTop, ...safeBottom }}>
        {saving ? (
          <>
            <Loader2 size={40} className="animate-spin text-[var(--red)]" />
            <p className="text-white font-semibold">{log.tracking.savingTitle}</p>
          </>
        ) : saveError ? (
          <>
            <AlertTriangle size={40} className="text-[var(--red)]" />
            <p className="text-white font-semibold">{saveError}</p>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => attemptSave(summary)} className="btn-primary">{log.tracking.retry}</button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-gray-600"
              >
                {log.tracking.discard}
              </button>
            </div>
          </>
        ) : null}
      </div>
    )
  } else {
    // status === 'tracking' | 'paused'
    content = (
      <div className="flex-1 flex flex-col min-h-0" style={{ ...safeTop, ...safeBottom }}>
        {/* Bagliore Zone Live: solo durante il tracciamento attivo (in pausa i
            campioni si fermano e la zona resterebbe congelata su un dato vecchio).
            zIndex -1: sotto il contenuto ma sopra lo sfondo del portale (che è
            uno stacking context grazie a z-50). */}
        {status === 'tracking' && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: -1,
              background: `radial-gradient(circle at 50% 16%, color-mix(in srgb, ${liveZone.cssVar} 26%, transparent), transparent 62%)`,
              transition: 'background 0.8s ease',
            }}
          />
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 min-h-0">
          {points.length >= 2 && <RouteShape points={points} width={260} height={140} />}

          <div className="flex items-center gap-2 h-5">
            {status === 'paused' && (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--red)' }}
              >
                {log.tracking.pausedBadge}
              </span>
            )}
            {status === 'tracking' && points.length >= 2 && (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={{
                  background: `color-mix(in srgb, ${liveZone.cssVar} 16%, transparent)`,
                  color: liveZone.cssVar,
                  transition: 'background 0.5s ease, color 0.5s ease',
                }}
              >
                {log.tracking.zoneLive(liveZone.label)}
              </span>
            )}
            {weakSignal && status === 'tracking' && (
              <span className="text-xs text-yellow-500">{log.tracking.weakSignal}</span>
            )}
          </div>

          <div className="font-bebas text-7xl text-white tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatElapsed(elapsedMs)}
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-xs text-center">
            <div>
              <p className="text-2xl font-semibold text-white">{stats.distanceKm.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{log.tracking.kmUnit}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {activityType === 'bici' ? formatSpeed(stats.avgSpeedKmh) : formatPace(stats.paceMinPerKm)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                {activityType === 'bici' ? log.tracking.avgSpeedLabel : log.tracking.avgPaceLabel}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {profile?.weight_kg
                  ? calcCaloriesFromSpeed(activityType, elapsedMs / 60000, stats.avgSpeedKmh, profile.weight_kg, profile.gender)
                  : '--'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{log.tracking.kcalEstimateLabel}</p>
            </div>
          </div>
        </div>

        <div className="px-6">
          {!unlocked ? (
            <div className="slide-to-unlock-wrap">
              <span className="slide-to-unlock-label">{log.tracking.slideToUnlock}</span>
              <input
                type="range"
                className="slide-to-unlock"
                min={0}
                max={100}
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                aria-label={log.tracking.slideAriaLabel}
              />
            </div>
          ) : !confirmFinish ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePauseResume}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                {status === 'paused' ? log.tracking.resume : log.tracking.pause}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmFinish(true); scheduleRelock() }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm text-red-400 hover:bg-red-900/20 transition-all duration-200"
                style={{ border: '1px solid #7f1d1d' }}
              >
                <Square size={16} />
                {log.tracking.finish}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleFinishSave}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Square size={16} />
                {log.tracking.saveAndFinish}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 py-2 rounded-lg font-semibold text-sm text-gray-400 border border-gray-600"
              >
                {log.tracking.discard}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={log.tracking.dialogAriaLabel}
      className="fixed inset-0 z-50 flex flex-col page-enter"
      style={{ background: 'var(--black)' }}
    >
      {content}
    </div>,
    document.body,
  )
}
