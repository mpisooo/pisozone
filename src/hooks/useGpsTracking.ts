import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { computeRouteStats, isPlausibleSample, type TrackedPoint } from '../lib/gps'
import type { GpsTrackableType } from '../lib/constants'
import log from '../lib/i18n/log'

export type GpsTrackingStatus = 'idle' | 'acquiring' | 'tracking' | 'paused' | 'finished'

export interface GpsTrackingSummary {
  durationMin: number
  distanceKm: number
  avgSpeedKmh: number
  points: TrackedPoint[]
  startedAt: number
}

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

// Soglie di velocità implicita oltre le quali un campione GPS è uno scarto di
// segnale, non un vero spostamento (vedi isPlausibleSample in lib/gps.ts).
const MAX_SPEED_KMH: Record<GpsTrackableType, number> = {
  corsa: 40,
  camminata: 40,
  trekking: 40,
  bici: 80,
}

const MIN_SAMPLE_INTERVAL_MS = 5000
const ACQUIRE_TIMEOUT_MS = 20000

// Tracciamento GPS "a schermo acceso" (roadmap punto 12): il tempo trascorso
// si calcola sempre da timestamp reali (startedAt/pausedMs), mai da un
// contatore incrementale — così, se iOS sospende la pagina (schermo bloccato
// per sbaglio, Wake Lock revocato dal sistema), al rientro il tempo si
// ricalcola correttamente invece di sfasarsi o azzerarsi.
export function useGpsTracking(type: GpsTrackableType) {
  const [status, setStatus] = useState<GpsTrackingStatus>('idle')
  const [error, setError] = useState('')
  const [weakSignal, setWeakSignal] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [points, setPoints] = useState<TrackedPoint[]>([])

  const statusRef = useRef<GpsTrackingStatus>('idle')
  const watchIdRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null)
  const startedAtRef = useRef(0)
  const pausedAtRef = useRef<number | null>(null)
  const pausedMsRef = useRef(0)
  const lastAcceptedAtRef = useRef(0)
  const acquireTimeoutRef = useRef<number | null>(null)

  useEffect(() => { statusRef.current = status }, [status])

  const clearAcquireTimeout = useCallback(() => {
    if (acquireTimeoutRef.current != null) {
      window.clearTimeout(acquireTimeoutRef.current)
      acquireTimeoutRef.current = null
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    try { await wakeLockRef.current?.release() } catch { /* già rilasciato */ }
    wakeLockRef.current = null
  }, [])

  const requestWakeLock = useCallback(async () => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (kind: 'screen') => Promise<WakeLockSentinelLike> }
    }
    if (!nav.wakeLock) return
    try {
      wakeLockRef.current = await nav.wakeLock.request('screen')
    } catch {
      // negato o pagina non in primo piano: si continua senza, l'utente dovrà
      // solo stare attento a non spegnere lo schermo manualmente
    }
  }, [])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const recomputeElapsed = useCallback(() => {
    const now = Date.now()
    const pausedMs = pausedMsRef.current + (pausedAtRef.current ? now - pausedAtRef.current : 0)
    return Math.max(0, now - startedAtRef.current - pausedMs)
  }, [])

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    setWeakSignal(false)
    if (statusRef.current === 'acquiring') {
      clearAcquireTimeout()
      startedAtRef.current = Date.now()
      setStatus('tracking')
    }
    const next: TrackedPoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      t: pos.timestamp,
      accuracyM: pos.coords.accuracy,
    }
    if (next.t - lastAcceptedAtRef.current < MIN_SAMPLE_INTERVAL_MS) return
    setPoints((prev) => {
      const last = prev[prev.length - 1] ?? null
      if (!isPlausibleSample(last, next, MAX_SPEED_KMH[type])) return prev
      lastAcceptedAtRef.current = next.t
      return [...prev, next]
    })
  }, [type, clearAcquireTimeout])

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (statusRef.current === 'acquiring') {
      clearAcquireTimeout()
      setError(
        err.code === err.PERMISSION_DENIED
          ? log.tracking.hookErrors.permissionDenied
          : log.tracking.hookErrors.signalUnavailable,
      )
      stopWatch()
      releaseWakeLock()
      setStatus('idle')
      return
    }
    setWeakSignal(true)
  }, [clearAcquireTimeout, stopWatch, releaseWakeLock])

  const startWatch = useCallback(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
    })
  }, [handlePosition, handleError])

  const start = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError(log.tracking.hookErrors.notSupported)
      return
    }
    setError('')
    setWeakSignal(false)
    setPoints([])
    setElapsedMs(0)
    pausedMsRef.current = 0
    pausedAtRef.current = null
    lastAcceptedAtRef.current = 0
    setStatus('acquiring')
    await requestWakeLock()
    startWatch()
    acquireTimeoutRef.current = window.setTimeout(() => {
      if (statusRef.current !== 'acquiring') return
      setError(log.tracking.hookErrors.timeout)
      stopWatch()
      releaseWakeLock()
      setStatus('idle')
    }, ACQUIRE_TIMEOUT_MS)
  }, [requestWakeLock, startWatch, stopWatch, releaseWakeLock])

  const pause = useCallback(() => {
    if (statusRef.current !== 'tracking') return
    pausedAtRef.current = Date.now()
    stopWatch()
    setStatus('paused')
  }, [stopWatch])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    if (pausedAtRef.current != null) {
      pausedMsRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }
    startWatch()
    setStatus('tracking')
  }, [startWatch])

  const finish = useCallback((): GpsTrackingSummary => {
    stopWatch()
    releaseWakeLock()
    clearAcquireTimeout()
    setStatus('finished')
    const finalElapsed = recomputeElapsed()
    const finalStats = computeRouteStats(points, finalElapsed)
    return {
      durationMin: Math.max(1, Math.round(finalElapsed / 60000)),
      distanceKm: finalStats.distanceKm,
      avgSpeedKmh: finalStats.avgSpeedKmh,
      points,
      startedAt: startedAtRef.current,
    }
  }, [stopWatch, releaseWakeLock, clearAcquireTimeout, recomputeElapsed, points])

  const cancel = useCallback(() => {
    stopWatch()
    releaseWakeLock()
    clearAcquireTimeout()
    setStatus('idle')
    setPoints([])
  }, [stopWatch, releaseWakeLock, clearAcquireTimeout])

  // Aggiorna il tempo trascorso ogni secondo; le statistiche (distanza,
  // passo...) si ricalcolano da sole tramite il useMemo qui sotto, senza dover
  // dipendere da `points` (altrimenti ogni nuovo campione GPS reimposterebbe
  // l'intervallo e il timer sembrerebbe a scatti).
  useEffect(() => {
    if (status !== 'tracking' && status !== 'paused') return
    const id = window.setInterval(() => setElapsedMs(recomputeElapsed()), 1000)
    return () => window.clearInterval(id)
  }, [status, recomputeElapsed])

  // Se il sistema revoca il Wake Lock mentre si sta ancora tracciando (batteria
  // scarsa, breve sospensione), lo richiede di nuovo al ritorno in primo piano.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && statusRef.current === 'tracking' && !wakeLockRef.current) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [requestWakeLock])

  useEffect(() => () => {
    stopWatch()
    releaseWakeLock()
    clearAcquireTimeout()
  }, [])

  const stats = useMemo(() => computeRouteStats(points, elapsedMs), [points, elapsedMs])

  return { status, error, weakSignal, elapsedMs, stats, points, start, pause, resume, finish, cancel }
}
