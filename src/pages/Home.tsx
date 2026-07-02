import { useMemo } from 'react'
import { format, subDays, startOfWeek, parseISO, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'
import { Flame, Zap, Trophy, ChevronRight, Plus, Users, Target, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActivities } from '../hooks/useActivities'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { ACTIVITY_OPTIONS, MEDALS } from '../lib/constants'
import { computeStats } from '../lib/achievementStats'
import { calcStreak, generateDailyChallenges } from '../lib/challenges'
import SkeletonCard from '../components/SkeletonCard'

export default function HomePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const { activities, loading: actsLoading } = useActivities()
  const { entries: lbEntries, hasFriends } = useLeaderboard()
  const { frozenDates, freeze, freezing } = useStreakFreeze()
  const navigate = useNavigate()

  const username: string = (user?.user_metadata?.username as string) || 'Atleta'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'
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

  const todayChallenges = useMemo(
    () => (user ? generateDailyChallenges(user.id, todayPrefix) : []),
    [user?.id, todayPrefix],
  )
  const completedChallenges = todayChallenges.filter((c) =>
    c.check(todayActivities, streak),
  ).length

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
          <span className="text-[#F44352]">{username}</span>!
        </h1>
      </div>

      {/* Streak + Weekly goal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <Flame
            size={30}
            className="text-[#F44352] flex-shrink-0"
            style={{ filter: streak > 0 ? 'drop-shadow(0 0 8px #F44352)' : 'none' }}
          />
          <div>
            <p className="font-bebas text-4xl text-white leading-none">{streak}</p>
            <p className="text-xs text-gray-400 leading-tight">
              {streak === 1 ? 'giorno streak' : 'giorni streak'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Obiettivo settimana</p>
            <span className={`text-xs font-semibold ${weekDone ? 'text-green-400' : 'text-[#F44352]'}`}>
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
                  : 'linear-gradient(90deg,#F44352,#FF5E63)',
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {weekDone ? '🎉 Obiettivo raggiunto!' : `ancora ${weeklyGoal - weekActivities.length} sessioni`}
          </p>
        </div>
      </div>

      {/* Streak freeze offer */}
      {showFreezeOffer && (
        <div className="card border border-blue-500/40">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🧊</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-300 text-sm">Streak a rischio!</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Non hai registrato nulla ieri. Proteggi il tuo streak di{' '}
                <span className="text-white font-medium">
                  {streakSavedByFreeze} {streakSavedByFreeze === 1 ? 'giorno' : 'giorni'}
                </span>{' '}
                spendendo 300 crediti.
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
                  ? 'Congelamento...'
                  : canAffordFreeze
                  ? '🧊 Congela streak (−300 💰)'
                  : `Crediti insufficienti (${profile?.credits ?? 0}/300)`}
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
              <Zap size={15} className="text-[#F44352]" />
              <span className="text-sm font-medium text-gray-300">Calorie bruciate oggi</span>
            </div>
            <span className="font-bebas text-lg text-white">
              {todayCalories}
              <span className="text-sm text-gray-500"> / {dailyCalGoal} kcal</span>
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
                    : 'linear-gradient(90deg,#F44352,#facc15)',
              }}
            />
          </div>
          {todayCalories >= dailyCalGoal && (
            <p className="text-xs text-green-400 mt-1">🎉 Obiettivo calorico raggiunto!</p>
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
            <span className="text-xs text-gray-400">Ultima attività</span>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{lastOpt.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{lastOpt.label}</p>
              <p className="text-xs text-gray-400">
                {lastActivity.duration_min} min
                {lastActivity.calories ? ` · ${lastActivity.calories} kcal` : ''}
                {lastActivity.distance_km ? ` · ${lastActivity.distance_km} km` : ''}
              </p>
            </div>
            <p className="text-xs text-gray-500 flex-shrink-0">
              {format(parseISO(lastActivity.date), 'd MMM', { locale: it })}
            </p>
          </div>
        </button>
      ) : (
        <div className="card text-center py-10">
          <p className="text-7xl mb-4">🏋️</p>
          <p className="font-bebas text-2xl text-white tracking-wider mb-1">Pronto a sudare?</p>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            Registra la tua prima attività e inizia a costruire la tua streak. Ogni grande atleta ha avuto un giorno zero.
          </p>
          <button className="btn-primary px-8 py-2.5 text-sm" onClick={() => navigate('/log')}>
            💪 Inizia ora
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
              <Trophy size={14} className="text-[#F44352]" />
              <span className="text-xs text-gray-400">Medaglia più vicina</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nearestMedal.medal.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bebas text-lg text-white leading-tight">{nearestMedal.medal.name}</p>
              <p className="text-xs text-gray-400 truncate">{nearestMedal.medal.description}</p>
              <div className="progress-track mt-1.5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${nearestMedal.pct * 100}%`,
                    background: 'linear-gradient(90deg,#F44352,#FF5E63)',
                    transition: 'width 0.7s',
                  }}
                />
              </div>
            </div>
            <span className="font-bebas text-xl text-[#F44352] flex-shrink-0">
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
              <Users size={14} className="text-[#F44352]" />
              <span className="text-xs text-gray-400">Classifica settimanale</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          <div className="space-y-2">
            {lbEntries.slice(0, 3).map((entry, i) => (
              <div key={entry.user_id} className="flex items-center gap-3">
                <span className={`font-bebas text-lg w-5 text-center ${i === 0 ? 'text-[#F44352]' : 'text-gray-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.isMe ? 'text-[#F44352]' : 'text-white'}`}>
                    {entry.username}{entry.isMe ? ' (tu)' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{entry.calories} kcal</p>
                  <p className="text-xs text-gray-500">{entry.count} sessioni</p>
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
              <p className="text-sm font-medium text-gray-400">Aggiungi amici</p>
              <p className="text-xs text-gray-600">Sfida i tuoi amici nella classifica settimanale</p>
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
            <Target size={14} className="text-[#F44352]" />
            <span className="text-xs text-gray-400">Sfide di oggi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-yellow-400">
              {completedChallenges}/{todayChallenges.length} completate
            </span>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
        </div>
        <div className="space-y-2">
          {todayChallenges.map((c) => {
            const done = c.check(todayActivities, streak)
            return (
              <div key={c.key} className="flex items-center gap-2.5">
                <span className={`text-lg ${done ? '' : 'grayscale opacity-40'}`}>{c.icon}</span>
                <span className={`text-xs flex-1 truncate ${done ? 'text-green-400 line-through' : 'text-gray-400'}`}>
                  {c.title}
                </span>
                {done
                  ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                  : <span className="text-xs text-yellow-500 flex-shrink-0">+{c.credits} 💰</span>
                }
              </div>
            )
          })}
        </div>
      </button>

      {/* CTA */}
      <button
        type="button"
        className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        onClick={() => navigate('/log')}
      >
        <Plus size={18} />
        Registra allenamento
      </button>
    </div>
  )
}
