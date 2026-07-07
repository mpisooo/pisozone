import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO, formatISO } from 'date-fns'
import { X, Trash2, Save, AlertTriangle } from 'lucide-react'
import { ACTIVITY_OPTIONS, calcCalories } from '../lib/constants'
import { useProfile } from '../hooks/useProfile'
import { useFocusTrap } from '../hooks/useFocusTrap'
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
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

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

    const { error } = await updateActivity(activity.id, {
      type: v.type,
      date: formatISO(new Date(`${v.date}T${v.time}:00`)),
      duration_min: dur,
      calories: cal,
      distance_km: v.distance_km !== '' ? Number(v.distance_km) : null,
      notes: v.notes || null,
    })
    setSaving(false)
    if (error) {
      setErrorMsg('Modifica non riuscita. Controlla la connessione e riprova.')
      return
    }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Modifica attività"
        className="w-full max-h-[88vh] overflow-y-auto rounded-t-2xl p-4 space-y-4"
        style={{ background: '#1a1a1a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center -mb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3a3a3a' }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bebas text-2xl text-white tracking-wider">MODIFICA ATTIVITÀ</span>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="p-1 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Activity type grid */}
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.value
              return (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer border transition-all duration-150 ${
                    isSelected ? 'border-[var(--red)]' : 'border-transparent'
                  }`}
                  style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.15)' : '#2a2a2a' }}
                >
                  <input type="radio" value={opt.value} {...register('type')} className="sr-only" />
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </label>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-date" className="block text-xs text-gray-400 mb-1">Data</label>
              <input id="edit-date" type="date" {...register('date')} className="input-dark" />
            </div>
            <div>
              <label htmlFor="edit-time" className="block text-xs text-gray-400 mb-1">Ora</label>
              <input id="edit-time" type="time" {...register('time')} className="input-dark" />
            </div>
          </div>

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
    </div>
  )
}
