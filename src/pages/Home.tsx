import { useEffect, useMemo, useState } from 'react'
import { format, subDays, startOfWeek, parseISO, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'
import { Flame, Zap, Trophy, ChevronRight, Plus, Users, Target, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActivities } from '../hooks/useActivities'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { useDailyChallenges } from '../hooks/useDailyChallenges'
import { ACTIVITY_OPTIONS, MEDALS } from '../lib/constants'
import { computeStats } from '../lib/achievementStats'
import { calcStreak } from '../lib/challenges'
import { pushSupported, isSubscribed } from '../lib/push'
import SkeletonCard from '../components/SkeletonCard'
import PushNotificationPrompt from '../components/PushNotificationPrompt'
import home from '../lib/i18n/home'

export default function HomePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, refetch: refetchProfile, updateProfile } = useProfile()
  const { activities, loading: actsLoading } = useActivities()
  const { entries: lbEntries, hasFriends } = useLeaderboard()
  const { frozenDates, freeze, freezing } = useStreakFreeze()
  const navigate = useNavigate()
  const [showPushPrompt, setShowPushPrompt] = useState(false)

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

  const streak = useMemo(() => calcStreak(activities, frozenDates), [activities, frozenDates])

  // Streak freeze offer: yesterday had no activity, not already frozen, and freeze would save a streak
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const hasActivityYesterday = activities.some((a) => a.date.startsWith(yesterday))
  const yesterdayAlreadyFrozen = frozenDates.includes(yesterday)
  const streakSavedByFreeze = useMemo(
    () =>
      !hasActivityYesterday && !yesterdayAlreadyFrozen
        ? calcStreak(activities, [...frozenDates, yesterday])
        : 0,
    [activities, frozenDates, yesterday, hasActivityYesterday, yesterdayAlreadyFrozen],
  )
  const showFreezeOffer = streakSavedByFreeze > 0
  const canAffordFreeze = (profile?.credits ?? 0) >= 300

  async function handleFreeze() {
    const result = await freeze(yesterday)
    if (result.success) refetchProfile()
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
  const weekPct = Math.min((weekActivities.length / weeklyGoal) * 100, 100)
  const weekDone = weekPct >= 100

  const todayPrefix = format(new Date(), 'yyyy-MM-dd')
  const todayActivities = useMemo(
    () => activities.filter((a) => a.date.startsWith(todayPrefix)),
    [activities, todayPrefix]
  )
  const todayCalories = todayActivities.reduce((s, a) => s + (a.calories ?? 0), 0)
  const dailyCalGoal = profile?.daily_calorie_goal ?? null

  const lastActivity = activities[0] ?? null
  const lastOpt = lastActivity ? ACTIVITY_OPTIONS.find((o) => o.value === lastActivity.type) : null

  // Stessa fonte della pagina Sfide (hook condiviso): eligibility + riscatti dal DB
  const { challenges: todayChallenges } = useDailyChallenges(activities, streak)
  const completedChallenges = todayChallenges.filter((c) => c.eligible).length

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
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm capitalize">{todayLabel}</p>
        <h1 className="font-bebas text-4xl text-white tracking-wider mt-0.5">
          {greeting},{' '}
          <span className="text-[var(--red)]">{username}</span>!
        </h1>
        <div className="header-accent" />
      </div>

      {/* Streak + Weekly goal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <Flame
            size={30}
            className="text-[var(--red)] flex-shrink-0"
            style={{ filter: streak > 0 ? 'drop-shadow(0 0 8px var(--red))' : 'none' }}
          />
          <div>
            <p className="font-bebas text-4xl text-white leading-none">{streak}</p>
            <p className="text-xs text-gray-400 leading-tight">
              {home.streakUnit(streak)}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">{home.weeklyGoalLabel}</p>
            <span className={`text-xs font-semibold ${weekDone ? 'text-green-400' : 'text-[var(--red)]'}`}>
              {weekActivities.length}/{weeklyGoal}
            </span>
          </div>
          <div className="progress-track h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${weekPct}%`,
                background: weekDone
                  ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                  : 'linear-gradient(90deg,var(--red),#FF5E63)',
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {weekDone ? home.weekGoalReached : home.weekGoalRemaining(weeklyGoal - weekActivities.length)}
          </p>
        </div>
      </div>

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
                className={`mt-2.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all active:scale-95 disabled:active:scale-100 ${
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

      {/* Daily calorie goal */}
      {dailyCalGoal !== null && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-[var(--red)]" />
              <span className="text-sm font-medium text-gray-300">{home.dailyCalorieGoal.title}</span>
            </div>
            <span className="font-bebas text-lg text-white">
              {todayCalories}
              <span className="text-sm text-gray-500">{home.dailyCalorieGoal.suffix(dailyCalGoal)}</span>
            </span>
          </div>
          <div className="progress-track h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((todayCalories / dailyCalGoal) * 100, 100)}%`,
                background:
                  todayCalories >= dailyCalGoal
                    ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                    : 'linear-gradient(90deg,var(--red),#facc15)',
              }}
            />
          </div>
          {todayCalories >= dailyCalGoal && (
            <p className="text-xs text-green-400 mt-1">{home.dailyCalorieGoal.reached}</p>
          )}
        </div>
      )}

      {/* Last activity */}
      {lastActivity && lastOpt ? (
        <button
          type="button"
          className="card w-full text-left"
          onClick={() => navigate('/calendar')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{home.lastActivity.title}</span>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(var(--accent-rgb),0.12)' }}
            >
              {lastOpt.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{lastOpt.label}</p>
              <p className="text-xs text-gray-400">
                {home.lastActivity.meta(lastActivity.duration_min, lastActivity.calories, lastActivity.distance_km)}
              </p>
            </div>
            <p className="text-xs text-gray-500 flex-shrink-0">
              {format(parseISO(lastActivity.date), 'd MMM', { locale: it })}
            </p>
          </div>
        </button>
      ) : (
        <div className="card text-center py-10">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-7xl mx-auto mb-4"
            style={{ background: 'rgba(var(--accent-rgb),0.1)' }}
          >
            🏋️
          </div>
          <p className="font-bebas text-2xl text-white tracking-wider mb-1">{home.emptyState.title}</p>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            {home.emptyState.body}
          </p>
          <button className="btn-primary px-8 py-2.5 text-sm" onClick={() => navigate('/log')}>
            {home.emptyState.cta}
          </button>
        </div>
      )}

      {/* Nearest medal */}
      {nearestMedal && (
        <button
          type="button"
          className="card w-full text-left"
          onClick={() => navigate('/medals')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[var(--red)]" />
              <span className="text-xs text-gray-400">{home.nearestMedal.title}</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(250,204,21,0.12)' }}
            >
              {nearestMedal.medal.icon}
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

      {/* Leaderboard settimanale */}
      {hasFriends ? (
        <button
          type="button"
          className="card w-full text-left"
          onClick={() => navigate('/social', { state: { tab: 'classifica' } })}
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
          className="card w-full text-left"
          onClick={() => navigate('/social', { state: { tab: 'friends' } })}
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

      {/* Daily challenges widget */}
      <button
        type="button"
        className="card w-full text-left"
        onClick={() => navigate('/challenges')}
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
        onClick={() => navigate('/log')}
      >
        <Plus size={18} />
        {home.cta}
      </button>

      {showPushPrompt && user && (
        <PushNotificationPrompt userId={user.id} onDone={() => setShowPushPrompt(false)} />
      )}
    </div>
  )
}
