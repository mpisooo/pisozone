import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { CheckCircle2, Circle, Lock, Trophy, AlertTriangle } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { useProfile } from '../hooks/useProfile'
import { PLAN_CATALOG, getPlanTemplate, computePlanProgress } from '../lib/plans'
import { buildTrainingLoadSeries, loadJumpPct } from '../lib/trainingLoad'
import { computePlanCoachAdvice } from '../lib/planCoach'
import { getZoneByPercent } from '../lib/zones'
import { haptic } from '../lib/haptics'
import SkeletonCard from '../components/SkeletonCard'
import plansText from '../lib/i18n/plans'

export default function PlansPage() {
  const { activities, loading: actsLoading } = useActivities()
  const { refetch: refetchProfile } = useProfile()
  const {
    activeEnrollment, completedKeys, loading: planLoading, working,
    startPlan, abandonPlan, claimCompletion,
  } = useTrainingPlan()
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [claimedCredits, setClaimedCredits] = useState(0)

  const activeTemplate = activeEnrollment ? getPlanTemplate(activeEnrollment.plan_key) : undefined
  const progress = useMemo(
    () => (activeEnrollment && activeTemplate
      ? computePlanProgress(activeTemplate, activeEnrollment.started_on, activities)
      : null),
    [activeEnrollment, activeTemplate, activities],
  )

  const activitiesById = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  )

  const pct = progress ? (progress.doneCount / progress.totalCount) * 100 : 0
  const zone = getZoneByPercent(pct)

  // Coach automatico (roadmap v4, pilastro 01): incrocia l'avanzamento del
  // piano col carico settimanale, entrambi già calcolati altrove.
  const coachAdvice = useMemo(() => {
    if (!progress) return null
    const loadJump = loadJumpPct(buildTrainingLoadSeries(activities))
    return computePlanCoachAdvice(progress, loadJump)
  }, [progress, activities])

  async function handleClaim() {
    if (!activeEnrollment || !activeTemplate) return
    const ok = await claimCompletion(activeEnrollment.id, activeTemplate.credits)
    if (ok) {
      haptic('celebrate')
      refetchProfile()
      setClaimedCredits(activeTemplate.credits)
      setTimeout(() => setClaimedCredits(0), 4000)
    }
  }

  async function handleAbandon() {
    if (!confirmAbandon) { setConfirmAbandon(true); return }
    if (!activeEnrollment) return
    const ok = await abandonPlan(activeEnrollment.id)
    if (ok) haptic('light')
    setConfirmAbandon(false)
  }

  async function handleStart(planKey: string) {
    const ok = await startPlan(planKey)
    if (ok) {
      haptic('success')
      window.scrollTo({ top: 0 })
    }
  }

  if (actsLoading || planLoading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  // Sessioni raggruppate per settimana, per la card del programma attivo
  const weekGroups = progress && activeTemplate
    ? Array.from({ length: activeTemplate.weeks }, (_, i) => ({
        week: i + 1,
        sessions: progress.sessions.filter((s) => s.template.week === i + 1),
      }))
    : []

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{plansText.pageTitle}</span>
        <div className="header-accent" />
        <p className="text-xs text-gray-500 mt-2">{plansText.pageSubtitle}</p>
      </div>

      {/* Programma attivo */}
      {activeEnrollment && activeTemplate && progress && (
        <div className="card card-hero space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-4xl flex-shrink-0" aria-hidden="true">{activeTemplate.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">{plansText.active.heading}</p>
              <p className="font-bebas text-2xl text-white leading-tight">{activeTemplate.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {plansText.active.weekOf(progress.currentWeek, activeTemplate.weeks)}
                {' · '}
                {plansText.active.endsOn(format(parseISO(progress.endsOn), 'd MMMM', { locale: it }))}
              </p>
            </div>
            <span className="font-bebas text-2xl flex-shrink-0" style={{ color: zone.cssVar }}>
              {progress.doneCount}<span className="text-sm text-gray-500">/{progress.totalCount}</span>
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: zone.cssVar, transition: 'width 0.6s var(--ease-out)' }}
            />
          </div>

          {progress.completed && (
            <div className="rounded-xl p-4 text-center space-y-3" style={{ background: 'rgba(74,222,128,0.1)' }}>
              <p className="font-bebas text-2xl text-green-400 tracking-wider">{plansText.active.completedBanner}</p>
              <button
                type="button"
                onClick={handleClaim}
                disabled={working}
                className="btn-save w-full rounded-xl py-3 font-bebas text-xl tracking-widest text-white disabled:opacity-60"
              >
                {working ? plansText.active.claiming : plansText.active.claimButton(activeTemplate.credits)}
              </button>
            </div>
          )}

          {coachAdvice && (
            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(251,191,36,0.1)' }}>
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium">
                  {coachAdvice.kind === 'load_conflict'
                    ? plansText.active.coach.loadConflictTitle
                    : plansText.active.coach.behindTitle(coachAdvice.missedSessions)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {coachAdvice.kind === 'load_conflict'
                    ? plansText.active.coach.loadConflictHint
                    : plansText.active.coach.behindHint}
                </p>
              </div>
            </div>
          )}

          {progress.expired && (
            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(251,191,36,0.1)' }}>
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium">{plansText.active.expiredBanner}</p>
                <p className="text-xs text-gray-400 mt-0.5">{plansText.active.expiredHint}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {weekGroups.map(({ week, sessions }) => {
              const isCurrent = week === progress.currentWeek && !progress.expired
              const isFuture = week > progress.currentWeek
              return (
                <div key={week}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className={`text-[10px] tracking-widest uppercase font-semibold ${isCurrent ? 'text-white' : 'text-gray-600'}`}>
                      {plansText.active.weekLabel(week)}
                    </p>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--red)' }}>
                        {plansText.active.currentWeekTag}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {sessions.map((s, i) => {
                      const matched = s.activityId ? activitiesById.get(s.activityId) : null
                      const backlog = !s.done && week < progress.currentWeek
                      return (
                        <div
                          key={`${week}-${i}`}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${isFuture ? 'opacity-45' : ''}`}
                          style={{ background: 'var(--grey)' }}
                        >
                          {s.done
                            ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                            : isFuture
                            ? <Lock size={14} className="text-gray-600 flex-shrink-0" />
                            : <Circle size={16} className={`flex-shrink-0 ${backlog ? 'text-amber-400' : 'text-gray-500'}`} />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${s.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                              {s.template.label}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {plansText.active.sessionMeta(s.template.minMinutes, s.template.minKm)}
                            </p>
                          </div>
                          {s.done && matched && (
                            <span className="text-[10px] text-green-400/80 flex-shrink-0">
                              {plansText.active.doneOn(format(parseISO(matched.date), 'd MMM', { locale: it }))}
                            </span>
                          )}
                          {backlog && (
                            <span className="text-[10px] text-amber-400 flex-shrink-0">{plansText.active.backlogTag}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {!progress.completed && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleAbandon}
                disabled={working}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  confirmAbandon
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                style={confirmAbandon ? { background: 'var(--red)', borderColor: 'var(--red)' } : { borderColor: 'var(--grey-light)' }}
              >
                {confirmAbandon
                  ? plansText.active.abandonConfirm
                  : progress.expired
                  ? plansText.active.closeExpiredButton
                  : plansText.active.abandonButton}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Catalogo */}
      <div className="space-y-2">
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider pt-1">{plansText.catalog.heading}</h2>
        {activeEnrollment && (
          <p className="text-xs text-gray-500">{plansText.catalog.startBlockedHint}</p>
        )}
        {PLAN_CATALOG.map((p) => {
          const isActive = activeEnrollment?.plan_key === p.key
          const wasCompleted = completedKeys.has(p.key)
          const perWeek = Math.round(p.sessions.length / p.weeks)
          return (
            <div key={p.key} className="card space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0" aria-hidden="true">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bebas text-xl text-white leading-tight">{p.title}</p>
                    {wasCompleted && (
                      <span className="text-[10px] text-green-400 flex items-center gap-1">
                        <Trophy size={11} />
                        {plansText.catalog.completedBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-1 rounded-full text-gray-400" style={{ background: 'var(--grey)' }}>
                  {plansText.catalog.weeksChip(p.weeks)}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full text-gray-400" style={{ background: 'var(--grey)' }}>
                  {plansText.catalog.perWeekChip(perWeek)}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full text-gray-400" style={{ background: 'var(--grey)' }}>
                  {plansText.catalog.levelLabels[p.level]}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full text-yellow-400" style={{ background: 'rgba(250,204,21,0.1)' }}>
                  {plansText.catalog.creditsChip(p.credits)}
                </span>
                <span className="flex-1" />
                {isActive ? (
                  <span className="text-xs font-semibold text-[var(--red)]">{plansText.active.currentWeekTag}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStart(p.key)}
                    disabled={!!activeEnrollment || working}
                    className="btn-primary px-5 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {working ? plansText.catalog.starting : plansText.catalog.startButton}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {claimedCredits > 0 && (
        <div className="toast-enter toast-saved flex items-center gap-3">
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-[var(--color-text)] font-semibold text-sm">{plansText.active.claimedToastTitle}</p>
            <p className="text-green-400 text-xs">{plansText.active.claimedToastBody(claimedCredits)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
