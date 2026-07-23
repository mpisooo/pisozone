import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Coins, CheckCircle2, Lock, Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { useDailyChallenges } from '../hooks/useDailyChallenges'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { useRecovery } from '../hooks/useRecovery'
import { calcStreak } from '../lib/challenges'
import { haptic } from '../lib/haptics'
import { useEffect, useMemo } from 'react'
import SkeletonCard from '../components/SkeletonCard'
import AnimatedNumber from '../components/AnimatedNumber'
import DuelsSection from '../components/DuelsSection'
import SeasonalEventSection from '../components/SeasonalEventSection'
import ContextualTip from '../components/ContextualTip'
import challenges from '../lib/i18n/challenges'

const TIER_COLOR: Record<string, string> = {
  '15': 'text-gray-400',
  '20': 'text-blue-400',
  '25': 'text-purple-400',
  '30': 'text-yellow-400',
  '35': 'text-orange-400',
  '50': 'text-[var(--red)]',
}

function creditsColor(n: number): string {
  return TIER_COLOR[String(n)] ?? 'text-gray-400'
}

export default function ChallengesPage() {
  const { activities, loading: actsLoading } = useActivities()
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const { frozenDates } = useStreakFreeze()
  const { restDates } = useRecovery()
  const location = useLocation()

  // Deep-link dalla campanella (roadmap v3, pilastro 04): duelli e podio
  // stagionale vivono in fondo alla pagina — si scorre fin lì invece di
  // lasciare l'utente in cima. Il ritardo lascia alle sezioni (che caricano
  // async) il tempo di comparire; se pre-migrazione non esistono, l'ancora
  // vuota non fa danni.
  useEffect(() => {
    const section = (location.state as { section?: 'duels' | 'seasonal' } | null)?.section
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(() => {
      document.getElementById(`${section}-section`)?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [location.state])

  // Stessa fonte di Home/Calendar: freeze e giorni di riposo proteggono la streak
  const streak = useMemo(
    () => calcStreak(activities, [...frozenDates, ...restDates]),
    [activities, frozenDates, restDates],
  )

  const { challenges: dailyChallenges, loading: challengesLoading, claimingKey, claimChallenge, totalEarnable, totalEarned } =
    useDailyChallenges(activities, streak)

  const loading = actsLoading || profileLoading || challengesLoading

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: it })
  const credits = profile?.credits ?? 0

  async function handleClaim(key: string) {
    const ok = await claimChallenge(key)
    if (ok) {
      haptic('success')
      refetchProfile()
    }
  }

  if (loading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    )
  }

  const allClaimed = dailyChallenges.every((c) => c.claimed)

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm capitalize">{todayLabel}</p>
        <h1 className="font-bebas text-4xl text-white tracking-wider mt-0.5">
          {challenges.titlePrefix}<span className="text-[var(--red)]">{challenges.titleHighlight}</span>
        </h1>
        <div className="header-accent" />
      </div>

      <ContextualTip tipId="challenges" icon="💎" title={challenges.tip.title} text={challenges.tip.text} />

      {/* Credits balance */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-yellow-400" />
          <span className="text-sm text-gray-300 font-medium">{challenges.creditsBalanceLabel}</span>
        </div>
        <span className="font-bebas text-3xl text-yellow-400 tracking-wide"><AnimatedNumber value={credits} /></span>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{challenges.todayCreditsLabel}</span>
          <span className="text-xs font-semibold text-[var(--red)]">
            {totalEarned} / {totalEarnable}
          </span>
        </div>
        <div className="progress-track h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: totalEarnable > 0 ? `${(totalEarned / totalEarnable) * 100}%` : '0%',
              background:
                allClaimed
                  ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                  : 'linear-gradient(90deg,var(--red),#facc15)',
            }}
          />
        </div>
        {allClaimed && (
          <p className="text-xs text-green-400 mt-1.5">{challenges.allClaimed}</p>
        )}
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {dailyChallenges.map(({ template, eligible, claimed }, i) => {
          const isClaiming = claimingKey === template.key

          return (
            <div
              key={template.key}
              className={`card stagger-in transition-all duration-200 ${
                claimed ? 'border border-green-500/30' : eligible ? 'border border-[var(--red)]/30' : ''
              }`}
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <span className={`text-3xl flex-shrink-0 mt-0.5 ${!eligible && !claimed ? 'grayscale opacity-50' : ''}`}>
                  {template.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm leading-tight ${claimed ? 'text-green-400' : eligible ? 'text-white' : 'text-gray-400'}`}>
                      {template.title}
                    </p>
                    <span className={`text-xs font-bold flex-shrink-0 ${creditsColor(template.credits)}`}>
                      +{template.credits} 💎
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{template.description}</p>

                  {/* Action */}
                  <div className="mt-3">
                    {claimed ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                        <CheckCircle2 size={14} />
                        <span>{challenges.claimedLabel}</span>
                      </div>
                    ) : eligible ? (
                      <button
                        className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                        onClick={() => handleClaim(template.key)}
                        disabled={!!claimingKey}
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>{challenges.claiming}</span>
                          </>
                        ) : (
                          <span>{challenges.claimButton(template.credits)}</span>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Lock size={12} />
                        <span>{challenges.inProgress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-600 pb-2">
        {challenges.footerHint}
      </p>

      {/* Sfide 1v1 e di gruppo (v37): sparisce da sola pre-migrazione.
          Gli id sono le ancore dei deep-link della campanella. */}
      <div id="duels-section">
        <DuelsSection />
      </div>

      {/* Eventi stagionali (v39): classifica aperta a tutta la community */}
      <div id="seasonal-section">
        <SeasonalEventSection />
      </div>
    </div>
  )
}
