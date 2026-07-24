import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { format, formatISO } from 'date-fns'
import { Info, ChevronDown, ChevronUp, Zap, CheckCircle2, CloudOff, AlertTriangle, Satellite, RotateCcw, Upload } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { ACTIVITY_OPTIONS, INDOOR_VARIANTS, calcCalories, GPS_TRACKABLE_TYPES, ELEVATION_CAPABLE_TYPES, type GpsTrackableType } from '../lib/constants'
import { uploadActivityPhoto } from '../lib/activityPhotos'
import { saveActivityExercises } from '../lib/activityExercises'
import {
  draftsToEntries, rowsToDrafts, buildPrMap, detectNewPrs, exerciseSuggestions,
  type ExerciseDraft, type PrRecord,
} from '../lib/exerciseSets'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { useRoutines } from '../hooks/useRoutines'
import { isPendingActivityId, pendingLocalId } from '../lib/offlineQueue'
import { savePendingAttachments } from '../lib/offlineAttachments'
import { lastActivityOfType, prefillFromActivity, type QuickLogPrefill } from '../lib/quickLog'
import {
  decomposeDurationMin, composeDurationMin, decomposeDurationSeconds, composeDurationSeconds, durationMinFromSeconds,
} from '../lib/duration'
import { detectGpsRecords, type WorkoutRecapData } from '../lib/workoutRecap'
import {
  isValidIntervalPlan, INTERVAL_MIN_REPEATS, INTERVAL_MAX_REPEATS,
  INTERVAL_MIN_WORK_M, INTERVAL_MAX_WORK_M, INTERVAL_MIN_RECOVERY_S, INTERVAL_MAX_RECOVERY_S,
  type IntervalPlan,
} from '../lib/intervalWorkout'
import { ZONES, type ZoneId } from '../lib/zones'
import { haptic } from '../lib/haptics'
import { getVoiceCuesEnabled, setVoiceCuesEnabled, primeVoice } from '../lib/voiceCues'
import PhotoPickerField from '../components/PhotoPickerField'
import PerceivedMetricsFields from '../components/PerceivedMetricsFields'
import ExerciseSetsFields from '../components/ExerciseSetsFields'
import RoutinePickerModal from '../components/RoutinePickerModal'
import GpxImportModal from '../components/GpxImportModal'
import SportQuickRow from '../components/SportQuickRow'
import SportPickerModal from '../components/SportPickerModal'
import WorkoutTrackingOverlay from '../components/WorkoutTrackingOverlay'
import WorkoutRecapOverlay from '../components/WorkoutRecapOverlay'
import log from '../lib/i18n/log'
import routinesText from '../lib/i18n/routines'
import type { ActivityType } from '../types'

type FormValues = {
  type: ActivityType
  date: string
  time: string
  hours: number
  minutes: number
  seconds: number
  calories: number | ''
  distance_km: number | ''
  elevation_gain_m: number | ''
  notes: string
}

export default function LogPage() {
  const { activities, addActivity, updateActivity } = useActivities()
  const { profile, refetch: refetchProfile } = useProfile()
  const [saved, setSaved] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  const [savedOfflineExtras, setSavedOfflineExtras] = useState(false)
  const [showGpxImport, setShowGpxImport] = useState(false)
  const [showSportPicker, setShowSportPicker] = useState(false)
  const [gpxImported, setGpxImported] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [photoWarning, setPhotoWarning] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showCalInfo, setShowCalInfo] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [tracking, setTracking] = useState(false)
  // Recap dopo-allenamento (roadmap v3, pilastro 01): al salvataggio di un
  // allenamento GPS il toast lascia il posto all'overlay celebrativo.
  const [recapData, setRecapData] = useState<WorkoutRecapData | null>(null)
  const [setsWarning, setSetsWarning] = useState(false)
  const [rpe, setRpe] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  // Indoor/outdoor (v38): facoltativo, null = non indicato. Si azzera al
  // cambio di sport: "tapis roulant" non deve sopravvivere a un passaggio
  // corsa → calcio.
  const [indoor, setIndoor] = useState<boolean | null>(null)
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>([])
  const [prRecords, setPrRecords] = useState<PrRecord[]>([])

  // Allenamento a intervalli (roadmap v4, pilastro 01): facoltativo, solo
  // per sport GPS-trackable — vedi lib/intervalWorkout.ts.
  const [intervalEnabled, setIntervalEnabled] = useState(false)
  const [intervalRepeats, setIntervalRepeats] = useState(5)
  const [intervalWorkM, setIntervalWorkM] = useState(800)
  const [intervalWorkZone, setIntervalWorkZone] = useState<ZoneId>(4)
  const [intervalRecoverySec, setIntervalRecoverySec] = useState(90)
  const [intervalRecoveryZone, setIntervalRecoveryZone] = useState<ZoneId>(1)
  const intervalPlan: IntervalPlan = {
    repeats: intervalRepeats,
    workDistanceM: intervalWorkM,
    workZoneId: intervalWorkZone,
    recoverySec: intervalRecoverySec,
    recoveryZoneId: intervalRecoveryZone,
  }
  const intervalPlanValid = isValidIntervalPlan(intervalPlan)

  // Coach vocale (roadmap v8, pilastro 02): preferenza locale, non un dato
  // personale da sincronizzare — vedi lib/voiceCues.ts.
  const [voiceEnabled, setVoiceEnabled] = useState(() => getVoiceCuesEnabled())
  const toggleVoiceEnabled = () => {
    haptic('light')
    setVoiceEnabled((v) => {
      const next = !v
      setVoiceCuesEnabled(next)
      return next
    })
  }

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  )
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  // Deep link della scorciatoia PWA "/log?gps=1" (manifest shortcuts, v2
  // pilastro 05): apre subito il tracciamento GPS col tipo di default (corsa).
  // Il parametro viene consumato, così chiudere l'overlay non lo riapre.
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('gps') === '1') {
      setSearchParams({}, { replace: true })
      setTracking(true)
    }
  }, [searchParams, setSearchParams])

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: 'corsa',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      hours: 0,
      minutes: 30,
      seconds: 0,
      calories: '',
      distance_km: '',
      elevation_gain_m: '',
      notes: '',
    },
  })

  const selectedType = watch('type')
  const hours = Number(watch('hours')) || 0
  const minutes = Number(watch('minutes')) || 0
  const seconds = Number(watch('seconds')) || 0
  const caloriesInput = watch('calories')

  const selectedActivity = ACTIVITY_OPTIONS.find((a) => a.value === selectedType)
  const showDist = selectedActivity?.hasDist ?? false
  // Secondi a mano SOLO per la corsa (roadmap "PisoZone Next"): serve il
  // passo esatto per i PR su distanze standard (1K/5K/10K...), non richiesto
  // per gli altri sport — si azzerano lasciando quella sezione (vedi effetto sotto).
  const showSeconds = selectedType === 'corsa'
  const durationMin = composeDurationMin(hours, minutes, seconds)
  const showElevation = (ELEVATION_CAPABLE_TYPES as ActivityType[]).includes(selectedType) && indoor !== true

  const indoorVariant = INDOOR_VARIANTS[selectedType]
  // Il cambio di sport azzera indoor ("tapis roulant" non sopravvive a un
  // passaggio corsa → calcio), TRANNE quando il cambio arriva dal log lampo:
  // lì l'indoor da applicare viaggia nel ref e vince sull'azzeramento.
  const pendingIndoorRef = useRef<boolean | null | undefined>(undefined)
  useEffect(() => {
    if (pendingIndoorRef.current !== undefined) {
      setIndoor(pendingIndoorRef.current)
      pendingIndoorRef.current = undefined
    } else {
      setIndoor(null)
    }
  }, [selectedType])

  // I secondi si azzerano lasciando la corsa: non hanno un campo visibile
  // fuori da lì e non devono sopravvivere silenziosamente al cambio sport.
  useEffect(() => {
    if (selectedType !== 'corsa') setValue('seconds', 0)
  }, [selectedType, setValue])

  // Log lampo (roadmap v3, pilastro 02) — arrivo da Home con "Ripeti questo
  // allenamento": il form si apre già compilato. Lo state viene consumato
  // (replace) così chiudere/riaprire la pagina non riapplica il prefill.
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const prefill = (location.state as { quickLog?: QuickLogPrefill } | null)?.quickLog
    if (!prefill) return
    navigate(location.pathname, { replace: true, state: null })
    if (prefill.type !== watch('type')) pendingIndoorRef.current = prefill.indoor
    else setIndoor(prefill.indoor)
    const parts = prefill.type === 'corsa' && prefill.durationSeconds != null
      ? decomposeDurationSeconds(prefill.durationSeconds)
      : decomposeDurationMin(prefill.durationMin)
    reset({
      type: prefill.type,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      hours: parts.hours,
      minutes: parts.minutes,
      seconds: parts.seconds,
      calories: '',
      distance_km: prefill.distanceKm ?? '',
      elevation_gain_m: (ELEVATION_CAPABLE_TYPES as ActivityType[]).includes(prefill.type) ? prefill.elevationGainM ?? '' : '',
      notes: '',
    })
  }, [location.state, location.pathname, navigate, reset, watch])

  // Chip "Come l'ultima volta": ricopia durata/distanza/indoor dell'ultima
  // sessione dello sport selezionato, senza toccare data, ora e note.
  const lastOfSport = useMemo(
    () => lastActivityOfType(activities, selectedType),
    [activities, selectedType],
  )
  const applyQuickChip = () => {
    if (!lastOfSport) return
    const p = prefillFromActivity(lastOfSport)
    const parts = p.type === 'corsa' && p.durationSeconds != null
      ? decomposeDurationSeconds(p.durationSeconds)
      : decomposeDurationMin(p.durationMin)
    setValue('hours', parts.hours)
    setValue('minutes', parts.minutes)
    setValue('seconds', parts.seconds)
    if (showDist) setValue('distance_km', p.distanceKm ?? '')
    if ((ELEVATION_CAPABLE_TYPES as ActivityType[]).includes(p.type)) setValue('elevation_gain_m', p.elevationGainM ?? '')
    setIndoor(p.indoor)
    haptic('light')
  }

  // Storico esercizi: caricato solo quando serve (palestra selezionata),
  // alimenta i suggerimenti nomi e il confronto per i nuovi PR.
  const isGym = selectedType === 'palestra'
  const { rows: exerciseHistory, loaded: historyLoaded, appendLocal } = useExerciseHistory(isGym)
  const nameSuggestions = useMemo(() => exerciseSuggestions(exerciseHistory), [exerciseHistory])

  // Routine salvate (roadmap v4, pilastro 03): il picker precompila i blocchi
  // della sessione, si modificano come un log normale prima di salvare.
  const { routines } = useRoutines(isGym)
  const [showRoutinePicker, setShowRoutinePicker] = useState(false)

  const autoCalories =
    caloriesInput === '' && durationMin > 0 && profile?.weight_kg
      ? calcCalories(selectedType, durationMin, profile.weight_kg, profile.gender)
      : null

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    // duration_min nel DB è un integer (vincolo 1-1440): non può ricevere una
    // frazione, va sempre arrotondato al minuto. I secondi precisi (solo
    // corsa) viaggiano a parte in duration_seconds (v52) — vedi lib/duration.ts.
    const totalSeconds = composeDurationSeconds(Number(values.hours), Number(values.minutes), Number(values.seconds) || 0)
    const dur = durationMinFromSeconds(totalSeconds)
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
      // Solo per la corsa: negli altri sport i secondi non si inseriscono a
      // mano (campo nascosto, sempre 0) e la colonna resterebbe un dato
      // ridondante rispetto a duration_min.
      ...(values.type === 'corsa' ? { duration_seconds: totalSeconds } : {}),
      calories: cal,
      distance_km: values.distance_km !== '' ? Number(values.distance_km) : null,
      elevation_gain_m: values.elevation_gain_m !== '' ? Math.round(Number(values.elevation_gain_m)) : null,
      notes: values.notes || null,
      rpe,
      mood,
      // Solo se indicato: pre-migrazione v38 la colonna non esiste e un
      // inserimento con la chiave fallirebbe anche a valore null.
      ...(indoor !== null ? { indoor } : {}),
    })

    if (error) {
      setSaving(false)
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3500)
      return
    }

    // Attività in coda offline (roadmap v2, pilastro 05): non ha ancora un id
    // reale, quindi foto/esercizi (che viaggiano dopo l'insert) non possono
    // essere salvati subito — vengono accodati anche loro (v3, pilastro 04,
    // vedi sotto) invece di essere scartati.
    const pending = data ? isPendingActivityId(data.id) : false

    // Il saldo crediti (P0-2 dell'audit tecnico del 24/07/2026): senza questo
    // refetch il resto dell'app (TopBar, Profilo, Impostazioni) continuava a
    // mostrare il saldo caricato al login, anche sulla primissima attività.
    // Un'attività in coda offline non ha ancora guadagnato crediti reali.
    if (!pending) refetchProfile()

    // La foto viaggia dopo l'insert (serve l'id per il path stabile). Se
    // fallisce, l'attività resta salvata: si avvisa e si può riprovare dalla
    // modifica — tollera anche bucket/colonna assenti pre-migrazione v27.
    let photoOk = true
    if (photoFile && data && !pending) {
      const { url, error: photoError } = await uploadActivityPhoto(data.user_id, data.id, photoFile)
      if (photoError || !url) {
        photoOk = false
      } else {
        const { error: linkError } = await updateActivity(data.id, { photo_url: url })
        if (linkError) photoOk = false
      }
    }

    // Anche gli esercizi viaggiano dopo l'insert (serve l'id) e un fallimento
    // non annulla l'attività. I PR si annunciano solo a storico caricato:
    // senza confronto, ogni carico sembrerebbe un record.
    let setsOk = true
    let newPrs: PrRecord[] = []
    const entries = values.type === 'palestra' ? draftsToEntries(exerciseDrafts) : []
    if (entries.length > 0 && data && !pending) {
      const { error: setsError } = await saveActivityExercises(data.user_id, data.id, entries)
      if (setsError) {
        setsOk = false
      } else if (historyLoaded) {
        newPrs = detectNewPrs(entries, buildPrMap(exerciseHistory))
          .sort((a, b) => b.weightKg - a.weightKg)
        appendLocal(entries)
      }
    }

    // Offline: foto ed esercizi vengono accodati in IndexedDB invece di
    // essere scartati — flushQueue li applica non appena l'attività ottiene
    // un id vero. I PR si possono comunque rilevare subito: il confronto è
    // locale (storico già caricato), non richiede che gli esercizi siano
    // già salvati sul server.
    const offlineExtrasQueued = pending && (Boolean(photoFile) || entries.length > 0)
    if (offlineExtrasQueued && data) {
      await savePendingAttachments({
        localId: pendingLocalId(data.id),
        photoFile: photoFile ?? undefined,
        exerciseEntries: entries.length > 0 ? entries : undefined,
      })
      if (entries.length > 0 && historyLoaded) {
        newPrs = detectNewPrs(entries, buildPrMap(exerciseHistory))
          .sort((a, b) => b.weightKg - a.weightKg)
        appendLocal(entries)
      }
    }

    setSaving(false)
    setPhotoFile(null)
    setRpe(null)
    setMood(null)
    setIndoor(null)
    setExerciseDrafts([])

    haptic(newPrs.length > 0 ? 'celebrate' : 'success')

    setCreditsEarned(data?.credits_earned ?? 0)
    setPrRecords(newPrs)
    if (photoOk && setsOk) {
      // Offline: in coda, non ancora nel DB (roadmap v2, pilastro 05).
      if (pending) { setSavedOfflineExtras(offlineExtrasQueued); setSavedOffline(true) }
      else setSaved(true)
    }
    else if (!setsOk) {
      setSetsWarning(true)
      setTimeout(() => setSetsWarning(false), 4000)
    } else {
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
      elevation_gain_m: '',
      notes: '',
    })
    // Con un PR da leggere il toast resta un po' di più
    setTimeout(() => setSaved(false), newPrs.length > 0 ? 5000 : 2500)
    setTimeout(() => { setSavedOffline(false); setSavedOfflineExtras(false) }, 4500)
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{log.newActivityTitle}</span>
        <div className="header-accent" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Selezione sport "come Strava" (22/07/2026): riga rapida coi
            preferiti + ricerca sull'intero catalogo, vedi SportQuickRow. */}
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">{log.form.activityTypeTitle}</h2>
          <SportQuickRow
            favorites={profile?.sport_preferiti ?? []}
            selected={selectedType}
            onSelect={(type) => setValue('type', type)}
            onOpenPicker={() => setShowSportPicker(true)}
          />

          {/* Indoor/outdoor: solo per gli sport dove il "dove" cambia il nome
              (tapis roulant, cyclette, piscina...). Tocca di nuovo per azzerare. */}
          {indoorVariant && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">{log.form.indoorQuestion}</p>
              <div className="grid grid-cols-2 gap-2">
                {([false, true] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    aria-pressed={indoor === val}
                    onClick={() => setIndoor((prev) => (prev === val ? null : val))}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      indoor === val
                        ? 'border-[var(--red)] text-white'
                        : 'border-transparent text-gray-400 hover:border-gray-600'
                    }`}
                    style={{ background: indoor === val ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                  >
                    {val ? indoorVariant.indoorChip : indoorVariant.outdoorChip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log lampo (roadmap v3, pilastro 02): un tocco e durata/distanza
              tornano quelle dell'ultima sessione di questo sport. */}
          {lastOfSport && (
            <button
              type="button"
              onClick={applyQuickChip}
              aria-label={log.quick.chipAria}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium text-gray-400 tap hover:text-white"
              style={{ background: 'var(--grey)' }}
            >
              <RotateCcw size={13} />
              {log.quick.chip(lastOfSport.duration_min, lastOfSport.distance_km ?? null)}
            </button>
          )}
        </div>

        {(GPS_TRACKABLE_TYPES as ActivityType[]).includes(selectedType) && indoor !== true && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-300">{log.intervals.toggleLabel}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{log.intervals.toggleHint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={intervalEnabled ? 'true' : 'false'}
                aria-label={log.intervals.toggleLabel}
                onClick={() => { haptic('light'); setIntervalEnabled((v) => !v) }}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${intervalEnabled ? 'bg-[var(--red)]' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${intervalEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {intervalEnabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="interval-repeats">{log.intervals.repeatsLabel}</label>
                  <input
                    id="interval-repeats"
                    type="number"
                    className="input-dark"
                    min={INTERVAL_MIN_REPEATS}
                    max={INTERVAL_MAX_REPEATS}
                    value={intervalRepeats}
                    onChange={(e) => setIntervalRepeats(Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{log.intervals.workHeading}</p>
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="interval-work-m">{log.intervals.workDistanceLabel}</label>
                    <input
                      id="interval-work-m"
                      type="number"
                      className="input-dark"
                      min={INTERVAL_MIN_WORK_M}
                      max={INTERVAL_MAX_WORK_M}
                      value={intervalWorkM}
                      onChange={(e) => setIntervalWorkM(Number(e.target.value))}
                    />
                    <label className="block text-xs text-gray-400 mt-2 mb-1" htmlFor="interval-work-zone">{log.intervals.zoneLabel}</label>
                    <select
                      id="interval-work-zone"
                      className="input-dark"
                      value={intervalWorkZone}
                      onChange={(e) => setIntervalWorkZone(Number(e.target.value) as ZoneId)}
                    >
                      {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{log.intervals.recoveryHeading}</p>
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="interval-recovery-s">{log.intervals.recoverySecLabel}</label>
                    <input
                      id="interval-recovery-s"
                      type="number"
                      className="input-dark"
                      min={INTERVAL_MIN_RECOVERY_S}
                      max={INTERVAL_MAX_RECOVERY_S}
                      value={intervalRecoverySec}
                      onChange={(e) => setIntervalRecoverySec(Number(e.target.value))}
                    />
                    <label className="block text-xs text-gray-400 mt-2 mb-1" htmlFor="interval-recovery-zone">{log.intervals.zoneLabel}</label>
                    <select
                      id="interval-recovery-zone"
                      className="input-dark"
                      value={intervalRecoveryZone}
                      onChange={(e) => setIntervalRecoveryZone(Number(e.target.value) as ZoneId)}
                    >
                      {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                    </select>
                  </div>
                </div>
                <p className={`text-xs ${intervalPlanValid ? 'text-gray-500' : 'text-amber-400'}`}>
                  {intervalPlanValid ? log.intervals.summary(intervalRepeats, intervalWorkM, intervalRecoverySec) : log.intervals.invalidHint}
                </p>
              </div>
            )}
          </div>
        )}

        {(GPS_TRACKABLE_TYPES as ActivityType[]).includes(selectedType) && indoor !== true && (
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-300">{log.voiceCues.toggleLabel}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{log.voiceCues.toggleHint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled ? 'true' : 'false'}
                aria-label={log.voiceCues.toggleLabel}
                onClick={toggleVoiceEnabled}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${voiceEnabled ? 'bg-[var(--red)]' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {(GPS_TRACKABLE_TYPES as ActivityType[]).includes(selectedType) && indoor !== true && (
          <>
            <button
              type="button"
              onClick={() => { if (voiceEnabled) primeVoice(); setTracking(true) }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Satellite size={18} />
              {log.gpsButton}
            </button>
            <button
              type="button"
              onClick={() => setShowGpxImport(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Upload size={14} />
              {log.gpxImport.entryButton}
            </button>
          </>
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
          <div className={`grid gap-3 ${showSeconds ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                  validate: (v) => composeDurationMin(Number(watch('hours')), Number(v), Number(watch('seconds')) || 0) > 0 || log.form.validation.minutesDurationZero,
                })}
                className="input-dark"
                min={0}
                max={59}
              />
            </div>
            {showSeconds && (
              <div>
                <label htmlFor="log-seconds" className="block text-xs text-gray-400 mb-1">{log.form.secondsLabel}</label>
                <input
                  id="log-seconds"
                  type="number"
                  {...register('seconds', {
                    min: { value: 0, message: log.form.validation.secondsNotNegative },
                    max: { value: 59, message: log.form.validation.secondsMax },
                  })}
                  className="input-dark"
                  min={0}
                  max={59}
                />
              </div>
            )}
          </div>
          {durationMin > 0 && (
            <p className="text-xs text-gray-400">
              {log.new.durationTotalPrefix}{' '}
              <span className="text-white font-medium">
                {hours}h {minutes < 10 ? '0' + minutes : minutes}min
                {showSeconds ? ` ${seconds < 10 ? '0' + seconds : seconds}s` : ''}
              </span>
            </p>
          )}
          {(errors.hours || errors.minutes || errors.seconds) && (
            <p className="text-xs text-red-400">{errors.hours?.message || errors.minutes?.message || errors.seconds?.message}</p>
          )}
        </div>

        {/* Log palestra strutturato: esercizi serie×rip×peso */}
        {isGym && (
          <>
            <div className="flex items-center justify-between gap-2 -mb-1">
              {routines.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowRoutinePicker(true)}
                  className="text-xs text-[var(--red)] font-medium"
                >
                  {routinesText.entryButton}
                </button>
              ) : <span />}
              <Link to="/routines" className="text-xs text-gray-500 hover:text-white transition-colors">
                {routinesText.manageLink}
              </Link>
            </div>
            <ExerciseSetsFields
              drafts={exerciseDrafts}
              onChange={setExerciseDrafts}
              suggestions={nameSuggestions}
              idPrefix="log"
            />
            {showRoutinePicker && (
              <RoutinePickerModal
                routines={routines}
                onClose={() => setShowRoutinePicker(false)}
                onSelect={(routine) => {
                  setExerciseDrafts(rowsToDrafts(routine.exercises))
                  setShowRoutinePicker(false)
                }}
              />
            )}
          </>
        )}

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

          {showElevation && (
            <div>
              <label htmlFor="log-elevation" className="block text-xs text-gray-400 mb-1">{log.form.elevationLabel}</label>
              <input
                id="log-elevation"
                type="number"
                {...register('elevation_gain_m', {
                  min: { value: 0, message: log.form.validation.distanceNotNegative },
                  max: { value: 10000, message: log.form.validation.unrealisticValue },
                })}
                className="input-dark"
                placeholder={log.form.elevationPlaceholder}
                min={0}
              />
              {errors.elevation_gain_m
                ? <p className="text-xs text-red-400 mt-1">{errors.elevation_gain_m.message}</p>
                : <p className="text-[10px] text-gray-600 mt-1">{log.form.elevationHint}</p>}
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

        <PerceivedMetricsFields rpe={rpe} mood={mood} onRpeChange={setRpe} onMoodChange={setMood} />

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

      {showSportPicker && (
        <SportPickerModal
          mode="single"
          favorites={profile?.sport_preferiti ?? []}
          selected={selectedType}
          onSelect={(type) => setValue('type', type)}
          onClose={() => setShowSportPicker(false)}
        />
      )}

      {showGpxImport && (
        <GpxImportModal
          onClose={() => setShowGpxImport(false)}
          onImported={() => {
            setShowGpxImport(false)
            setGpxImported(true)
            setTimeout(() => setGpxImported(false), 2500)
          }}
        />
      )}

      {gpxImported && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <p className="text-[var(--color-text)] font-semibold text-sm">{log.gpxImport.doneToast}</p>
        </div>
      )}

      {tracking && (
        <WorkoutTrackingOverlay
          activityType={selectedType as GpsTrackableType}
          intervalPlan={intervalEnabled && intervalPlanValid ? intervalPlan : undefined}
          addActivity={addActivity}
          onClose={() => setTracking(false)}
          onSaved={({ activity, points, pending, routeSaved }) => {
            setTracking(false)
            // I record si cercano nello storico già in memoria (l'attività
            // appena salvata viene esclusa per id dentro detectGpsRecords).
            const records = detectGpsRecords(activities, {
              id: activity.id,
              type: activity.type,
              distanceKm: activity.distance_km ?? 0,
              durationMin: activity.duration_min,
            })
            setRecapData({ activity, points, records, pending, routeSaved })
          }}
        />
      )}

      {recapData && (
        <WorkoutRecapOverlay data={recapData} onClose={() => setRecapData(null)} updateActivity={updateActivity} />
      )}

      {saved && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{log.new.savedToast.title}</p>
            <p className="text-green-400 text-xs">
              {creditsEarned > 0 ? log.new.savedToast.credits(creditsEarned) : log.new.savedToast.noCredits}
            </p>
            {prRecords.length > 0 && (
              <p className="text-amber-300 text-xs">
                {log.new.savedToast.pr(prRecords[0].exercise, prRecords[0].weightKg)}
                {prRecords.length > 1 && log.new.savedToast.prExtra(prRecords.length - 1)}
              </p>
            )}
          </div>
        </div>
      )}

      {savedOffline && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CloudOff size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{log.new.savedOfflineToast.title}</p>
            <p className="text-green-400 text-xs">
              {savedOfflineExtras ? log.new.savedOfflineToast.bodyExtrasQueued : log.new.savedOfflineToast.body}
            </p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{log.new.errorToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.errorToast.body}</p>
          </div>
        </div>
      )}

      {photoWarning && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{log.new.photoWarningToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.photoWarningToast.body}</p>
          </div>
        </div>
      )}

      {setsWarning && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{log.new.setsWarningToast.title}</p>
            <p className="text-[var(--red)] text-xs">{log.new.setsWarningToast.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}
