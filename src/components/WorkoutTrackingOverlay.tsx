import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, AlertTriangle, Pause, Play, Square } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useGpsTracking, type GpsTrackingSummary } from '../hooks/useGpsTracking'
import { calcCaloriesFromSpeed, type GpsTrackableType } from '../lib/constants'
import { computeElevationProfile, computeRecentSpeedKmh, computeSplits, formatPaceClock, type TrackedPoint } from '../lib/gps'
import { zoneForSpeed, getZoneById } from '../lib/zones'
import { buildIntervalSteps, nextStepIndex, type IntervalPlan } from '../lib/intervalWorkout'
import { saveActivityRoute } from '../lib/activityRoutes'
import { matchAndRecordSegments } from '../lib/routeSegments'
import { isPendingActivityId } from '../lib/offlineQueue'
import { haptic } from '../lib/haptics'
import { speak } from '../lib/voiceCues'
import RouteShape from './RouteShape'
import common from '../lib/i18n/common'
import log from '../lib/i18n/log'
import type { Activity } from '../types'

interface Props {
  activityType: GpsTrackableType
  // Allenamento a intervalli (roadmap v4, pilastro 01): facoltativo, seguito
  // passo-passo durante il tracciamento — vedi lib/intervalWorkout.ts.
  intervalPlan?: IntervalPlan
  addActivity: (
    activity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>
  ) => Promise<{ data: Activity | null; error: Error | null }>
  onClose: () => void
  // Il chiamante riceve tutto ciò che serve al recap del dopo-allenamento:
  // l'attività salvata, i punti locali del percorso (validi anche se il
  // percorso non è arrivato sul server) e l'esito di coda/salvataggio.
  onSaved: (result: {
    activity: Activity
    points: TrackedPoint[]
    pending: boolean
    routeSaved: boolean
  }) => void
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
export default function WorkoutTrackingOverlay({ activityType, intervalPlan, addActivity, onClose, onSaved }: Props) {
  const { profile, refetch: refetchProfile } = useProfile()
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

  // Split live (roadmap v3, pilastro 02): riuso diretto di computeSplits sui
  // punti già in memoria. Si mostrano solo i km COMPLETI — il tratto in corso
  // uscirebbe come "partial" e un passo su mezzo km direbbe poco.
  const liveSplits = useMemo(() => computeSplits(points).filter((s) => !s.partial), [points])
  const prevSplitCountRef = useRef(0)
  const splitCount = liveSplits.length
  useEffect(() => {
    if (splitCount > prevSplitCountRef.current) {
      haptic('light')
      const last = liveSplits[splitCount - 1]
      if (last) {
        speak(activityType === 'bici'
          ? log.tracking.voiceSplitSpeed(last.index, (60 / last.paceMinPerKm).toLocaleString('it-IT', { maximumFractionDigits: 1 }))
          : log.tracking.voiceSplitPace(last.index, formatPaceClock(last.paceMinPerKm)))
      }
    }
    prevSplitCountRef.current = splitCount
  }, [splitCount, activityType])

  // Allenamento a intervalli (roadmap v4, pilastro 01): la sequenza di step
  // è fissa per tutta la sessione (calcolata una sola volta dal piano), lo
  // stato che cambia è solo l'indice corrente e il punto (distanza/tempo)
  // da cui è iniziato lo step in corso — elapsedMs/stats.distanceKm sono già
  // "pause-aware" (vedi useGpsTracking), quindi la sottrazione resta corretta
  // anche se l'utente mette in pausa a metà step.
  const intervalSteps = useMemo(() => (intervalPlan ? buildIntervalSteps(intervalPlan) : []), [intervalPlan])
  const [stepIndex, setStepIndex] = useState(0)
  const [stepStart, setStepStart] = useState({ distanceKm: 0, elapsedMs: 0 })
  const currentStep = intervalSteps[stepIndex] ?? null
  const offTargetHapticRef = useRef(0)

  useEffect(() => {
    if (!currentStep || status !== 'tracking') return
    const distanceSinceStepStartM = (stats.distanceKm - stepStart.distanceKm) * 1000
    const secondsSinceStepStart = (elapsedMs - stepStart.elapsedMs) / 1000
    const next = nextStepIndex(intervalSteps, stepIndex, distanceSinceStepStartM, secondsSinceStepStart)
    if (next !== stepIndex) {
      haptic('success')
      const nextStep = intervalSteps[next]
      if (nextStep && intervalPlan) {
        speak(nextStep.kind === 'work'
          ? log.intervals.voiceStepWork(nextStep.repNumber, intervalPlan.repeats)
          : log.intervals.voiceStepRecovery(nextStep.repNumber, intervalPlan.repeats))
      }
      setStepStart({ distanceKm: stats.distanceKm, elapsedMs })
      setStepIndex(next)
    }
  }, [stats.distanceKm, elapsedMs, status, intervalSteps, stepIndex, currentStep, stepStart, intervalPlan])

  const offTarget = currentStep != null && status === 'tracking' && points.length >= 2 && liveZone.id !== currentStep.zoneId
  useEffect(() => {
    if (!offTarget) return
    const now = Date.now()
    if (now - offTargetHapticRef.current > 5000) {
      haptic('error')
      offTargetHapticRef.current = now
    }
  }, [offTarget, liveZone.id])

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
    // D+ persistito sull'attività (v44, medaglie della montagna): stessa
    // logica dell'altimetria mostrata nel recap. La chiave viaggia solo se
    // c'è un profilo valido — niente colonna per quota assente o troppo sparsa.
    const gainM = computeElevationProfile(s.points)?.gainM
    const { data, error: addError } = await addActivity({
      type: activityType,
      date: new Date(s.startedAt).toISOString(),
      duration_min: s.durationMin,
      calories,
      distance_km: Number(s.distanceKm.toFixed(2)),
      notes: null,
      gps_tracked: true,
      ...(gainM != null ? { elevation_gain_m: Math.round(gainM) } : {}),
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
    // Segmenti personali (v47, roadmap v4 pilastro 02): best effort come il
    // percorso stesso, e nello stesso limite — nessun id reale finché
    // l'attività è in coda offline, quindi si salta del tutto (il recupero
    // alla sincronizzazione non è coperto, stessa scelta di altre v1).
    if (!pending) matchAndRecordSegments(data.user_id, data.id, activityType, s.points).catch(() => {})
    // Il saldo crediti (P0-2 dell'audit tecnico del 24/07/2026): un'attività
    // in coda offline non ha ancora guadagnato crediti reali, il refetch
    // sarebbe un no-op — si aggiorna solo dopo un insert vero.
    if (!pending) refetchProfile()
    setSaving(false)
    haptic('success')
    onSaved({ activity: data, points: s.points, pending, routeSaved: !routeError })
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

          {/* Allenamento a intervalli (roadmap v4, pilastro 01): step
              corrente con progresso e avviso se la zona live esce dal
              target — sempre in aggiunta al badge Zona Live sopra, mai al
              suo posto. */}
          {currentStep && status === 'tracking' && intervalPlan && (
            <div className="flex flex-col items-center gap-1 -mt-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={{
                  background: offTarget ? 'rgba(244,67,82,0.15)' : `color-mix(in srgb, ${getZoneById(currentStep.zoneId).cssVar} 16%, transparent)`,
                  color: offTarget ? 'var(--red)' : getZoneById(currentStep.zoneId).cssVar,
                  transition: 'background 0.5s ease, color 0.5s ease',
                }}
              >
                {currentStep.kind === 'work'
                  ? log.intervals.stepWork(currentStep.repNumber, intervalPlan.repeats)
                  : log.intervals.stepRecovery(currentStep.repNumber, intervalPlan.repeats)}
                {' · '}
                {currentStep.kind === 'work'
                  ? log.intervals.stepProgressWork(
                      Math.min(currentStep.target, Math.max(0, Math.round((stats.distanceKm - stepStart.distanceKm) * 1000))),
                      currentStep.target,
                    )
                  : log.intervals.stepProgressRecovery(
                      Math.max(0, Math.ceil(currentStep.target - (elapsedMs - stepStart.elapsedMs) / 1000)),
                    )}
              </span>
              {offTarget && <span className="text-[10px]" style={{ color: 'var(--red)' }}>{log.intervals.offTarget}</span>}
            </div>
          )}
          {intervalPlan && !currentStep && status === 'tracking' && (
            <p className="text-[11px] text-gray-500 -mt-2">{log.intervals.allDone}</p>
          )}

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

          {/* Split live: gli ultimi 3 km completati, il più recente in evidenza */}
          {liveSplits.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center" aria-label={log.tracking.splitsAria}>
              {liveSplits.slice(-3).map((s, i, shown) => {
                const isLatest = i === shown.length - 1
                return (
                  <span
                    key={s.index}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums ${isLatest ? '' : 'text-gray-400'}`}
                    style={isLatest
                      ? { background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--red)' }
                      : { background: 'var(--grey)' }}
                  >
                    {activityType === 'bici'
                      ? log.tracking.splitChipSpeed(s.index, (60 / s.paceMinPerKm).toLocaleString('it-IT', { maximumFractionDigits: 1 }))
                      : log.tracking.splitChipPace(s.index, formatPaceClock(s.paceMinPerKm))}
                  </span>
                )
              })}
            </div>
          )}
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
