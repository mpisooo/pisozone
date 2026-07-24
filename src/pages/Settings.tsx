import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { differenceInYears, parseISO, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Save, Scale, TrendingUp, Lock, Check, ShieldCheck, Download, Trash2, BookOpen, Target, X, Bell, Palette, UserCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { buildUserDataExport, downloadAsJson } from '../lib/dataExport'
import { computeWeightTrend, goalOutlook } from '../lib/weightTrend'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import { THEME_DEFINITIONS, type ThemeId } from '../lib/levels'
import type { Profile, ActivityType } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import ActivityIcon from '../components/ActivityIcon'
import SportPickerModal from '../components/SportPickerModal'
import WeightLineChart from '../components/WeightLineChart'
import RecoveryEmailCard from '../components/RecoveryEmailCard'
import NotificationSettingsCard from '../components/NotificationSettingsCard'
import LanguageSettingsCard from '../components/LanguageSettingsCard'
import DeleteAccountModal from '../components/DeleteAccountModal'
import profileText from '../lib/i18n/profile'

// Roadmap v7, pilastro 01 "Non un modulo, una vetrina": tutto ciò che è
// configurazione privata (dati anagrafici, BMI, notifiche, lingua, temi,
// storico peso, guida, privacy/export/elimina account) vive qui, separato
// dalla vetrina identitaria di Profile.tsx (avatar, livello, bacheca
// medaglie, streak, "in numeri"). L'avatar resta in Profile.tsx: è
// un'azione sulla propria identità, non una preferenza di configurazione.

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

// Impostazioni raggruppate in 5 sezioni richiudibili (roadmap "PisoZone Next"
// P1-03): stesso pattern <details>/<summary> nativo già usato in Guide.tsx,
// ma qui il wrapper NON è a sua volta un .card — i figli sono già card
// autonome (RecoveryEmailCard, NotificationSettingsCard, ...), un altro .card
// attorno le impilerebbe in un doppio bordo.
function SettingsSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2.5 py-1 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        {icon}
        <span className="font-bebas text-2xl text-white tracking-wider flex-1">{title}</span>
        <ChevronDown size={18} className="text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-4 mt-3">{children}</div>
    </details>
  )
}

function bmiCategory(bmi: number): { label: string; color: string } {
  // Colori semantici della scala BMI (blu/verde/giallo/rosso): NON seguono il
  // tema — "Obeso" deve restare rosso anche con accento verde/blu/viola.
  if (bmi < 18.5) return { label: profileText.account.bmiUnderweight, color: '#60a5fa' }
  if (bmi < 25)   return { label: profileText.account.bmiNormal,      color: '#4ade80' }
  if (bmi < 30)   return { label: profileText.account.bmiOverweight,  color: '#facc15' }
  return             { label: profileText.account.bmiObese,           color: '#F44352' }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { profile, loading, updateProfile, refetch: refetchProfile } = useProfile()
  const { logs: weightLogs, addLog: addWeightLog } = useWeightLogs()
  const { setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sportPreferiti, setSportPreferiti] = useState<ActivityType[]>([])
  const [showSportPicker, setShowSportPicker] = useState(false)
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [loggingWeight, setLoggingWeight] = useState(false)
  const [weightLogError, setWeightLogError] = useState('')
  // Obiettivo peso (roadmap v3, pilastro 02): traguardo su profiles (v43),
  // proiezione calcolata dalla regressione sulle pesate recenti.
  const [goalInput, setGoalInput] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalError, setGoalError] = useState('')
  const [shopMsg, setShopMsg] = useState('')
  const [shopWorking, setShopWorking] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  // Fix P1-1 dell'audit tecnico del 24/07/2026: mancava un feedback di
  // successo, indistinguibile da un fallimento silenzioso su mobile.
  const [exportSuccess, setExportSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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

  const MAX_SPORT_PREFERITI = 6

  const toggleSport = (type: ActivityType) => {
    setSportPreferiti((prev) => {
      if (prev.includes(type)) return prev.filter((t) => t !== type)
      if (prev.length >= MAX_SPORT_PREFERITI) return prev
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
      setWeightLogError(profileText.weight.outOfRange)
      setTimeout(() => setWeightLogError(''), 3500)
      return
    }
    setLoggingWeight(true)
    setWeightLogError('')
    const { error } = await addWeightLog(weight)
    setLoggingWeight(false)
    if (error) {
      setWeightLogError(profileText.weight.saveFailed)
      setTimeout(() => setWeightLogError(''), 3500)
    }
  }

  // undefined = colonna weight_goal_kg assente (migrazione v43 non ancora
  // eseguita): la sezione obiettivo non compare e il campo resta fuori
  // dall'upsert del profilo, come da pattern dei flag one-shot.
  const weightGoal = profile?.weight_goal_kg
  const goalAvailable = weightGoal !== undefined

  const handleSetGoal = async () => {
    const value = Number(goalInput.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 20 || value >= 400) {
      setGoalError(profileText.weight.goal.outOfRange)
      setTimeout(() => setGoalError(''), 3500)
      return
    }
    setSavingGoal(true)
    setGoalError('')
    const { error } = await updateProfile({ weight_goal_kg: Math.round(value * 10) / 10 })
    setSavingGoal(false)
    if (error) {
      setGoalError(profileText.weight.goal.saveFailed)
      setTimeout(() => setGoalError(''), 3500)
    } else {
      setGoalInput('')
    }
  }

  const handleRemoveGoal = async () => {
    setSavingGoal(true)
    await updateProfile({ weight_goal_kg: null })
    setSavingGoal(false)
  }

  const showShopMsg = (msg: string) => {
    setShopMsg(msg)
    setTimeout(() => setShopMsg(''), 3000)
  }

  const handleExportData = async () => {
    if (!user || exporting) return
    setExporting(true)
    setExportError('')
    try {
      const data = await buildUserDataExport(user)
      downloadAsJson(data, `pisozone-dati-${format(new Date(), 'yyyy-MM-dd')}.json`)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3500)
    } catch {
      setExportError(profileText.privacy.exportFailed)
      setTimeout(() => setExportError(''), 3500)
    }
    setExporting(false)
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
    if (error) { showShopMsg(profileText.level.errorWithMessage(error.message)); return }
    if (!data.success) { showShopMsg(data.error ?? profileText.level.purchaseError); return }
    setTheme(themeId as ThemeId)
    showShopMsg(profileText.level.themeUnlockedActivated)
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

  const credits = profile?.credits ?? 0
  const unlockedThemes: string[] = profile?.unlocked_themes ?? ['dark', 'light']
  const activeTheme = profile?.active_theme ?? 'dark'

  const chartData = weightLogs.map((l) => ({
    date: format(parseISO(l.logged_at), 'd MMM', { locale: it }),
    peso: Number(l.weight_kg),
  }))

  // Proiezione verso l'obiettivo: trend dalle pesate recenti (regressione),
  // messaggio onesto se il trend è piatto, contrario o troppo lento.
  const weightTrend = computeWeightTrend(weightLogs)
  const outlook = weightGoal != null && weightTrend ? goalOutlook(weightTrend, Number(weightGoal)) : null
  const trendRate = weightTrend
    ? profileText.weight.goal.ratePerWeek(
        `${weightTrend.slopeKgPerWeek > 0 ? '+' : '−'}${Math.abs(weightTrend.slopeKgPerWeek).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`,
      )
    : ''
  let goalHint: string = profileText.weight.goal.needMoreData
  if (outlook) {
    if (outlook.kind === 'reached') goalHint = profileText.weight.goal.reached
    else if (outlook.kind === 'onTrack') {
      goalHint = `${profileText.weight.goal.onTrack(trendRate, format(outlook.etaDate, 'd MMMM', { locale: it }))} ${profileText.weight.goal.onTrackWeeks(Math.max(1, Math.round(outlook.days / 7)))}`
    } else if (outlook.kind === 'flat') goalHint = profileText.weight.goal.flat
    else if (outlook.kind === 'away') goalHint = profileText.weight.goal.away(trendRate)
    else goalHint = profileText.weight.goal.tooFar
  }

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
        <span className="font-bebas text-4xl text-white tracking-widest">{profileText.settingsPageTitle}</span>
        <div className="header-accent" />
      </div>

      <div className="space-y-3">

      <SettingsSection icon={<Lock size={18} className="text-[var(--red)] flex-shrink-0" />} title={profileText.settingsSections.account}>
        {/* Email di recupero (necessaria per il reset password) */}
        <RecoveryEmailCard />
      </SettingsSection>

      <SettingsSection icon={<Bell size={18} className="text-[var(--red)] flex-shrink-0" />} title={profileText.settingsSections.notifications}>
        <NotificationSettingsCard />
      </SettingsSection>

      <SettingsSection icon={<Palette size={18} className="text-[var(--red)] flex-shrink-0" />} title={profileText.settingsSections.appearance}>
        {/* Lingua (roadmap v3, pilastro 04): puramente client, nessuna colonna DB */}
        <LanguageSettingsCard />

        {/* ── TEMI ─────────────────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bebas text-xl tracking-wider" style={{ color: 'var(--red)' }}>{profileText.theme.title}</h2>
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
                      {profileText.theme.active}
                    </div>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleActivateTheme(td.id)}
                      disabled={shopWorking}
                      className="w-full text-xs py-1.5 rounded-lg font-medium transition-all"
                      style={{ background: 'var(--grey-light)', color: 'var(--color-text)' }}
                    >
                      {profileText.theme.activate}
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
                      {canAfford ? profileText.theme.unlock(td.cost) : profileText.creditsAmount(td.cost)}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {shopMsg && (
            <p className="text-sm text-center font-medium rounded-lg py-2 px-3" style={{ background: 'var(--grey)', color: 'var(--red)' }}>
              {shopMsg}
            </p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection icon={<UserCircle size={18} className="text-[var(--red)] flex-shrink-0" />} title={profileText.settingsSections.profile}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dati personali */}
        <div className="card space-y-4">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.account.formTitle}</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{profileText.account.nameLabel}</label>
            <input {...register('name')} className="input-dark" placeholder={profileText.account.namePlaceholder} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">{profileText.account.genderLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(prev => prev === g ? null : g)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    gender === g
                      ? 'border-[var(--red)] text-white bg-[var(--red)]/15'
                      : 'border-transparent text-gray-400 hover:border-gray-600'
                  }`}
                  style={{ background: gender === g ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                >
                  {g === 'male' ? profileText.account.genderMale : profileText.account.genderFemale}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              {profileText.account.genderHint}
            </p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs text-gray-400 mb-1">
              {profileText.account.birthDateLabel}
              {age !== null && age >= 0 && (
                <span className="ml-2 text-[var(--red)]">{profileText.account.ageSuffix(age)}</span>
              )}
            </label>
            <input type="date" {...register('birth_date')} className="input-dark w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="settings-height" className="block text-xs text-gray-400 mb-1">{profileText.account.heightLabel}</label>
              <input
                id="settings-height"
                type="number"
                {...register('height_cm', {
                  min: { value: 50, message: profileText.account.valueTooLow },
                  max: { value: 250, message: profileText.account.valueTooHigh },
                })}
                className="input-dark"
                placeholder="175"
                min={50}
                max={250}
              />
              {errors.height_cm && <p className="text-xs text-red-400 mt-1">{errors.height_cm.message}</p>}
            </div>
            <div>
              <label htmlFor="settings-weight" className="block text-xs text-gray-400 mb-1">{profileText.account.weightLabel}</label>
              <input
                id="settings-weight"
                type="number"
                step="0.1"
                {...register('weight_kg', {
                  min: { value: 20, message: profileText.account.valueTooLow },
                  max: { value: 400, message: profileText.account.valueTooHigh },
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
              <label className="block text-xs text-gray-400 mb-1">{profileText.account.weeklyGoalLabel}</label>
              <input type="number" {...register('weekly_goal')} className="input-dark" placeholder="3" min={1} max={14} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{profileText.account.dailyCalorieGoalLabel}</label>
              <input type="number" {...register('daily_calorie_goal')} className="input-dark" placeholder={profileText.account.dailyCalorieGoalPlaceholder} min={100} max={5000} />
            </div>
          </div>
        </div>

        {/* BMI */}
        {bmi !== null && bmiInfo && (
          <div className="card count-up" style={{ borderColor: bmiInfo.color }}>
            <h2 className="font-bebas text-xl tracking-wider mb-3" style={{ color: bmiInfo.color }}>{profileText.account.bmiTitle}</h2>
            <div className="flex items-end gap-3">
              <span className="font-bebas text-5xl" style={{ color: bmiInfo.color }}>{bmi.toFixed(1)}</span>
              <span className="text-sm text-gray-300 mb-1">{bmiInfo.label}</span>
            </div>
            <div className="progress-track mt-3 relative h-3 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full flex-[4]"   style={{ background: '#60a5fa' }} />
                <div className="h-full flex-[6.5]" style={{ background: '#4ade80' }} />
                <div className="h-full flex-[5]"   style={{ background: '#facc15' }} />
                <div className="h-full flex-[10]"  style={{ background: 'var(--red)' }} />
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

        {/* Sport preferiti: catalogo di 50 sport (roadmap "seleziona come
            Strava", 22/07/2026) — la scelta si fa nel modale con ricerca e
            categorie invece di una griglia enorme, vedi SportPickerModal. */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.account.sportTitle}</h2>
            <span className="text-xs text-gray-500">{profileText.account.sportSelectedCount(sportPreferiti.length, MAX_SPORT_PREFERITI)}</span>
          </div>
          <p className="text-xs text-gray-500">{profileText.account.sportHint(MAX_SPORT_PREFERITI)}</p>
          {sportPreferiti.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {sportPreferiti.map((s) => {
                const opt = ACTIVITY_OPTIONS.find((o) => o.value === s)
                if (!opt) return null
                return (
                  <span key={s} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full text-[white] font-medium bg-[var(--red)]">
                    <ActivityIcon type={opt.value} size={14} />
                    {opt.label}
                  </span>
                )
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowSportPicker(true)}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-medium tap"
            style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
          >
            {profileText.account.editSportButton}
          </button>
        </div>

        {showSportPicker && (
          <SportPickerModal
            mode="multi"
            favorites={sportPreferiti}
            selected={sportPreferiti}
            onToggle={toggleSport}
            max={MAX_SPORT_PREFERITI}
            onClose={() => setShowSportPicker(false)}
          />
        )}

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={saving}>
          {saved ? (
            <span className="count-up">{profileText.account.saved}</span>
          ) : (
            <>
              <Save size={18} />
              {saving ? profileText.account.saving : profileText.account.save}
            </>
          )}
        </button>
      </form>

      {/* Storico peso */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-[var(--red)]" />
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.weight.title}</h2>
          </div>
          {weight && (
            <button
              type="button"
              onClick={handleLogWeight}
              disabled={loggingWeight}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-[white] tap disabled:opacity-50 bg-[var(--red)]"
            >
              <TrendingUp size={13} />
              {loggingWeight ? profileText.weight.saveButtonSaving : profileText.weight.saveButton(weight)}
            </button>
          )}
        </div>

        {weightLogError && (
          <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--red)' }}>
            {weightLogError}
          </p>
        )}

        {chartData.length < 2 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {chartData.length === 0
              ? profileText.weight.emptyHint
              : profileText.weight.needMoreEntries}
          </p>
        ) : (
          <WeightLineChart
            points={chartData.map((d) => ({ label: d.date, value: d.peso }))}
            ariaLabel={profileText.weight.chartAriaLabel}
            referenceValue={weightGoal != null ? Number(weightGoal) : null}
            referenceLabel={weightGoal != null ? profileText.weight.goal.chartLineLabel : undefined}
            formatValue={(v) => profileText.weight.tooltipValue(v)}
            height={160}
          />
        )}

        {chartData.length > 0 && (
          <p className="text-xs text-gray-600 text-center">
            {profileText.weight.entriesCount(chartData.length)}
          </p>
        )}

        {/* Obiettivo peso con proiezione (v43): compare solo a colonna presente */}
        {goalAvailable && (
          <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--grey)' }}>
            {weightGoal == null ? (
              <div className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <label htmlFor="weight-goal" className="block text-xs text-gray-400 mb-1">
                    {profileText.weight.goal.inputLabel}
                  </label>
                  <input
                    id="weight-goal"
                    type="number"
                    step="0.1"
                    min={20}
                    max={400}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="input-dark w-full"
                    placeholder={profileText.weight.goal.inputPlaceholder}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSetGoal}
                  disabled={savingGoal || goalInput === ''}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  {profileText.weight.goal.setButton}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Target size={14} className="text-[var(--red)]" />
                    {profileText.weight.goal.badge(Number(weightGoal))}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveGoal}
                    disabled={savingGoal}
                    aria-label={profileText.weight.goal.removeAria}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{goalHint}</p>
              </>
            )}
            {goalError && (
              <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--red)' }}>
                {goalError}
              </p>
            )}
          </div>
        )}
      </div>
      </SettingsSection>

      <SettingsSection icon={<ShieldCheck size={18} className="text-[var(--red)] flex-shrink-0" />} title={profileText.settingsSections.dataHelp}>
        {/* Guida: la wiki di tutte le funzionalità */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--red)]" />
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.guide.title}</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{profileText.guide.body}</p>
          <Link
            to="/guide"
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-medium tap"
            style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
          >
            <BookOpen size={15} />
            {profileText.guide.button}
          </Link>
        </div>

        {/* Privacy e dati (GDPR: portabilità + cancellazione) */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--red)]" />
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.privacy.title}</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {profileText.privacy.body}
          </p>
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="text-[var(--red)] underline">{profileText.privacy.privacyPolicyLink}</Link>
            <Link to="/termini" className="text-[var(--red)] underline">{profileText.privacy.termsLink}</Link>
          </div>
          {exportSuccess && (
            <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80' }}>
              {profileText.privacy.exportSuccess}
            </p>
          )}
          {exportError && (
            <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--red)' }}>
              {exportError}
            </p>
          )}
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-medium tap disabled:opacity-50"
            style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
          >
            <Download size={15} />
            {exporting ? profileText.privacy.exportingButton : profileText.privacy.exportButton}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-medium tap"
            style={{ border: '1px solid rgba(var(--accent-rgb),0.5)', color: 'var(--red)', background: 'rgba(var(--accent-rgb),0.08)' }}
          >
            <Trash2 size={15} />
            {profileText.privacy.deleteAccountButton}
          </button>
        </div>
      </SettingsSection>

      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  )
}
