import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, formatISO } from 'date-fns'
import { Info, ChevronDown, ChevronUp, Zap, CheckCircle2 } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { ACTIVITY_OPTIONS, calcCalories } from '../lib/constants'
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
  const { addActivity } = useActivities()
  const { profile } = useProfile()
  const [saved, setSaved] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showCalInfo, setShowCalInfo] = useState(false)

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

    await addActivity({
      type: values.type,
      date: dateTime,
      duration_min: dur,
      calories: cal,
      distance_km: values.distance_km !== '' ? Number(values.distance_km) : null,
      notes: values.notes || null,
    })

    // vibrate on mobile
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])

    setSaving(false)
    setCreditsEarned(Math.floor(dur / 10))
    setSaved(true)
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
      <div className="flex items-center gap-3 pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">REGISTRA ATTIVITÀ</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Activity type grid */}
        <div className="card">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider mb-3">TIPO DI ATTIVITÀ</h2>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.value
              return (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#F44352] bg-[#F44352]/10'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ background: isSelected ? 'rgba(244,67,82,0.1)' : 'var(--grey)' }}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('type')}
                    className="sr-only"
                  />
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">DATA E ORA</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs text-gray-400 mb-1">Data</label>
              <input type="date" {...register('date', { required: true })} className="input-dark w-full" />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-400 mb-1">Ora</label>
              <input type="time" {...register('time')} className="input-dark w-full" />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">DURATA</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ore</label>
              <input
                type="number"
                {...register('hours', { min: 0, max: 12 })}
                className="input-dark"
                min={0}
                max={12}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Minuti</label>
              <input
                type="number"
                {...register('minutes', { min: 0, max: 59 })}
                className="input-dark"
                min={0}
                max={59}
              />
            </div>
          </div>
          {durationMin > 0 && (
            <p className="text-xs text-gray-400">
              Totale: <span className="text-white font-medium">{hours}h {minutes < 10 ? '0' + minutes : minutes}min</span>
            </p>
          )}
          {errors.minutes && <p className="text-xs text-red-400">Durata non valida</p>}
        </div>

        {/* Calories & Distance */}
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">DETTAGLI</h2>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">
                Calorie bruciate
                {autoCalories && caloriesInput === '' && (
                  <span className="ml-2 text-gray-500">(auto: ~{autoCalories} kcal)</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowCalInfo(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#F44352] transition-colors"
                aria-label="Come vengono calcolate le calorie"
              >
                <Info size={13} />
                <span>Come si calcola?</span>
                {showCalInfo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showCalInfo && (
              <div className="rounded-lg p-3 mb-2 text-xs space-y-2 bg-[var(--grey)] border border-[var(--grey-light)]">
                <p className="font-semibold text-[#F44352]">Stima basata sul MET</p>
                <p className="text-gray-400 leading-relaxed">
                  Il calcolo usa la formula standard dell&apos;equivalente metabolico (MET):
                </p>
                <div className="font-mono text-center py-1.5 rounded bg-[var(--grey-dark)] text-gray-300">
                  kcal = MET × peso (kg) × durata (ore)
                </div>
                <ul className="text-gray-400 space-y-1 leading-relaxed">
                  <li><span className="text-white">MET</span> — intensità dell&apos;attività (es. corsa = 9.8, yoga = 2.5, nuoto = 8.0)</li>
                  <li><span className="text-white">Peso</span> — preso dal tuo profilo{profile?.weight_kg ? ` (${profile.weight_kg} kg)` : ' — impostalo nel Profilo per attivare il calcolo auto'}</li>
                  <li><span className="text-white">Durata</span> — ore inserite nella sezione DURATA</li>
                  <li><span className="text-white">Sesso</span> — {profile?.gender ? (profile.gender === 'female' ? 'femmina (−10% kcal per composizione corporea)' : 'maschio') : 'non impostato — aggiungilo nel Profilo per una stima più precisa'}</li>
                </ul>
                <p className="text-gray-500 leading-relaxed">
                  È una <span className="text-gray-400">stima</span>: il valore reale dipende dall&apos;intensità effettiva, dalla frequenza cardiaca e dalla tua forma fisica. Puoi sempre sovrascriverlo manualmente.
                </p>
              </div>
            )}

            <input
              type="number"
              {...register('calories')}
              className="input-dark"
              placeholder={autoCalories ? `~${autoCalories} (calcolato auto)` : 'es. 350'}
              min={0}
            />
          </div>

          {showDist && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Distanza (km)</label>
              <input
                type="number"
                step="0.01"
                {...register('distance_km')}
                className="input-dark"
                placeholder="es. 5.4"
                min={0}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Note (opzionale)</label>
            <textarea
              {...register('notes')}
              className="input-dark resize-none"
              rows={3}
              placeholder="Come ti sei sentito? Dettagli dell'allenamento..."
            />
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
              Salvataggio...
            </>
          ) : (
            <>
              <Zap size={22} fill="currentColor" />
              Salva attività
            </>
          )}
        </button>
      </form>

      {saved && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">Attività salvata!</p>
            <p className="text-green-400 text-xs">
              {creditsEarned > 0 ? `+${creditsEarned} 💎 crediti guadagnati` : 'Continua così 💪'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
