import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { differenceInYears, parseISO, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Camera, Save, User, Scale, TrendingUp, Lock, Check, ChevronRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import {
  LEVEL_DEFINITIONS, THEME_DEFINITIONS,
  getLevelDef, getNextLevelDef,
  type ThemeId,
} from '../lib/levels'
import type { Profile, ActivityType } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import CelebrationOverlay from '../components/CelebrationOverlay'

type FormValues = {
  name: string
  birth_date: string
  height_cm: number | ''
  weight_kg: number | ''
  weekly_goal: number
  daily_calorie_goal: number | ''
}

function calcBMI(weight: number, height: number) {
  const h = height / 100
  return weight / (h * h)
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Sottopeso', color: '#60a5fa' }
  if (bmi < 25)   return { label: 'Normale',   color: '#4ade80' }
  if (bmi < 30)   return { label: 'Sovrappeso', color: '#facc15' }
  return             { label: 'Obeso',       color: '#F44352' }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, updateProfile, refetch: refetchProfile } = useProfile()
  const { logs: weightLogs, addLog: addWeightLog } = useWeightLogs()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sportPreferiti, setSportPreferiti] = useState<ActivityType[]>([])
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [loggingWeight, setLoggingWeight] = useState(false)
  const [weightLogError, setWeightLogError] = useState('')
  const [shopMsg, setShopMsg] = useState('')
  const [shopWorking, setShopWorking] = useState(false)
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ emoji: string; level: number; title: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const chartGrid  = theme === 'light' || theme === 'white' ? '#E0E0E0' : '#2a2a2a'
  const chartTick  = theme === 'light' || theme === 'white' ? '#777777' : '#9ca3af'
  const tooltipBg  = theme === 'light' || theme === 'white' ? '#ffffff' : '#1a1a1a'
  const tooltipBdr = theme === 'light' || theme === 'white' ? '#E0E0E0' : '#3a3a3a'

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>()

  useEffect(() => {
    if (!loading && profile) {
      reset({
        name: profile.name ?? '',
        birth_date: profile.birth_date ?? '',
        height_cm: profile.height_cm ?? '',
        weight_kg: profile.weight_kg ?? '',
        weekly_goal: profile.weekly_goal,
        daily_calorie_goal: profile.daily_calorie_goal ?? '',
      })
      setPhotoUrl(profile.photo_url)
      setSportPreferiti(profile.sport_preferiti ?? [])
      setGender(profile.gender ?? null)
    }
  }, [loading, profile, reset])

  const weight = Number(watch('weight_kg')) || null
  const height = Number(watch('height_cm')) || null
  const birthDate = watch('birth_date')

  const bmi = weight && height ? calcBMI(weight, height) : null
  const bmiInfo = bmi ? bmiCategory(bmi) : null
  const age = birthDate ? differenceInYears(new Date(), parseISO(birthDate)) : null

  const toggleSport = (type: ActivityType) => {
    setSportPreferiti((prev) => {
      if (prev.includes(type)) return prev.filter((t) => t !== type)
      if (prev.length >= 3) return prev
      return [...prev, type]
    })
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    const updates: Partial<Profile> = {
      name: values.name || null,
      birth_date: values.birth_date || null,
      height_cm: values.height_cm !== '' ? Number(values.height_cm) : null,
      weight_kg: values.weight_kg !== '' ? Number(values.weight_kg) : null,
      weekly_goal: Number(values.weekly_goal),
      daily_calorie_goal: values.daily_calorie_goal !== '' ? Number(values.daily_calorie_goal) : null,
      photo_url: photoUrl,
      sport_preferiti: sportPreferiti,
      gender,
    }
    await updateProfile(updates)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogWeight = async () => {
    if (!weight) return
    if (weight <= 20 || weight >= 400) {
      setWeightLogError('Il peso deve essere tra 20 e 400 kg.')
      setTimeout(() => setWeightLogError(''), 3500)
      return
    }
    setLoggingWeight(true)
    setWeightLogError('')
    const { error } = await addWeightLog(weight)
    setLoggingWeight(false)
    if (error) {
      setWeightLogError('Salvataggio non riuscito. Controlla la connessione e riprova.')
      setTimeout(() => setWeightLogError(''), 3500)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) {
      setUploadError('Errore upload: ' + error.message)
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = data.publicUrl + `?t=${Date.now()}`
      setPhotoUrl(newUrl)
      await updateProfile({ photo_url: newUrl })
    }
    setUploading(false)
  }

  const showShopMsg = (msg: string) => {
    setShopMsg(msg)
    setTimeout(() => setShopMsg(''), 3000)
  }

  const handleLevelUp = async () => {
    if (!user || shopWorking) return
    setShopWorking(true)
    const { data, error } = await supabase.rpc('unlock_next_level', { p_user_id: user.id })
    setShopWorking(false)
    if (error) { showShopMsg('Errore: ' + error.message); return }
    if (!data.success) { showShopMsg(data.error ?? 'Crediti insufficienti'); return }
    const newLevelDef = getLevelDef(data.new_level)
    setLevelUpCelebration({ emoji: newLevelDef.emoji, level: data.new_level, title: newLevelDef.title })
    await refetchProfile()
  }

  const handlePurchaseTheme = async (themeId: string, cost: number) => {
    if (!user || shopWorking) return
    setShopWorking(true)
    const { data, error } = await supabase.rpc('purchase_theme', {
      p_user_id: user.id,
      p_theme_id: themeId,
      p_cost: cost,
    })
    setShopWorking(false)
    if (error) { showShopMsg('Errore: ' + error.message); return }
    if (!data.success) { showShopMsg(data.error ?? 'Errore acquisto'); return }
    setTheme(themeId as ThemeId)
    showShopMsg('Tema sbloccato e attivato!')
    await refetchProfile()
  }

  const handleActivateTheme = async (themeId: string) => {
    if (!user || shopWorking) return
    setShopWorking(true)
    await supabase.rpc('activate_theme', { p_user_id: user.id, p_theme_id: themeId })
    setShopWorking(false)
    setTheme(themeId as ThemeId)
    await refetchProfile()
  }

  const username: string = (user?.user_metadata?.username as string) || 'Atleta'
  const currentLevel = profile?.level ?? 1
  const levelDef = getLevelDef(currentLevel)
  const nextLevel = getNextLevelDef(currentLevel)
  const credits = profile?.credits ?? 0
  const unlockedThemes: string[] = profile?.unlocked_themes ?? ['dark', 'light']
  const activeTheme = profile?.active_theme ?? 'dark'

  const chartData = weightLogs.map((l) => ({
    date: format(parseISO(l.logged_at), 'd MMM', { locale: it }),
    peso: Number(l.weight_kg),
  }))
  const minWeight = chartData.length > 0 ? Math.min(...chartData.map((d) => d.peso)) - 2 : 50
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map((d) => d.peso)) + 2 : 100

  if (loading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    )
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">PROFILO</span>
      </div>

      {/* Username badge con livello */}
      <div className="card flex items-center gap-3 py-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-[white] flex-shrink-0"
          style={{ background: levelDef.color }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Username</p>
          <p className="font-semibold text-white">@{username}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className="font-bebas text-lg leading-none"
            style={{ color: levelDef.color }}
          >
            LV.{currentLevel} {levelDef.emoji}
          </span>
          <span className="text-xs" style={{ color: levelDef.color }}>{levelDef.title}</span>
        </div>
      </div>

      {/* Avatar con cornice */}
      <div className="card flex flex-col items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-full cursor-pointer"
          style={{ border: '2px solid var(--red)' }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[var(--grey)]">
            {photoUrl ? (
              <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User size={36} className="text-gray-500" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <Camera size={22} className="text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Carica foto profilo" onChange={handlePhotoChange} />
        {uploading && <p className="text-xs text-gray-400">Caricamento...</p>}
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        {!uploading && !uploadError && (
          <p className="text-xs text-gray-500">Tocca per cambiare foto</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dati personali */}
        <div className="card space-y-4">
          <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">DATI PERSONALI</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome (opzionale)</label>
            <input {...register('name')} className="input-dark" placeholder="Il tuo nome" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Sesso</label>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(prev => prev === g ? null : g)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    gender === g
                      ? 'border-[#F44352] text-white bg-[#F44352]/15'
                      : 'border-transparent text-gray-400 hover:border-gray-600'
                  }`}
                  style={{ background: gender === g ? 'rgba(244,67,82,0.15)' : 'var(--grey)' }}
                >
                  {g === 'male' ? '♂ Maschio' : '♀ Femmina'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              Usato per stimare meglio le calorie bruciate
            </p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs text-gray-400 mb-1">
              Data di nascita
              {age !== null && age >= 0 && (
                <span className="ml-2 text-[#F44352]">{age} anni</span>
              )}
            </label>
            <input type="date" {...register('birth_date')} className="input-dark w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="profile-height" className="block text-xs text-gray-400 mb-1">Altezza (cm)</label>
              <input
                id="profile-height"
                type="number"
                {...register('height_cm', {
                  min: { value: 50, message: 'Valore troppo basso' },
                  max: { value: 250, message: 'Valore troppo alto' },
                })}
                className="input-dark"
                placeholder="175"
                min={50}
                max={250}
              />
              {errors.height_cm && <p className="text-xs text-red-400 mt-1">{errors.height_cm.message}</p>}
            </div>
            <div>
              <label htmlFor="profile-weight" className="block text-xs text-gray-400 mb-1">Peso (kg)</label>
              <input
                id="profile-weight"
                type="number"
                step="0.1"
                {...register('weight_kg', {
                  min: { value: 20, message: 'Valore troppo basso' },
                  max: { value: 400, message: 'Valore troppo alto' },
                })}
                className="input-dark"
                placeholder="75"
                min={20}
                max={400}
              />
              {errors.weight_kg && <p className="text-xs text-red-400 mt-1">{errors.weight_kg.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Obiettivo settimanale</label>
              <input type="number" {...register('weekly_goal')} className="input-dark" placeholder="3" min={1} max={14} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Calorie/giorno (kcal)</label>
              <input type="number" {...register('daily_calorie_goal')} className="input-dark" placeholder="opzionale" min={100} max={5000} />
            </div>
          </div>
        </div>

        {/* BMI */}
        {bmi !== null && bmiInfo && (
          <div className="card count-up" style={{ borderColor: bmiInfo.color }}>
            <h2 className="font-bebas text-xl tracking-wider mb-3" style={{ color: bmiInfo.color }}>BMI</h2>
            <div className="flex items-end gap-3">
              <span className="font-bebas text-5xl" style={{ color: bmiInfo.color }}>{bmi.toFixed(1)}</span>
              <span className="text-sm text-gray-300 mb-1">{bmiInfo.label}</span>
            </div>
            <div className="progress-track mt-3 relative h-3 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full flex-[4]"   style={{ background: '#60a5fa' }} />
                <div className="h-full flex-[6.5]" style={{ background: '#4ade80' }} />
                <div className="h-full flex-[5]"   style={{ background: '#facc15' }} />
                <div className="h-full flex-[10]"  style={{ background: '#F44352' }} />
              </div>
              <div
                className="absolute top-0 bottom-0 w-1 rounded bg-white shadow-lg"
                style={{ left: `${Math.min(Math.max(((bmi - 10) / 40) * 100, 0), 100)}%`, transition: 'left 0.5s' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span><span>18.5</span><span>25</span><span>30</span><span>50</span>
            </div>
          </div>
        )}

        {/* Sport preferiti */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">SPORT PREFERITI</h2>
            <span className="text-xs text-gray-500">{sportPreferiti.length}/3 selezionati</span>
          </div>
          <p className="text-xs text-gray-500">Scegli fino a 3 attività che pratichi di più</p>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = sportPreferiti.includes(opt.value)
              const isDisabled = !isSelected && sportPreferiti.length >= 3
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSport(opt.value)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#F44352] scale-105'
                      : isDisabled
                      ? 'border-transparent opacity-30 cursor-not-allowed'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ background: isSelected ? 'rgba(244,67,82,0.15)' : 'var(--grey)' }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </button>
              )
            })}
          </div>
          {sportPreferiti.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {sportPreferiti.map((s) => {
                const opt = ACTIVITY_OPTIONS.find((o) => o.value === s)
                return (
                  <span key={s} className="text-xs px-2 py-1 rounded-full text-[white] font-medium bg-[#F44352]">
                    {opt?.emoji} {opt?.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={saving}>
          {saved ? (
            <span className="count-up">✅ Salvato!</span>
          ) : (
            <>
              <Save size={18} />
              {saving ? 'Salvataggio...' : 'Salva profilo'}
            </>
          )}
        </button>
      </form>

      {/* ── LIVELLO ──────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-xl tracking-wider" style={{ color: 'var(--red)' }}>IL TUO LIVELLO</h2>
          <span className="text-sm font-medium text-gray-400">{credits} 💎 crediti</span>
        </div>

        {/* Level progress row */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {LEVEL_DEFINITIONS.map((ld) => {
            const unlocked = currentLevel >= ld.level
            const isCurrent = currentLevel === ld.level
            return (
              <div
                key={ld.level}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200"
                  style={{
                    background: unlocked ? ld.color + '22' : 'var(--grey)',
                    border: `2px solid ${unlocked ? ld.color : 'var(--grey-light)'}`,
                    outline: isCurrent ? `2px solid ${ld.color}` : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {unlocked ? (
                    <span style={{ fontSize: '1.1rem' }}>{ld.emoji}</span>
                  ) : (
                    <Lock size={14} className="text-gray-600" />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: unlocked ? ld.color : '#6b7280' }}
                >
                  {ld.level}
                </span>
              </div>
            )
          })}
        </div>

        {/* Current level info */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: levelDef.color + '18', border: `1px solid ${levelDef.color}44` }}
        >
          <span className="text-4xl">{levelDef.emoji}</span>
          <div>
            <p className="font-bebas text-2xl leading-none" style={{ color: levelDef.color }}>
              {levelDef.title}
            </p>
            <p className="text-xs text-gray-400">Livello {currentLevel} di 10</p>
          </div>
        </div>

        {/* Next level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Prossimo: <span style={{ color: nextLevel.color }}>{nextLevel.emoji} {nextLevel.title}</span>
              </span>
              <span className={`font-medium ${credits >= nextLevel.costToUnlock ? 'text-green-400' : 'text-gray-500'}`}>
                {nextLevel.costToUnlock} 💎
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--grey)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((credits / nextLevel.costToUnlock) * 100, 100)}%`,
                  background: nextLevel.color,
                }}
              />
            </div>
            <button
              type="button"
              disabled={credits < nextLevel.costToUnlock || shopWorking}
              onClick={handleLevelUp}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={
                credits >= nextLevel.costToUnlock
                  ? { background: nextLevel.color, color: '#000' }
                  : { background: 'var(--grey)', color: '#6b7280', cursor: 'not-allowed' }
              }
            >
              <ChevronRight size={16} />
              {credits >= nextLevel.costToUnlock
                ? `Sali a Lv.${nextLevel.level} — ${nextLevel.costToUnlock} 💎`
                : `Servono ${nextLevel.costToUnlock - credits} 💎 in più`}
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="font-bebas text-xl" style={{ color: levelDef.color }}>👑 LIVELLO MASSIMO RAGGIUNTO</p>
            <p className="text-xs text-gray-500 mt-1">Sei tra i migliori atleti di PisoZone</p>
          </div>
        )}

        {shopMsg && (
          <p className="text-sm text-center font-medium rounded-lg py-2 px-3" style={{ background: 'var(--grey)', color: 'var(--red)' }}>
            {shopMsg}
          </p>
        )}
      </div>

      {/* ── TEMI ─────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-bebas text-xl tracking-wider" style={{ color: 'var(--red)' }}>TEMI</h2>
        <div className="grid grid-cols-2 gap-3">
          {THEME_DEFINITIONS.map((td) => {
            const isUnlocked = td.free || unlockedThemes.includes(td.id)
            const isActive = activeTheme === td.id
            const canAfford = credits >= td.cost
            return (
              <div
                key={td.id}
                className="rounded-xl p-3 space-y-2 border transition-all duration-200"
                style={{
                  background: 'var(--grey)',
                  borderColor: isActive ? 'var(--red)' : 'var(--grey-light)',
                }}
              >
                {/* Preview */}
                <div
                  className="w-full h-10 rounded-lg flex items-center gap-2 px-3"
                  style={{ background: td.previewBg, border: `2px solid ${td.previewAccent}` }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: td.previewAccent }}
                  />
                  <div className="h-2 rounded flex-1" style={{ background: td.previewAccent + '55' }} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">{td.name}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{td.description}</p>
                </div>

                {isActive ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--red)' }}>
                    <Check size={13} />
                    Attivo
                  </div>
                ) : isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => handleActivateTheme(td.id)}
                    disabled={shopWorking}
                    className="w-full text-xs py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: 'var(--grey-light)', color: 'var(--color-text)' }}
                  >
                    Attiva
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePurchaseTheme(td.id, td.cost)}
                    disabled={!canAfford || shopWorking}
                    className="w-full text-xs py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1"
                    style={
                      canAfford
                        ? { background: 'var(--red)', color: '#fff' }
                        : { background: 'var(--grey-light)', color: '#6b7280', cursor: 'not-allowed' }
                    }
                  >
                    {canAfford ? <></> : <Lock size={11} />}
                    {canAfford ? `Sblocca ${td.cost} 💎` : `${td.cost} 💎`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Storico peso */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-[#F44352]" />
            <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">STORICO PESO</h2>
          </div>
          {weight && (
            <button
              type="button"
              onClick={handleLogWeight}
              disabled={loggingWeight}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-[white] transition-all active:scale-95 disabled:opacity-50 bg-[#F44352]"
            >
              <TrendingUp size={13} />
              {loggingWeight ? '...' : `Salva ${weight} kg`}
            </button>
          )}
        </div>

        {weightLogError && (
          <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(244,67,82,0.12)', color: '#F44352' }}>
            {weightLogError}
          </p>
        )}

        {chartData.length < 2 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {chartData.length === 0
              ? 'Nessuna pesata registrata. Inserisci il tuo peso e clicca "Salva peso".'
              : 'Registra almeno 2 pesate per vedere il grafico.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis
                dataKey="date"
                tick={{ fill: chartTick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minWeight, maxWeight]}
                tick={{ fill: chartTick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: chartTick }}
                itemStyle={{ color: '#F44352' }}
                formatter={(v) => [`${v} kg`, 'Peso']}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#F44352"
                strokeWidth={2}
                dot={{ fill: '#F44352', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#F44352' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartData.length > 0 && (
          <p className="text-xs text-gray-600 text-center">
            {chartData.length} {chartData.length === 1 ? 'pesata' : 'pesate'} registrate
          </p>
        )}
      </div>

      {levelUpCelebration && (
        <CelebrationOverlay
          icon={levelUpCelebration.emoji}
          title={`LIVELLO ${levelUpCelebration.level}!`}
          subtitle={`Nuovo titolo: ${levelUpCelebration.title}`}
          onDone={() => setLevelUpCelebration(null)}
        />
      )}
    </div>
  )
}
