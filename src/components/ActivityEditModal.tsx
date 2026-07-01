import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO, formatISO } from 'date-fns'
import { X, Trash2, Save } from 'lucide-react'
import { ACTIVITY_OPTIONS, calcCalories } from '../lib/constants'
import { useProfile } from '../hooks/useProfile'
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

  const parsed = parseISO(activity.date)
  const { register, handleSubmit, watch } = useForm<FormValues>({
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
    const dur = Number(v.hours) * 60 + Number(v.minutes)
    const cal =
      v.calories !== '' ? Number(v.calories) :
      profile?.weight_kg && dur > 0 ? calcCalories(v.type, dur, profile.weight_kg) : null

    await updateActivity(activity.id, {
      type: v.type,
      date: formatISO(new Date(`${v.date}T${v.time}:00`)),
      duration_min: dur,
      calories: cal,
      distance_km: v.distance_km !== '' ? Number(v.distance_km) : null,
      notes: v.notes || null,
    })
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteActivity(activity.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
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
                    isSelected ? 'border-[#F44352]' : 'border-transparent'
                  }`}
                  style={{ background: isSelected ? 'rgba(244,67,82,0.15)' : '#2a2a2a' }}
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
              <label className="block text-xs text-gray-400 mb-1">Data</label>
              <input type="date" {...register('date')} className="input-dark" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ora</label>
              <input type="time" {...register('time')} className="input-dark" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ore</label>
              <input type="number" {...register('hours')} className="input-dark" min={0} max={12} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Minuti</label>
              <input type="number" {...register('minutes')} className="input-dark" min={0} max={59} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Calorie</label>
              <input type="number" {...register('calories')} className="input-dark" placeholder="auto" min={0} />
            </div>
            {showDist && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Distanza (km)</label>
                <input type="number" step="0.01" {...register('distance_km')} className="input-dark" min={0} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Note</label>
            <textarea {...register('notes')} className="input-dark resize-none" rows={2} />
          </div>

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
              style={confirmDelete ? { background: '#F44352' } : { border: '1px solid #7f1d1d' }}
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
