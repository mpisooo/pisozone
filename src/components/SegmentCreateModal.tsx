import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { haptic } from '../lib/haptics'
import { createSegment, insertSegmentAttempt } from '../lib/routeSegments'
import { cumulativeDistances, segmentRangeFromDistances, formatSegmentTime, MIN_SEGMENT_DISTANCE_M } from '../lib/segments'
import type { TrackedPoint } from '../lib/gps'
import type { GpsTrackableType } from '../lib/constants'
import segmentsText from '../lib/i18n/segments'

interface Props {
  points: TrackedPoint[]
  activityType: GpsTrackableType
  activityId: string
  userId: string
  onClose: () => void
  onCreated: () => void
}

// Creazione di un segmento personale (v47, roadmap v4 pilastro 02): due
// cursori scelgono un intervallo lungo il percorso già registrato (in
// distanza cumulata, non in indice di campione — vedi lib/segments.ts).
// Il primo tentativo è l'attività di origine stessa: il tempo di
// attraversamento è già noto, non serve aspettare la prossima corsa.
export default function SegmentCreateModal({ points, activityType, activityId, userId, onClose, onCreated }: Props) {
  const cumDist = useMemo(() => cumulativeDistances(points), [points])
  const totalM = cumDist[cumDist.length - 1] ?? 0
  const [startM, setStartM] = useState(0)
  const [endM, setEndM] = useState(totalM)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const range = useMemo(
    () => segmentRangeFromDistances(points, cumDist, startM, endM),
    [points, cumDist, startM, endM],
  )

  const formatDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!range || !name.trim()) return
    setSaving(true)
    const { segment, error } = await createSegment({
      user_id: userId,
      name: name.trim(),
      activity_type: activityType,
      start_lat: range.startLat,
      start_lng: range.startLng,
      end_lat: range.endLat,
      end_lng: range.endLng,
      distance_m: Math.round(range.distanceM),
    })
    if (error || !segment) {
      setSaving(false)
      setErrorMsg(segmentsText.create.failed)
      return
    }
    // Best effort come il resto: il segmento esiste comunque anche se questo
    // primo tentativo non si registra.
    await insertSegmentAttempt({
      segment_id: segment.id, user_id: userId, activity_id: activityId, time_seconds: range.timeSeconds,
    })
    setSaving(false)
    haptic('success')
    onCreated()
  }

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={segmentsText.create.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{segmentsText.create.title}</h2>
          <button type="button" onClick={onClose} aria-label={segmentsText.create.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 -mt-2">{segmentsText.create.hint}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--grey)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  marginLeft: `${totalM > 0 ? (startM / totalM) * 100 : 0}%`,
                  width: `${totalM > 0 ? ((endM - startM) / totalM) * 100 : 0}%`,
                  background: 'var(--red)',
                }}
              />
            </div>

            <label htmlFor="segment-start" className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{segmentsText.create.startLabel}</span>
              <span className="text-white font-medium">{formatDist(startM)}</span>
            </label>
            <input
              id="segment-start"
              type="range"
              min={0}
              max={totalM}
              step={10}
              value={startM}
              onChange={(e) => setStartM(Math.min(Number(e.target.value), endM - MIN_SEGMENT_DISTANCE_M))}
              className="w-full"
            />

            <label htmlFor="segment-end" className="flex justify-between text-xs text-gray-400 mb-1 mt-3">
              <span>{segmentsText.create.endLabel}</span>
              <span className="text-white font-medium">{formatDist(endM)}</span>
            </label>
            <input
              id="segment-end"
              type="range"
              min={0}
              max={totalM}
              step={10}
              value={endM}
              onChange={(e) => setEndM(Math.max(Number(e.target.value), startM + MIN_SEGMENT_DISTANCE_M))}
              className="w-full"
            />
          </div>

          <div className="rounded-xl p-3 grid grid-cols-2 gap-2 text-center" style={{ background: 'var(--grey)' }}>
            <div>
              <p className="text-[10px] text-gray-400">{segmentsText.create.distanceLabel}</p>
              <p className="font-bebas text-xl text-white">{range ? formatDist(range.distanceM) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">{segmentsText.create.timeLabel}</p>
              <p className="font-bebas text-xl text-white">{range ? formatSegmentTime(range.timeSeconds) : '—'}</p>
            </div>
          </div>
          {!range && <p className="text-xs text-gray-600">{segmentsText.create.tooShortHint}</p>}

          <div>
            <label htmlFor="segment-name" className="block text-xs text-gray-400 mb-1">{segmentsText.create.nameLabel}</label>
            <input
              id="segment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={segmentsText.create.namePlaceholder}
              maxLength={60}
              className="input-dark"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={saving || !range || !name.trim()} className="btn-primary w-full disabled:opacity-60">
            {saving ? segmentsText.create.saving : segmentsText.create.submit}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
