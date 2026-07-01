import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useProfile } from '../hooks/useProfile'
import { useAchievements } from '../hooks/useAchievements'
import { MEDALS, TIER_LABELS, TIER_COLORS, TIER_CREDITS } from '../lib/constants'
import { computeStats } from '../lib/achievementStats'
import type { MedalTier } from '../types'
import SkeletonCard from '../components/SkeletonCard'

const TIERS: MedalTier[] = ['bronze', 'silver', 'gold', 'diamond']

export default function MedalsPage() {
  const { activities, loading: actsLoading } = useActivities()
  const { profile, loading: profileLoading } = useProfile()

  const stats = useMemo(
    () => computeStats(activities, profile?.weekly_goal ?? 3),
    [activities, profile?.weekly_goal]
  )

  const { newlyUnlocked, dismissNewlyUnlocked } = useAchievements(stats)

  if (actsLoading || profileLoading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
      </div>
    )
  }

  const unlockedCount = MEDALS.filter((m) => {
    const { current, target } = m.checkProgress(stats)
    return current >= target
  }).length

  return (
    <div className="page-enter p-4 pb-24 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">MEDAGLIE</span>
        <div className="text-right">
          <p className="font-bebas text-2xl text-[#F44352]">{unlockedCount}/{MEDALS.length}</p>
          <p className="text-xs text-gray-400">sbloccate</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Progresso totale</span>
          <span className="text-sm font-medium text-[#F44352]">
            {Math.round((unlockedCount / MEDALS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(unlockedCount / MEDALS.length) * 100}%`,
              background: 'linear-gradient(90deg, #F44352, #FF5E63)',
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
                const unlocked = current >= target
                const pct = Math.min((current / target) * 100, 100)

                return (
                  <div
                    key={medal.key}
                    className={`card relative overflow-hidden transition-all duration-300 ${
                      unlocked ? 'border-[#F44352]' : 'border-gray-700 opacity-75'
                    }`}
                    style={{ borderColor: unlocked ? undefined : '#2a2a2a' }}
                  >
                    {/* shine on unlocked */}
                    {unlocked && <div className="absolute inset-0 badge-shine pointer-events-none" />}

                    <div className="flex items-start gap-3 relative">
                      <span
                        className={`text-4xl transition-all duration-300 ${unlocked ? '' : 'grayscale opacity-40'}`}
                      >
                        {medal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bebas text-xl tracking-wide ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                            {medal.name}
                          </p>
                          {unlocked && (
                            <span className="text-xs bg-[#F44352] text-[white] px-2 py-0.5 rounded-full font-medium">
                              ✓ Sbloccata
                            </span>
                          )}
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
                                background: unlocked
                                  ? 'linear-gradient(90deg, #F44352, #FF5E63)'
                                  : '#3a3a3a',
                              }}
                            />
                          </div>
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

      {newlyUnlocked.length > 0 && (
        <div
          className="toast-enter toast-saved flex items-center gap-3"
          onClick={dismissNewlyUnlocked}
        >
          <CheckCircle2 size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">
              {newlyUnlocked.length === 1
                ? `Medaglia sbloccata: ${newlyUnlocked[0].icon} ${newlyUnlocked[0].name}`
                : `${newlyUnlocked.length} nuove medaglie sbloccate!`}
            </p>
            <p className="text-green-400 text-xs">
              +{newlyUnlocked.reduce((s, m) => s + m.credits, 0)} 💎 crediti guadagnati
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
