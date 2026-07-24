import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { it as itLocale } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActivities } from '../hooks/useActivities'
import { haptic } from '../lib/haptics'
import { parseGpx, MIN_GPX_POINTS } from '../lib/gpxImport'
import { computeRouteStats, computeElevationProfile } from '../lib/gps'
import { saveActivityRoute } from '../lib/activityRoutes'
import { matchAndRecordSegments } from '../lib/routeSegments'
import { isPendingActivityId } from '../lib/offlineQueue'
import { calcCaloriesFromSpeed, GPS_TRACKABLE_TYPES, ACTIVITY_OPTIONS, type GpsTrackableType } from '../lib/constants'
import ActivityIcon from './ActivityIcon'
import log from '../lib/i18n/log'
import type { Activity } from '../types'

interface Props {
  onClose: () => void
  onImported: (activity: Activity) => void
}

// Import GPX (roadmap v4, pilastro 04): stesso flusso di salvataggio di
// WorkoutTrackingOverlay (addActivity + saveActivityRoute + matching
// segmenti best effort), ma la sorgente dei punti è un file invece del GPS
// live — il tipo di sport, che il GPX non registra, lo sceglie l'utente qui.
export default function GpxImportModal({ onClose, onImported }: Props) {
  const { user } = useAuth()
  const { profile, refetch: refetchProfile } = useProfile()
  const { addActivity } = useActivities()
  const [parsed, setParsed] = useState<ReturnType<typeof parseGpx> | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [activityType, setActivityType] = useState<GpsTrackableType>('corsa')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const preview = useMemo(() => {
    if (!parsed || parsed.points.length < MIN_GPX_POINTS) return null
    const first = parsed.points[0]
    const last = parsed.points[parsed.points.length - 1]
    const elapsedMs = last.t - first.t
    const stats = computeRouteStats(parsed.points, elapsedMs)
    const elevation = computeElevationProfile(parsed.points)
    return { startedAt: first.t, elapsedMs, stats, gainM: elevation?.gainM ?? null }
  }, [parsed])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setErrorMsg('')
    const text = await file.text()
    const result = parseGpx(text)
    if (result.points.length < MIN_GPX_POINTS) {
      setParsed(null)
      setParseError(log.gpxImport.parseFailed)
      return
    }
    setParsed(result)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!preview || !user) return
    setSaving(true)
    setErrorMsg('')
    const durationMin = Math.round(preview.elapsedMs / 60000)
    const calories = profile?.weight_kg
      ? calcCaloriesFromSpeed(activityType, durationMin, preview.stats.avgSpeedKmh, profile.weight_kg, profile.gender)
      : null
    const { data, error } = await addActivity({
      type: activityType,
      date: new Date(preview.startedAt).toISOString(),
      duration_min: durationMin,
      calories,
      distance_km: Number(preview.stats.distanceKm.toFixed(2)),
      notes: null,
      gps_tracked: true,
      ...(preview.gainM != null ? { elevation_gain_m: Math.round(preview.gainM) } : {}),
    })
    if (error || !data) {
      setSaving(false)
      setErrorMsg(log.gpxImport.failed)
      return
    }
    const pending = isPendingActivityId(data.id)
    const points = parsed!.points
    if (!pending) {
      await saveActivityRoute(data.user_id, data.id, points)
      matchAndRecordSegments(data.user_id, data.id, activityType, points).catch(() => {})
      // Il saldo crediti (P0-2 dell'audit tecnico del 24/07/2026): un import
      // in coda offline non ha ancora guadagnato crediti reali.
      refetchProfile()
    }
    setSaving(false)
    haptic('success')
    onImported(data)
  }

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={log.gpxImport.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{log.gpxImport.title}</h2>
          <button type="button" onClick={onClose} aria-label={log.gpxImport.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 -mt-2">{log.gpxImport.hint}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            className="block w-full text-center py-2.5 rounded-xl border border-dashed text-sm text-gray-300 cursor-pointer transition-colors hover:text-white"
            style={{ borderColor: 'var(--grey-light)' }}
          >
            {fileName || log.gpxImport.pickFile}
            <input type="file" accept=".gpx,application/gpx+xml" onChange={handleFile} className="sr-only" />
          </label>

          {parseError && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {parseError}
            </p>
          )}

          {preview && (
            <>
              <div>
                <p className="text-xs text-gray-400 mb-2">{log.gpxImport.typeLabel}</p>
                <div className="grid grid-cols-4 gap-2">
                  {GPS_TRACKABLE_TYPES.map((t) => {
                    const isSelected = activityType === t
                    const opt = ACTIVITY_OPTIONS.find((o) => o.value === t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivityType(t)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                          isSelected ? 'border-[var(--red)]' : 'border-transparent'
                        }`}
                        style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.1)' : 'var(--grey)' }}
                      >
                        <ActivityIcon type={t} className={`transition-all duration-200 ${isSelected ? 'grayscale-0' : 'grayscale opacity-50'}`} />
                        <span className="text-[10px] text-gray-300">{opt?.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl p-3 grid grid-cols-2 gap-2 text-center" style={{ background: 'var(--grey)' }}>
                <div>
                  <p className="text-[10px] text-gray-400">{log.gpxImport.previewDate}</p>
                  <p className="font-bebas text-lg text-white">{format(new Date(preview.startedAt), 'd MMM yyyy, HH:mm', { locale: itLocale })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{log.gpxImport.previewDuration}</p>
                  <p className="font-bebas text-lg text-white">
                    {Math.floor(preview.elapsedMs / 3600000)}h {String(Math.round((preview.elapsedMs % 3600000) / 60000)).padStart(2, '0')}min
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{log.gpxImport.previewDistance}</p>
                  <p className="font-bebas text-lg text-white">{preview.stats.distanceKm.toFixed(2)} km</p>
                </div>
                {preview.gainM != null && (
                  <div>
                    <p className="text-[10px] text-gray-400">{log.gpxImport.previewElevation}</p>
                    <p className="font-bebas text-lg text-white">D+ {Math.round(preview.gainM)} m</p>
                  </div>
                )}
              </div>
            </>
          )}

          {errorMsg && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={saving || !preview} className="btn-primary w-full disabled:opacity-60">
            {saving ? log.gpxImport.importing : log.gpxImport.submit}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
