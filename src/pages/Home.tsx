import { useEffect, useMemo, useState } from 'react'
import { format, subDays, startOfWeek, parseISO, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'
import { Flame, Zap, Trophy, ChevronRight, Plus, Users, Target, CheckCircle2, CloudOff, RotateCcw, X, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActivities } from '../hooks/useActivities'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { useRecovery } from '../hooks/useRecovery'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { usePersonalGoals } from '../hooks/usePersonalGoals'
import { useDailyChallenges } from '../hooks/useDailyChallenges'
import { ACTIVITY_OPTIONS, MEDALS, activityLabel } from '../lib/constants'
import { computeStats } from '../lib/achievementStats'
import { getPlanTemplate, computePlanProgress, suggestPlan, isPlanSuggestionDismissed, dismissPlanSuggestion } from '../lib/plans'
import { calcStreak, calcStreakSavedByFreeze } from '../lib/challenges'
import { daysSinceLastActivity, isComeback } from '../lib/comeback'
import { secondWorkoutNudge } from '../lib/secondWorkoutNudge'
import { getZoneByPercent } from '../lib/zones'
import { isPendingActivityId } from '../lib/offlineQueue'
import { prefillFromActivity } from '../lib/quickLog'
import { haptic } from '../lib/haptics'
import { pushSupported, isSubscribed } from '../lib/push'
import { computeReadiness } from '../lib/readiness'
import SkeletonCard from '../components/SkeletonCard'
import PushNotificationPrompt from '../components/PushNotificationPrompt'
import ComebackCard from '../components/ComebackCard'
import ReadinessCard from '../components/ReadinessCard'
import RecoveryCard from '../components/RecoveryCard'
import GoalsCard from '../components/GoalsCard'
import PisoRing from '../components/PisoRing'
import AnimatedNumber from '../components/AnimatedNumber'
import ActivityIcon from '../components/ActivityIcon'
import MedalIcon from '../components/MedalIcon'
import ContextualTip from '../components/ContextualTip'
import StreakInfoModal from '../components/StreakInfoModal'
import PwaInstallPrompt from '../components/PwaInstallPrompt'
import home from '../lib/i18n/home'
import common from '../lib/i18n/common'
import plansText from '../lib/i18n/plans'

// Etichetta di capitolo: raggruppa la Home in una storia leggibile scorrendo
// (roadmap v2, pilastro 01 punto 6) invece di una pila indifferenziata di
// card. Va sopra sezioni il cui contenuto non è già autoesplicativo dal
// titolo della card stessa.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-gray-600 tracking-[0.2em] uppercase font-semibold px-1">
      {children}
    </p>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, refetch: refetchProfile, updateProfile } = useProfile()
  const { activities, loading: actsLoading, refetch: refetchActivities } = useActivities()
  const { entries: lbEntries, hasFriends } = useLeaderboard()
  const { frozenDates, freeze, freezing } = useStreakFreeze()
  const { logs: recoveryLogs, restDates, patchDay } = useRecovery()
  const { activeEnrollment, completedKeys } = useTrainingPlan()
  const { goals, working: goalsWorking, addGoal, deleteGoal } = usePersonalGoals()
  const navigate = useNavigate()
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [showStreakInfo, setShowStreakInfo] = useState(false)
  const { indicator: pullIndicator, handlers: pullHandlers } = usePullToRefresh(
    () => Promise.all([refetchActivities(), refetchProfile()]),
  )

  // Utenti con un account creato prima dell'introduzione delle push non sanno
  // che esistono: mostra la scelta esplicita una sola volta (push_prompt_seen
  // in profiles), senza ripresentarla in futuro qualunque sia la risposta.
  useEffect(() => {
    if (profileLoading || !profile || profile.push_prompt_seen || !pushSupported()) return
    let cancelled = false
    isSubscribed().then((subscribed) => {
      if (cancelled) return
      if (subscribed) updateProfile({ push_prompt_seen: true })
      else setShowPushPrompt(true)
    })
    return () => { cancelled = true }
  }, [profileLoading, profile, updateProfile])

  const username: string = (user?.user_metadata?.username as string) || home.athleteFallback

  const hour = new Date().getHours()
  const greeting = home.greeting(hour)
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: it })

  // I giorni di riposo intenzionali (recovery_logs, v33) proteggono la streak
  // come i freeze: entrano in calcStreak insieme alle frozenDates.
  const streak = useMemo(
    () => calcStreak(activities, [...frozenDates, ...restDates]),
    [activities, frozenDates, restDates],
  )

  // Streak freeze offer: yesterday had no activity, not already frozen or
  // rest day, and freeze would save a REAL streak (guardia P0-3 dell'audit
  // tecnico del 24/07/2026, vedi calcStreakSavedByFreeze in lib/challenges.ts).
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const streakSavedByFreeze = useMemo(
    () => calcStreakSavedByFreeze(activities, frozenDates, restDates),
    [activities, frozenDates, restDates],
  )
  const showFreezeOffer = streakSavedByFreeze > 0
  const canAffordFreeze = (profile?.credits ?? 0) >= 300

  async function handleFreeze() {
    const result = await freeze(yesterday)
    if (result.success) {
      haptic('success')
      refetchProfile()
    }
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekActivities = useMemo(
    () => activities.filter((a) => {
      const d = parseISO(a.date)
      return isAfter(d, weekStart) || d >= weekStart
    }),
    [activities, weekStart]
  )
  const weeklyGoal = profile?.weekly_goal ?? 3
  const weekPctRaw = weeklyGoal > 0 ? (weekActivities.length / weeklyGoal) * 100 : 0
  const weekDone = weekActivities.length >= weeklyGoal

  const todayPrefix = format(new Date(), 'yyyy-MM-dd')
  const todayActivities = useMemo(
    () => activities.filter((a) => a.date.startsWith(todayPrefix)),
    [activities, todayPrefix]
  )
  const todayCalories = todayActivities.reduce((s, a) => s + (a.calories ?? 0), 0)
  const dailyCalGoal = profile?.daily_calorie_goal ?? null
  const calPctRaw = dailyCalGoal ? (todayCalories / dailyCalGoal) * 100 : 0
  const calDone = dailyCalGoal != null && todayCalories >= dailyCalGoal

  // PisoRing: cap visivo dello streak a 30 giorni, la stessa soglia della
  // medaglia diamante "Inarrestabile" — un anello pieno è un traguardo raro.
  const streakPctRaw = Math.min((streak / 30) * 100, 100)
  const weekZone = getZoneByPercent(weekPctRaw)
  const calZone = getZoneByPercent(calPctRaw)
  const streakZone = getZoneByPercent(streakPctRaw)

  const lastActivity = activities[0] ?? null
  const lastOpt = lastActivity ? ACTIVITY_OPTIONS.find((o) => o.value === lastActivity.type) : null

  // Spinta verso il secondo allenamento (P2-06): i giorni 1-7 con 1-2
  // attività sono il momento a più alto rischio di abbandono. Non una card
  // separata — "Attività recente" ha già il bottone "Ripeti" (Log lampo):
  // costruirne un'altra sarebbe ridondante. Un tip contestuale one-shot
  // rimanda proprio a quel bottone, invece di ripetere la stessa funzione.
  const secondWorkout = useMemo(() => secondWorkoutNudge(activities), [activities])

  // Rientro morbido (pilastro 04): da 4 giorni di assenza in su
  const absenceDays = useMemo(() => daysSinceLastActivity(activities), [activities])

  // Stessa fonte della pagina Sfide (hook condiviso): eligibility + riscatti dal DB
  const { challenges: todayChallenges } = useDailyChallenges(activities, streak)
  const completedChallenges = todayChallenges.filter((c) => c.eligible).length

  // Programma di allenamento attivo (v34): avanzamento derivato dalle attività
  const activePlanTemplate = activeEnrollment ? getPlanTemplate(activeEnrollment.plan_key) : undefined
  const planProgress = useMemo(
    () => (activeEnrollment && activePlanTemplate
      ? computePlanProgress(activePlanTemplate, activeEnrollment.started_on, activities)
      : null),
    [activeEnrollment, activePlanTemplate, activities],
  )

  // Suggerimento contestuale di un programma (P2-04, roadmap "PisoZone
  // Next"): solo se non già iscritto a uno, dopo qualche attività ripetuta
  // dello stesso sport — non alla prima occhiata, non a intuito.
  const [suggestionDismissTick, setSuggestionDismissTick] = useState(0)
  const suggestedPlan = useMemo(() => {
    if (activeEnrollment) return null
    const plan = suggestPlan(activities, completedKeys)
    if (plan && isPlanSuggestionDismissed(plan.key)) return null
    return plan
  }, [activeEnrollment, activities, completedKeys, suggestionDismissTick])

  // Punteggio di Prontezza (roadmap v4, pilastro 01, FLAGSHIP): sintesi di
  // sforzo percepito, carico settimanale, sonno e riposo — tutti dati già
  // raccolti altrove in questa stessa pagina.
  const readiness = useMemo(
    () => computeReadiness(activities, [...recoveryLogs.values()]),
    [activities, recoveryLogs],
  )

  const stats = useMemo(() => computeStats(activities, weeklyGoal), [activities, weeklyGoal])
  const nearestMedal = useMemo(() => {
    return MEDALS
      .map((m) => {
        const { current, target } = m.checkProgress(stats)
        return { medal: m, pct: current / target }
      })
      .filter((x) => x.pct < 1 && x.pct > 0)
      .sort((a, b) => b.pct - a.pct)[0] ?? null
  }, [stats])

  if (profileLoading || actsLoading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="page-enter relative p-4 pb-24 space-y-4 max-w-lg mx-auto" {...pullHandlers}>
      {pullIndicator}
      {/* Bagliore ambientale: la Home come vetrina dell'identità */}
      <div className="hero-glow" aria-hidden="true" />

      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm capitalize">{todayLabel}</p>
        <h1 className="font-bebas text-4xl text-white tracking-wider mt-0.5">
          {greeting},{' '}
          <span className="text-[var(--red)]">{username}</span>!
        </h1>
        <div className="header-accent" />
      </div>

      {/* PisoRing: obiettivo settimanale, calorie di oggi e streak in un solo sguardo */}
      <div className="card card-hero flex flex-col items-center py-6">
        <PisoRing
          rings={[
            { key: 'week', pct: weekPctRaw, color: weekZone.cssVar },
            { key: 'cal', pct: dailyCalGoal ? calPctRaw : 0, color: calZone.cssVar },
            { key: 'streak', pct: streakPctRaw, color: streakZone.cssVar },
          ]}
          srSummary={home.ring.srSummary(weekActivities.length, weeklyGoal, todayCalories, streak)}
          center={
            <>
              <span className="font-bebas text-4xl text-white leading-none">
                <AnimatedNumber value={weekPctRaw} /><span className="text-lg text-gray-500">%</span>
              </span>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">{home.ring.centerLabel}</span>
            </>
          }
        />

        <p className={`text-xs mt-4 ${weekDone ? 'text-green-400' : 'text-gray-500'}`}>
          {weekDone ? home.weekGoalReached : home.weekGoalRemaining(weeklyGoal - weekActivities.length)}
        </p>

        <div className="w-full grid gap-2.5 mt-4">
          <div className="flex items-center gap-2.5">
            <Target size={15} style={{ color: weekZone.cssVar }} className="flex-shrink-0" />
            <span className="text-xs text-gray-400 flex-1 truncate">{home.weeklyGoalLabel}</span>
            <span className="text-xs font-semibold text-white flex-shrink-0">{weekActivities.length}/{weeklyGoal}</span>
            {weekDone && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5">
            <Zap size={15} style={{ color: dailyCalGoal ? calZone.cssVar : 'var(--grey-light)' }} className="flex-shrink-0" />
            <span className="text-xs text-gray-400 flex-1 truncate">{home.dailyCalorieGoal.title}</span>
            <span className="text-xs font-semibold text-white flex-shrink-0">
              {todayCalories}{dailyCalGoal ? home.dailyCalorieGoal.suffix(dailyCalGoal) : home.dailyCalorieGoal.noGoalSuffix}
            </span>
            {calDone && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5">
            <Flame
              size={15}
              style={{
                color: streakZone.cssVar,
                filter: streak > 0 ? `drop-shadow(0 0 5px ${streakZone.cssVar})` : 'none',
              }}
              className="flex-shrink-0"
            />
            <span className="text-xs text-gray-400 flex-1 truncate">{home.ring.streakLabel}</span>
            <span className="text-xs font-semibold text-white flex-shrink-0">{home.ring.streakDaysLabel(streak)}</span>
            <button
              type="button"
              onClick={() => setShowStreakInfo(true)}
              aria-label={home.ring.streakInfoAria}
              className="p-0.5 -m-0.5 text-gray-600 hover:text-[var(--red)] transition-colors flex-shrink-0"
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* Micro-spiegazione alla prima attivazione (P2-05, roadmap "PisoZone
            Next"): one-shot (localStorage) alla prima volta che lo streak è
            attivo, non necessariamente il primo giorno esatto — un utente
            potrebbe non riaprire l'app proprio a streak=1, e aspettare quel
            valore esatto rischierebbe di non mostrarla mai. */}
        {streak >= 1 && (
          <ContextualTip
            tipId="streak"
            icon="🔥"
            title={home.streakFirstTip.title}
            text={home.streakFirstTip.text}
            className="w-full mt-3"
          />
        )}
      </div>

      {/* Punteggio di Prontezza (roadmap v4, pilastro 01, FLAGSHIP) */}
      <div className="space-y-2">
        <SectionLabel>{home.sections.readiness}</SectionLabel>
        <ReadinessCard readiness={readiness} />
      </div>

      {/* Bentornato: rientro morbido dopo un'assenza (pilastro 04) */}
      {isComeback(absenceDays) && <ComebackCard days={absenceDays!} />}

      {/* Streak freeze offer */}
      {showFreezeOffer && (
        <div className="card border border-blue-500/40">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🧊</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-300 text-sm">{home.freezeOffer.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {home.freezeOffer.prefix}{' '}
                <span className="text-white font-medium">
                  {streakSavedByFreeze} {home.freezeOffer.dayUnit(streakSavedByFreeze)}
                </span>{' '}
                {home.freezeOffer.suffix}
              </p>
              <button
                type="button"
                onClick={handleFreeze}
                disabled={!canAffordFreeze || freezing}
                className={`mt-2.5 text-xs px-3 py-1.5 rounded-lg font-medium border tap ${
                  canAffordFreeze
                    ? 'text-blue-300 border-blue-500/50 hover:bg-blue-500/10'
                    : 'text-gray-500 border-gray-700 cursor-not-allowed'
                }`}
              >
                {freezing
                  ? home.freezeOffer.freezing
                  : canAffordFreeze
                  ? home.freezeOffer.freezeButton
                  : home.freezeOffer.insufficientCredits(profile?.credits ?? 0)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recupero di oggi: riposo, idratazione, sonno (roadmap v2, pilastro 02 punto 5) */}
      <div className="space-y-2">
        <SectionLabel>{home.sections.recovery}</SectionLabel>
        <RecoveryCard
          todayLog={recoveryLogs.get(todayPrefix)}
          restDates={restDates}
          today={todayPrefix}
          onPatch={(patch) => patchDay(todayPrefix, patch)}
        />
      </div>

      {/* Attività recente */}
      <div className="space-y-2">
        <SectionLabel>{home.sections.recent}</SectionLabel>
        {lastActivity && lastOpt && secondWorkout && (
          <ContextualTip
            tipId="secondWorkout"
            icon="🚀"
            title={secondWorkout.kind === 'tryGps' ? home.secondWorkout.tryGpsTitle : home.secondWorkout.repeatTitle}
            text={
              secondWorkout.kind === 'tryGps'
                ? home.secondWorkout.tryGpsBody(activityLabel(lastActivity.type, lastActivity.indoor))
                : home.secondWorkout.repeatBody(activityLabel(lastActivity.type, lastActivity.indoor))
            }
          />
        )}
        {lastActivity && lastOpt ? (
          <div className="card space-y-3">
            <button
              type="button"
              className="w-full text-left"
              onClick={() => navigate('/calendar', { viewTransition: true })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{home.lastActivity.title}</span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--grey-light)' }}
                >
                  <ActivityIcon type={lastOpt.value} size={24} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{activityLabel(lastActivity.type, lastActivity.indoor)}</p>
                    {isPendingActivityId(lastActivity.id) && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-gray-400 flex items-center gap-1 flex-shrink-0"
                        style={{ background: 'rgba(148,163,184,0.15)' }}
                      >
                        <CloudOff size={9} /> {common.pendingSyncBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {home.lastActivity.meta(lastActivity.duration_min, lastActivity.calories, lastActivity.distance_km)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 flex-shrink-0">
                  {format(parseISO(lastActivity.date), 'd MMM', { locale: it })}
                </p>
              </div>
            </button>
            {/* Log lampo (roadmap v3, pilastro 02): il form di Registra si apre
                già compilato con sport, durata, distanza e indoor di questa
                attività — data/ora di adesso, calorie di nuovo automatiche. */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-medium tap"
              style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--red)' }}
              onClick={() => navigate('/log', { state: { quickLog: prefillFromActivity(lastActivity) }, viewTransition: true })}
            >
              <RotateCcw size={14} />
              {home.lastActivity.repeat}
            </button>
          </div>
        ) : (
          <div className="card text-center py-10">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--grey-light)' }}
            >
              <ActivityIcon type="palestra" size={56} />
            </div>
            <p className="font-bebas text-2xl text-white tracking-wider mb-1">{home.emptyState.title}</p>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              {home.emptyState.body}
            </p>
            <button className="btn-primary px-8 py-2.5 text-sm" onClick={() => navigate('/log', { viewTransition: true })}>
              {home.emptyState.cta}
            </button>
          </div>
        )}
      </div>

      {/* Il tuo percorso: programma di allenamento + medaglia più vicina */}
      <div className="space-y-2">
        <SectionLabel>{home.sections.progress}</SectionLabel>

        {activeEnrollment && activePlanTemplate && planProgress ? (
          <button
            type="button"
            className="card tap w-full text-left"
            onClick={() => navigate('/plans', { viewTransition: true })}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{plansText.homeWidget.title}</span>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(var(--accent-rgb),0.12)' }}
                aria-hidden="true"
              >
                {activePlanTemplate.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-lg text-white leading-tight">{activePlanTemplate.title}</p>
                <p className="text-xs text-gray-400">
                  {planProgress.completed
                    ? plansText.homeWidget.completedHint
                    : planProgress.expired
                    ? plansText.homeWidget.expiredHint
                    : plansText.homeWidget.weekOf(planProgress.currentWeek, activePlanTemplate.weeks)}
                </p>
                <div className="progress-track mt-1.5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(planProgress.doneCount / planProgress.totalCount) * 100}%`,
                      background: getZoneByPercent((planProgress.doneCount / planProgress.totalCount) * 100).cssVar,
                      transition: 'width 0.7s',
                    }}
                  />
                </div>
              </div>
              <span className="font-bebas text-xl text-[var(--red)] flex-shrink-0">
                {plansText.homeWidget.sessionsShort(planProgress.doneCount, planProgress.totalCount)}
              </span>
            </div>
          </button>
        ) : suggestedPlan ? (
          <div className="card tap relative">
            <button
              type="button"
              className="w-full text-left"
              onClick={() => navigate('/plans', { viewTransition: true })}
            >
              <div className="flex items-center justify-between mb-2 pr-6">
                <span className="text-xs text-gray-400">{plansText.homeWidget.suggestLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(var(--accent-rgb),0.12)' }}
                  aria-hidden="true"
                >
                  {suggestedPlan.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bebas text-lg text-white leading-tight">{suggestedPlan.title}</p>
                  <p className="text-xs text-gray-400">{suggestedPlan.tagline}</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                dismissPlanSuggestion(suggestedPlan.key)
                setSuggestionDismissTick((t) => t + 1)
              }}
              aria-label={plansText.homeWidget.suggestDismissAria}
              className="absolute top-3 right-3 p-1 -m-1 text-gray-600 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="card tap w-full text-left"
            onClick={() => navigate('/plans', { viewTransition: true })}
          >
            <div className="flex items-center gap-3">
              <Target size={22} className="text-gray-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">{plansText.homeWidget.discoverTitle}</p>
                <p className="text-xs text-gray-600">{plansText.homeWidget.discoverBody}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 ml-auto flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Obiettivi personali (v36): mete libere con barra di avanzamento */}
        <GoalsCard
          goals={goals}
          activities={activities}
          working={goalsWorking}
          onCreate={addGoal}
          onDelete={deleteGoal}
        />

        {nearestMedal && (
          <button
            type="button"
            className="card tap w-full text-left"
            onClick={() => navigate('/medals', { viewTransition: true })}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-[var(--red)]" />
                <span className="text-xs text-gray-400">{home.nearestMedal.title}</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0">
                <MedalIcon medalKey={nearestMedal.medal.key} size={44} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-lg text-white leading-tight">{nearestMedal.medal.name}</p>
                <p className="text-xs text-gray-400 truncate">{nearestMedal.medal.description}</p>
                <div className="progress-track mt-1.5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${nearestMedal.pct * 100}%`,
                      background: 'linear-gradient(90deg,var(--red),#FF5E63)',
                      transition: 'width 0.7s',
                    }}
                  />
                </div>
              </div>
              <span className="font-bebas text-xl text-[var(--red)] flex-shrink-0">
                {Math.round(nearestMedal.pct * 100)}%
              </span>
            </div>
          </button>
        )}
      </div>

      {/* La tua cerchia: classifica settimanale */}
      <div className="space-y-2">
        <SectionLabel>{home.sections.circle}</SectionLabel>
        {hasFriends ? (
          <button
            type="button"
            className="card tap w-full text-left"
            onClick={() => navigate('/social', { state: { tab: 'classifica' }, viewTransition: true })}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[var(--red)]" />
                <span className="text-xs text-gray-400">{home.leaderboard.title}</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
            <div className="space-y-2">
              {lbEntries.slice(0, 3).map((entry, i) => (
                <div key={entry.user_id} className="flex items-center gap-3">
                  <span className={`font-bebas text-lg w-5 text-center ${i === 0 ? 'text-[var(--red)]' : 'text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.isMe ? 'text-[var(--red)]' : 'text-white'}`}>
                      {entry.username}{entry.isMe ? home.leaderboard.youSuffix : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{home.leaderboard.caloriesLabel(entry.calories)}</p>
                    <p className="text-xs text-gray-500">{home.leaderboard.sessionsLabel(entry.count)}</p>
                  </div>
                </div>
              ))}
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="card tap w-full text-left"
            onClick={() => navigate('/social', { state: { tab: 'friends' }, viewTransition: true })}
          >
            <div className="flex items-center gap-3">
              <Users size={22} className="text-gray-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">{home.leaderboard.addFriendsTitle}</p>
                <p className="text-xs text-gray-600">{home.leaderboard.addFriendsBody}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 ml-auto flex-shrink-0" />
            </div>
          </button>
        )}
      </div>

      {/* Daily challenges widget */}
      <button
        type="button"
        className="card w-full text-left"
        onClick={() => navigate('/challenges', { viewTransition: true })}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[var(--red)]" />
            <span className="text-xs text-gray-400">{home.challengesWidget.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-yellow-400">
              {home.challengesWidget.progress(completedChallenges, todayChallenges.length)}
            </span>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
        </div>
        <div className="space-y-2">
          {todayChallenges.map(({ template: c, eligible, claimed }) => (
            <div key={c.key} className="flex items-center gap-2.5">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${eligible ? '' : 'grayscale opacity-40'}`}
                style={{ background: eligible ? 'rgba(74,222,128,0.15)' : 'rgba(var(--accent-rgb),0.1)' }}
              >
                {c.icon}
              </span>
              <span className={`text-xs flex-1 truncate ${eligible ? 'text-green-400 line-through' : 'text-gray-400'}`}>
                {c.title}
              </span>
              {claimed
                ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                : eligible
                  ? <span className="text-xs font-semibold text-yellow-400 flex-shrink-0">{home.challengesWidget.claimLabel(c.credits)}</span>
                  : <span className="text-xs text-yellow-500 flex-shrink-0">{home.challengesWidget.pendingLabel(c.credits)}</span>
              }
            </div>
          ))}
        </div>
      </button>

      {/* CTA */}
      <button
        type="button"
        className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        onClick={() => navigate('/log', { viewTransition: true })}
      >
        <Plus size={18} />
        {home.cta}
      </button>

      {showPushPrompt && user && (
        <PushNotificationPrompt userId={user.id} onDone={() => setShowPushPrompt(false)} />
      )}
      {showStreakInfo && <StreakInfoModal onClose={() => setShowStreakInfo(false)} />}
      <PwaInstallPrompt show={activities.length > 0} />
    </div>
  )
}
