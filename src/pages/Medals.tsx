import { useMemo } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { useAchievements } from '../hooks/useAchievements'
import { MEDALS, TIER_LABELS, TIER_COLORS, TIER_CREDITS } from '../lib/constants'
import { computeStats } from '../lib/achievementStats'
import type { MedalTier } from '../types'
import SkeletonCard from '../components/SkeletonCard'
import MedalCelebrationOverlay from '../components/MedalCelebrationOverlay'

const TIERS: MedalTier[] = ['bronze', 'silver', 'gold', 'diamond']

export default function MedalsPage() {
  const { activities, loading: actsLoading } = useActivities()
  const { profile, loading: profileLoading } = useProfile()

  const stats = useMemo(
    () => computeStats(activities, profile?.weekly_goal ?? 3),
    [activities, profile?.weekly_goal]
  )

  const { claimedKeys, eligibleKeys, claimingKey, claimMedal, newlyUnlocked, dismissNewlyUnlocked } = useAchievements(stats)

  if (actsLoading || profileLoading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
      </div>
    )
  }

  const claimedCount = claimedKeys.size

  return (
    <div className="page-enter p-4 pb-24 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <span className="font-bebas text-4xl text-white tracking-widest">MEDAGLIE</span>
          <div className="header-accent" />
        </div>
        <div className="text-right">
          <p className="font-bebas text-2xl text-[var(--red)]">{claimedCount}/{MEDALS.length}</p>
          <p className="text-xs text-gray-400">sbloccate</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Progresso totale</span>
          <span className="text-sm font-medium text-[var(--red)]">
            {Math.round((claimedCount / MEDALS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(claimedCount / MEDALS.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--red), #FF5E63)',
            }}
          />
        </div>
      </div>

      {/* Medals by tier */}
      {TIERS.map((tier) => {
        const tierMedals = MEDALS.filter((m) => m.tier === tier)
        return (
          <section key={tier} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className={`font-bebas text-2xl tracking-wider bg-gradient-to-r ${TIER_COLORS[tier]} bg-clip-text text-transparent`}>
                {TIER_LABELS[tier]}
              </h2>
              <span className="text-xs text-gray-500">+{TIER_CREDITS[tier]} 💎 a sblocco</span>
            </div>
            <div className="space-y-2">
              {tierMedals.map((medal) => {
                const { current, target } = medal.checkProgress(stats)
                const claimed = claimedKeys.has(medal.key)
                const eligible = eligibleKeys.has(medal.key)
                const isClaiming = claimingKey === medal.key
                const pct = Math.min((current / target) * 100, 100)
                const locked = !claimed && !eligible

                return (
                  <div
                    key={medal.key}
                    className={`card relative overflow-hidden transition-all duration-300 ${
                      claimed ? 'border-green-500/30' : eligible ? 'border-[var(--red)]/50' : 'opacity-75'
                    }`}
                    style={{ borderColor: locked ? '#2a2a2a' : undefined }}
                  >
                    {/* shine on claimed */}
                    {claimed && <div className="absolute inset-0 badge-shine pointer-events-none" />}

                    <div className="flex items-start gap-3 relative">
                      <span
                        className={`text-4xl transition-all duration-300 ${locked ? 'grayscale opacity-40' : ''}`}
                      >
                        {medal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bebas text-xl tracking-wide ${locked ? 'text-gray-400' : 'text-white'}`}>
                            {medal.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{medal.description}</p>

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{Math.round(current)} / {target}</span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: claimed
                                  ? 'linear-gradient(90deg, var(--red), #FF5E63)'
                                  : eligible
                                  ? 'linear-gradient(90deg, var(--red), #FF5E63)'
                                  : '#3a3a3a',
                              }}
                            />
                          </div>
                        </div>

                        {/* Action */}
                        <div className="mt-3">
                          {claimed ? (
                            <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                              <CheckCircle2 size={14} />
                              <span>Sbloccata</span>
                            </div>
                          ) : eligible ? (
                            <button
                              type="button"
                              onClick={() => claimMedal(medal.key)}
                              disabled={!!claimingKey}
                              className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                            >
                              {isClaiming ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Riscatto...</span>
                                </>
                              ) : (
                                <span>Riscatta +{TIER_CREDITS[medal.tier]} 💎</span>
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {newlyUnlocked && (
        <MedalCelebrationOverlay
          icon={newlyUnlocked.icon}
          name={newlyUnlocked.name}
          tier={newlyUnlocked.tier}
          credits={newlyUnlocked.credits}
          onDone={dismissNewlyUnlocked}
        />
      )}
    </div>
  )
}
