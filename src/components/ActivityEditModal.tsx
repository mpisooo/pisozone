import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { format, parseISO, formatISO } from 'date-fns'
import { X, Trash2, Save, AlertTriangle } from 'lucide-react'
import { ACTIVITY_OPTIONS, calcCalories } from '../lib/constants'
import { uploadActivityPhoto, removeActivityPhoto } from '../lib/activityPhotos'
import { fetchActivityRoute } from '../lib/activityRoutes'
import { useProfile } from '../hooks/useProfile'
import { useFocusTrap } from '../hooks/useFocusTrap'
import ActivityIcon from './ActivityIcon'
import PhotoPickerField from './PhotoPickerField'
import PerceivedMetricsFields from './PerceivedMetricsFields'
import RouteShape from './RouteShape'
import common from '../lib/i18n/common'
import log from '../lib/i18n/log'
import type { Activity, ActivityType, RoutePoint } from '../types'

type FormValues = {
  type: ActivityType
  date: string
  time: string
  hours: number
  minutes: number
  calories: number | ''
  distance_km: number | ''
  notes: string
}

interface Props {
  activity: Activity
  onClose: () => void
  updateActivity: (id: string, updates: Partial<Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>>) => Promise<{ data: Activity | null; error: Error | null }>
  deleteActivity: (id: string) => Promise<{ error: Error | null }>
}

export default function ActivityEditModal({ activity, onClose, updateActivity, deleteActivity }: Props) {
  const { profile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  // Foto: nuovo file selezionato e/o rimozione di quella esistente.
  // La X toglie sempre la foto mostrata: per ripristinare basta chiudere senza salvare.
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([])
  const [rpe, setRpe] = useState<number | null>(activity.rpe ?? null)
  const [mood, setMood] = useState<number | null>(activity.mood ?? null)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  // Sola lettura: il percorso si registra solo dal tracciamento GPS in Log.tsx,
  // qui si mostra soltanto la sagoma se l'attività ne ha uno.
  useEffect(() => {
    if (!activity.gps_tracked) return
    let cancelled = false
    fetchActivityRoute(activity.id).then(({ points }) => {
      if (!cancelled) setRoutePoints(points)
    })
    return () => { cancelled = true }
  }, [activity.id, activity.gps_tracked])

  const newPhotoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  )
  useEffect(() => () => { if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview) }, [newPhotoPreview])
  const photoPreview = newPhotoPreview ?? (photoRemoved ? null : activity.photo_url ?? null)

  // Blocca lo scroll della pagina sottostante finché la schermata è aperta:
  // su iOS, senza questo, il gesto a metà corsa "aggancia" il body dietro e lo
  // scorrimento del form si ferma finché non si riappoggia il dito.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const parsed = parseISO(activity.date)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: activity.type,
      date: format(parsed, 'yyyy-MM-dd'),
      time: format(parsed, 'HH:mm'),
      hours: Math.floor(activity.duration_min / 60),
      minutes: activity.duration_min % 60,
      calories: activity.calories ?? '',
      distance_km: activity.distance_km ?? '',
      notes: activity.notes ?? '',
    },
  })

  const selectedType = watch('type')
  const showDist = ACTIVITY_OPTIONS.find((a) => a.value === selectedType)?.hasDist ?? false

  const onSubmit = async (v: FormValues) => {
    setSaving(true)
    setErrorMsg('')
    const dur = Number(v.hours) * 60 + Number(v.minutes)
    const cal =
      v.calories !== '' ? Number(v.calories) :
      profile?.weight_kg && dur > 0 ? calcCalories(v.type, dur, profile.weight_kg) : null

    // Upload prima dell'update (serve l'URL); se fallisce si interrompe qui e
    // nessuna modifica viene applicata a metà. La rimozione del file, invece,
    // avviene DOPO l'update riuscito: al peggio resta un orfano nello Storage,
    // mai un photo_url che punta a un file cancellato.
    const photoUpdates: { photo_url?: string | null } = {}
    const wantsRemoval = !photoFile && photoRemoved && !!activity.photo_url
    if (photoFile) {
      const { url, error: photoError } = await uploadActivityPhoto(activity.user_id, activity.id, photoFile)
      if (photoError || !url) {
        setSaving(false)
        setErrorMsg(log.edit.photoUploadFailed)
        return
      }
      photoUpdates.photo_url = url
    } else if (wantsRemoval) {
      photoUpdates.photo_url = null
    }

    const { error } = await updateActivity(activity.id, {
      type: v.type,
      date: formatISO(new Date(`${v.date}T${v.time}:00`)),
      duration_min: dur,
      calories: cal,
      distance_km: v.distance_km !== '' ? Number(v.distance_km) : null,
      notes: v.notes || null,
      rpe,
      mood,
      ...photoUpdates,
    })
    setSaving(false)
    if (error) {
      setErrorMsg(log.edit.updateFailed)
      return
    }
    if (wantsRemoval) removeActivityPhoto(activity.user_id, activity.id)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setErrorMsg('')
    const { error } = await deleteActivity(activity.id)
    if (error) {
      setErrorMsg(log.edit.deleteFailed)
      setConfirmDelete(false)
      return
    }
    onClose()
  }

  // Schermata fissa a tutto schermo (come Registra), non più bottom sheet:
  // l'header con la X resta sempre visibile mentre il contenuto scorre, e lo
  // sfondo opaco copre il calendario sottostante.
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={log.edit.ariaLabel}
      className="fixed inset-0 z-50 flex flex-col page-enter"
      style={{ background: 'var(--black)' }}
    >
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-[var(--grey)]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <span className="font-bebas text-2xl text-white tracking-wider">{log.editActivityTitle}</span>
        <button type="button" onClick={onClose} aria-label={common.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
          <X size={22} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Activity type grid */}
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{log.form.activityTypeTitle}</h2>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.value
              return (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer border transition-all duration-150 ${
                    isSelected ? 'border-[var(--red)]' : 'border-transparent'
                  }`}
                  style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                >
                  <input type="radio" value={opt.value} {...register('type')} className="sr-only" />
                  <ActivityIcon type={opt.value} className={isSelected ? 'text-[var(--red)]' : 'text-gray-400'} />
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.dateTimeTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor="edit-date" className="block text-xs text-gray-400 mb-1">{log.form.dateLabel}</label>
              <input id="edit-date" type="date" {...register('date')} className="input-dark w-full" />
            </div>
            <div className="min-w-0">
              <label htmlFor="edit-time" className="block text-xs text-gray-400 mb-1">{log.form.timeLabel}</label>
              <input id="edit-time" type="time" {...register('time')} className="input-dark w-full" />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.durationTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-hours" className="block text-xs text-gray-400 mb-1">{log.form.hoursLabel}</label>
              <input
                id="edit-hours"
                type="number"
                {...register('hours', {
                  min: { value: 0, message: log.form.validation.hoursNotNegative },
                  max: { value: 12, message: log.form.validation.hoursMax },
                })}
                className="input-dark"
                min={0}
                max={12}
              />
            </div>
            <div>
              <label htmlFor="edit-minutes" className="block text-xs text-gray-400 mb-1">{log.form.minutesLabel}</label>
              <input
                id="edit-minutes"
                type="number"
                {...register('minutes', {
                  min: { value: 0, message: log.form.validation.minutesNotNegative },
                  max: { value: 59, message: log.form.validation.minutesMax },
                  validate: (v) => (Number(watch('hours')) * 60 + Number(v)) > 0 || log.form.validation.minutesDurationZero,
                })}
                className="input-dark"
                min={0}
                max={59}
              />
            </div>
          </div>
          {(errors.hours || errors.minutes) && (
            <p className="text-xs text-red-400">{errors.hours?.message || errors.minutes?.message}</p>
          )}
        </div>

        {activity.gps_tracked && routePoints.length >= 2 && (
          <div className="card space-y-2">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.routeTitle}</h2>
            <RouteShape points={routePoints} width={280} height={140} />
          </div>
        )}

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.detailsTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-calories" className="block text-xs text-gray-400 mb-1">{log.edit.caloriesLabel}</label>
              <input
                id="edit-calories"
                type="number"
                {...register('calories', {
                  min: { value: 0, message: log.form.validation.caloriesNotNegative },
                  max: { value: 20000, message: log.form.validation.unrealisticValue },
                })}
                className="input-dark"
                placeholder={log.edit.caloriesPlaceholder}
                min={0}
              />
              {errors.calories && <p className="text-xs text-red-400 mt-1">{errors.calories.message}</p>}
            </div>
            {showDist && (
              <div>
                <label htmlFor="edit-distance" className="block text-xs text-gray-400 mb-1">{log.form.distanceLabel}</label>
                <input
                  id="edit-distance"
                  type="number"
                  step="0.01"
                  {...register('distance_km', {
                    min: { value: 0, message: log.form.validation.distanceNotNegative },
                    max: { value: 1000, message: log.form.validation.unrealisticValue },
                  })}
                  className="input-dark"
                  min={0}
                />
                {errors.distance_km && <p className="text-xs text-red-400 mt-1">{errors.distance_km.message}</p>}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-xs text-gray-400 mb-1">{log.edit.notesLabel}</label>
            <textarea id="edit-notes" {...register('notes')} className="input-dark resize-none" rows={2} />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">{log.edit.photoLabel}</p>
            <PhotoPickerField
              previewUrl={photoPreview}
              onSelect={(f) => { setPhotoFile(f); setPhotoRemoved(false) }}
              onClear={() => { setPhotoFile(null); setPhotoRemoved(true) }}
              inputId="edit-photo"
            />
          </div>
        </div>

        <PerceivedMetricsFields rpe={rpe} mood={mood} onRpeChange={setRpe} onMoodChange={setMood} />

        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--red)]" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
            <AlertTriangle size={14} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3 pb-2">
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? log.new.saving : log.edit.saveChanges}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              confirmDelete
                ? 'text-white'
                : 'text-red-400 hover:bg-red-900/20'
            }`}
            style={confirmDelete ? { background: 'var(--red)' } : { border: '1px solid #7f1d1d' }}
          >
            <Trash2 size={16} />
            {confirmDelete ? common.confirmQuestion : common.delete}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
