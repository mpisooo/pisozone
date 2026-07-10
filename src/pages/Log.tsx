import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { format, formatISO } from 'date-fns'
import { Info, ChevronDown, ChevronUp, Zap, CheckCircle2, AlertTriangle, Satellite } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { ACTIVITY_OPTIONS, calcCalories, GPS_TRACKABLE_TYPES, type GpsTrackableType } from '../lib/constants'
import { uploadActivityPhoto } from '../lib/activityPhotos'
import { haptic } from '../lib/haptics'
import PhotoPickerField from '../components/PhotoPickerField'
import ActivityIcon from '../components/ActivityIcon'
import WorkoutTrackingOverlay from '../components/WorkoutTrackingOverlay'
import log from '../lib/i18n/log'
import type { ActivityType } from '../types'

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

export default function LogPage() {
  const { addActivity, updateActivity } = useActivities()
  const { profile } = useProfile()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [photoWarning, setPhotoWarning] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showCalInfo, setShowCalInfo] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [tracking, setTracking] = useState(false)
  const [routeWarning, setRouteWarning] = useState(false)

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  )
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: 'corsa',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      hours: 0,
      minutes: 30,
      calories: '',
      distance_km: '',
      notes: '',
    },
  })

  const selectedType = watch('type')
  const hours = Number(watch('hours')) || 0
  const minutes = Number(watch('minutes')) || 0
  const caloriesInput = watch('calories')

  const selectedActivity = ACTIVITY_OPTIONS.find((a) => a.value === selectedType)
  const showDist = selectedActivity?.hasDist ?? false
  const durationMin = hours * 60 + minutes

  const autoCalories =
    caloriesInput === '' && durationMin > 0 && profile?.weight_kg
      ? calcCalories(selectedType, durationMin, profile.weight_kg, profile.gender)
      : null

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    const dur = Number(values.hours) * 60 + Number(values.minutes)
    const cal =
      values.calories !== '' && Number(values.calories) > 0
        ? Number(values.calories)
        : profile?.weight_kg && dur > 0
        ? calcCalories(values.type, dur, profile.weight_kg, profile.gender)
        : null

    const dateTime = formatISO(new Date(`${values.date}T${values.time}:00`))

    const { data, error } = await addActivity({
      type: values.type,
      date: dateTime,
      duration_min: dur,
      calories: cal,
      distance_km: values.distance_km !== '' ? Number(values.distance_km) : null,
      notes: values.notes || null,
    })

    if (error) {
      setSaving(false)
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3500)
      return
    }

    // La foto viaggia dopo l'insert (serve l'id per il path stabile). Se
    // fallisce, l'attività resta salvata: si avvisa e si può riprovare dalla
    // modifica — tollera anche bucket/colonna assenti pre-migrazione v27.
    let photoOk = true
    if (photoFile && data) {
      const { url, error: photoError } = await uploadActivityPhoto(data.user_id, data.id, photoFile)
      if (photoError || !url) {
        photoOk = false
      } else {
        const { error: linkError } = await updateActivity(data.id, { photo_url: url })
        if (linkError) photoOk = false
      }
    }

    setSaving(false)
    setPhotoFile(null)

    haptic('success')

    setCreditsEarned(data?.credits_earned ?? 0)
    if (photoOk) setSaved(true)
    else {
      setPhotoWarning(true)
      setTimeout(() => setPhotoWarning(false), 4000)
    }
    reset({
      type: 'corsa',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      hours: 0,
      minutes: 30,
      calories: '',
      distance_km: '',
      notes: '',
    })
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{log.newActivityTitle}</span>
        <div className="header-accent" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Activity type grid */}
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{log.form.activityTypeTitle}</h2>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.value
              return (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--red)] bg-[var(--red)]/10'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.1)' : 'var(--grey)' }}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('type')}
                    className="sr-only"
                  />
                  <ActivityIcon type={opt.value} className={isSelected ? 'text-[var(--red)]' : 'text-gray-400'} />
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {(GPS_TRACKABLE_TYPES as ActivityType[]).includes(selectedType) && (
          <button
            type="button"
            onClick={() => setTracking(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Satellite size={18} />
            {log.gpsButton}
          </button>
        )}

        {/* Date & Time */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.dateTimeTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor="log-date" className="block text-xs text-gray-400 mb-1">{log.form.dateLabel}</label>
              <input id="log-date" type="date" {...register('date', { required: true })} className="input-dark w-full" />
            </div>
            <div className="min-w-0">
              <label htmlFor="log-time" className="block text-xs text-gray-400 mb-1">{log.form.timeLabel}</label>
              <input id="log-time" type="time" {...register('time')} className="input-dark w-full" />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.durationTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="log-hours" className="block text-xs text-gray-400 mb-1">{log.form.hoursLabel}</label>
              <input
                id="log-hours"
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
              <label htmlFor="log-minutes" className="block text-xs text-gray-400 mb-1">{log.form.minutesLabel}</label>
              <input
                id="log-minutes"
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
          {durationMin > 0 && (
            <p className="text-xs text-gray-400">
              {log.new.durationTotalPrefix} <span className="text-white font-medium">{hours}h {minutes < 10 ? '0' + minutes : minutes}min</span>
            </p>
          )}
          {(errors.hours || errors.minutes) && (
            <p className="text-xs text-red-400">{errors.hours?.message || errors.minutes?.message}</p>
          )}
        </div>

        {/* Calories & Distance */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.detailsTitle}</h2>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="log-calories" className="text-xs text-gray-400">
                {log.new.caloriesLabel}
                {autoCalories && caloriesInput === '' && (
                  <span className="ml-2 text-gray-500">{log.new.caloriesAutoHint(autoCalories)}</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowCalInfo(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--red)] transition-colors"
                aria-label={log.new.calorieInfoAriaLabel}
              >
                <Info size={13} />
                <span>{log.new.calorieInfoToggle}</span>
                {showCalInfo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showCalInfo && (
              <div className="rounded-lg p-3 mb-2 text-xs space-y-2 bg-[var(--grey)] border border-[var(--grey-light)]">
                <p className="font-semibold text-[var(--red)]">{log.new.calorieInfo.heading}</p>
                <p className="text-gray-400 leading-relaxed">
                  {log.new.calorieInfo.intro}
                </p>
                <div className="font-mono text-center py-1.5 rounded bg-[var(--grey-dark)] text-gray-300">
                  {log.new.calorieInfo.formula}
                </div>
                <ul className="text-gray-400 space-y-1 leading-relaxed">
                  <li><span className="text-white">{log.new.calorieInfo.metLabel}</span> — {log.new.calorieInfo.metDesc}</li>
                  <li><span className="text-white">{log.new.calorieInfo.weightLabel}</span> — {log.new.calorieInfo.weightDesc(profile?.weight_kg)}</li>
                  <li><span className="text-white">{log.new.calorieInfo.durationLabel}</span> — {log.new.calorieInfo.durationDesc}</li>
                  <li><span className="text-white">{log.new.calorieInfo.genderLabel}</span> — {log.new.calorieInfo.genderDesc(profile?.gender)}</li>
                </ul>
                <p className="text-gray-500 leading-relaxed">
                  {log.new.calorieInfo.estimateBefore}<span className="text-gray-400">{log.new.calorieInfo.estimateEmphasis}</span>{log.new.calorieInfo.estimateAfter}
                </p>
              </div>
            )}

            <input
              id="log-calories"
              type="number"
              {...register('calories', {
                min: { value: 0, message: log.form.validation.caloriesNotNegative },
                max: { value: 20000, message: log.form.validation.unrealisticValue },
              })}
              className="input-dark"
              placeholder={autoCalories ? log.new.caloriesPlaceholderAuto(autoCalories) : log.new.caloriesPlaceholderManual}
              min={0}
            />
            {errors.calories && <p className="text-xs text-red-400 mt-1">{errors.calories.message}</p>}
          </div>

          {showDist && (
            <div>
              <label htmlFor="log-distance" className="block text-xs text-gray-400 mb-1">{log.form.distanceLabel}</label>
              <input
                id="log-distance"
                type="number"
                step="0.01"
                {...register('distance_km', {
                  min: { value: 0, message: log.form.validation.distanceNotNegative },
                  max: { value: 1000, message: log.form.validation.unrealisticValue },
                })}
                className="input-dark"
                placeholder={log.new.distancePlaceholder}
                min={0}
              />
              {errors.distance_km && <p className="text-xs text-red-400 mt-1">{errors.distance_km.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="log-notes" className="block text-xs text-gray-400 mb-1">{log.new.notesLabel}</label>
            <textarea
              id="log-notes"
              {...register('notes')}
              className="input-dark resize-none"
              rows={3}
              placeholder={log.new.notesPlaceholder}
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">{log.new.photoLabel}</p>
            <PhotoPickerField
              previewUrl={photoPreview}
              onSelect={setPhotoFile}
              onClear={() => setPhotoFile(null)}
              inputId="log-photo"
            />
            <p className="text-[10px] text-gray-600 mt-1">{log.new.photoHint}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-save w-full flex items-center justify-center gap-3 rounded-xl py-5 font-bebas text-2xl tracking-widest text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {saving ? (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {log.new.saving}
            </>
          ) : (
            <>
              <Zap size={22} fill="currentColor" />
              {log.new.save}
            </>
          )}
        </button>
      </form>

      {tracking && (
        <WorkoutTrackingOverlay
          activityType={selectedType as GpsTrackableType}
          addActivity={addActivity}
          onClose={() => setTracking(false)}
          onSaved={(credits) => {
            setTracking(false)
            setCreditsEarned(credits)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
          }}
          onSaveWarning={() => {
            setRouteWarning(true)
            setTimeout(() => setRouteWarning(false), 4000)
          }}
        />
      )}

      {saved && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">{log.new.savedToast.title}</p>
            <p className="text-green-400 text-xs">
              {creditsEarned > 0 ? log.new.savedToast.credits(creditsEarned) : log.new.savedToast.noCredits}
            </p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">{log.new.errorToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.errorToast.body}</p>
          </div>
        </div>
      )}

      {photoWarning && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">{log.new.photoWarningToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.photoWarningToast.body}</p>
          </div>
        </div>
      )}

      {routeWarning && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">{log.new.routeWarningToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.routeWarningToast.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}
