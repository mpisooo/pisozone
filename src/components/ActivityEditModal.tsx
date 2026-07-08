import { useState, useRef, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO, formatISO } from 'date-fns'
import { X, Trash2, Save, AlertTriangle } from 'lucide-react'
import { ACTIVITY_OPTIONS, calcCalories } from '../lib/constants'
import { uploadActivityPhoto, removeActivityPhoto } from '../lib/activityPhotos'
import { useProfile } from '../hooks/useProfile'
import { useFocusTrap } from '../hooks/useFocusTrap'
import PhotoPickerField from './PhotoPickerField'
import type { Activity, ActivityType } from '../types'

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
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

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
        setErrorMsg('Caricamento della foto non riuscito. Controlla la connessione e riprova.')
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
      ...photoUpdates,
    })
    setSaving(false)
    if (error) {
      setErrorMsg('Modifica non riuscita. Controlla la connessione e riprova.')
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
      setErrorMsg('Eliminazione non riuscita. Controlla la connessione e riprova.')
      setConfirmDelete(false)
      return
    }
    onClose()
  }

  // Schermata fissa a tutto schermo (come Registra), non più bottom sheet:
  // l'header con la X resta sempre visibile mentre il contenuto scorre, e lo
  // sfondo opaco copre il calendario sottostante.
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Modifica attività"
      className="fixed inset-0 z-50 flex flex-col page-enter"
      style={{ background: 'var(--black)' }}
    >
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-[var(--grey)]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <span className="font-bebas text-2xl text-white tracking-wider">MODIFICA ATTIVITÀ</span>
        <button type="button" onClick={onClose} aria-label="Chiudi" className="p-2 -mr-2 text-gray-400 hover:text-white">
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
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-3">TIPO DI ATTIVITÀ</h2>
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
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">DATA E ORA</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor="edit-date" className="block text-xs text-gray-400 mb-1">Data</label>
              <input id="edit-date" type="date" {...register('date')} className="input-dark w-full" />
            </div>
            <div className="min-w-0">
              <label htmlFor="edit-time" className="block text-xs text-gray-400 mb-1">Ora</label>
              <input id="edit-time" type="time" {...register('time')} className="input-dark w-full" />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">DURATA</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-hours" className="block text-xs text-gray-400 mb-1">Ore</label>
              <input
                id="edit-hours"
                type="number"
                {...register('hours', {
                  min: { value: 0, message: 'Non può essere negativa' },
                  max: { value: 12, message: 'Massimo 12 ore' },
                })}
                className="input-dark"
                min={0}
                max={12}
              />
            </div>
            <div>
              <label htmlFor="edit-minutes" className="block text-xs text-gray-400 mb-1">Minuti</label>
              <input
                id="edit-minutes"
                type="number"
                {...register('minutes', {
                  min: { value: 0, message: 'Non possono essere negativi' },
                  max: { value: 59, message: 'Massimo 59 minuti' },
                  validate: (v) => (Number(watch('hours')) * 60 + Number(v)) > 0 || 'Inserisci una durata maggiore di zero',
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

        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">DETTAGLI</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-calories" className="block text-xs text-gray-400 mb-1">Calorie</label>
              <input
                id="edit-calories"
                type="number"
                {...register('calories', {
                  min: { value: 0, message: 'Non possono essere negative' },
                  max: { value: 20000, message: 'Valore non realistico' },
                })}
                className="input-dark"
                placeholder="auto"
                min={0}
              />
              {errors.calories && <p className="text-xs text-red-400 mt-1">{errors.calories.message}</p>}
            </div>
            {showDist && (
              <div>
                <label htmlFor="edit-distance" className="block text-xs text-gray-400 mb-1">Distanza (km)</label>
                <input
                  id="edit-distance"
                  type="number"
                  step="0.01"
                  {...register('distance_km', {
                    min: { value: 0, message: 'Non può essere negativa' },
                    max: { value: 1000, message: 'Valore non realistico' },
                  })}
                  className="input-dark"
                  min={0}
                />
                {errors.distance_km && <p className="text-xs text-red-400 mt-1">{errors.distance_km.message}</p>}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-xs text-gray-400 mb-1">Note</label>
            <textarea id="edit-notes" {...register('notes')} className="input-dark resize-none" rows={2} />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Foto</p>
            <PhotoPickerField
              previewUrl={photoPreview}
              onSelect={(f) => { setPhotoFile(f); setPhotoRemoved(false) }}
              onClear={() => { setPhotoFile(null); setPhotoRemoved(true) }}
              inputId="edit-photo"
            />
          </div>
        </div>

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
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
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
            {confirmDelete ? 'Conferma?' : 'Elimina'}
          </button>
        </div>
      </form>
    </div>
  )
}
