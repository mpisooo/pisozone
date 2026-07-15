import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Trophy, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSeasonalEvent } from '../hooks/useSeasonalEvent'
import { seasonalDaysLeft, SEASONAL_PODIUM_CREDITS, type SeasonalEventDef } from '../lib/seasonalEvents'
import { formatDuelValue } from '../lib/duels'
import { haptic } from '../lib/haptics'
import seasonalText from '../lib/i18n/seasonalEvents'

// Evento stagionale in corso + podi da riscattare (roadmap v2, pilastro 03):
// a differenza dei duelli, la classifica è aperta a tutta la community.
// Sparisce del tutto pre-migrazione v39 e quando non c'è nulla da mostrare
// (nessun evento attivo, nessun podio da riscattare, nessuna anteprima).
export default function SeasonalEventSection() {
  const { user } = useAuth()
  const { refetch: refetchProfile } = useProfile()
  const { loading, unavailable, working, current, upcoming, currentLeaderboard, ended, claim } = useSeasonalEvent()
  const [claimingKey, setClaimingKey] = useState<string | null>(null)

  if (unavailable || !user || loading) return null
  if (!current && ended.length === 0 && !upcoming) return null

  const handleClaim = async (event: SeasonalEventDef) => {
    setClaimingKey(event.key)
    const { error } = await claim(event)
    setClaimingKey(null)
    if (!error) {
      haptic('celebrate')
      refetchProfile()
    }
  }

  const dateLabel = (isoDate: string) => format(parseISO(isoDate), 'd MMMM', { locale: it })

  return (
    <div className="space-y-3">
      <div className="pt-2">
        <h2 className="font-bebas text-2xl text-white tracking-wider flex items-center gap-2">
          <Trophy size={18} className="text-[var(--red)]" />
          {seasonalText.heading}
        </h2>
      </div>

      {/* Podi da riscattare: eventi chiusi da poco dove sei tra i primi 3 */}
      {ended.map(({ event, leaderboard }) => {
        const rank = leaderboard.findIndex((r) => r.user_id === user.id) + 1
        const credits = SEASONAL_PODIUM_CREDITS[rank as 1 | 2 | 3]
        return (
          <div key={event.key} className="card space-y-2 border border-[var(--red)]/30">
            <p className="font-semibold text-white text-sm">
              {seasonalText.podiumEmoji[rank]} {seasonalText.claim.heading(rank, event.title)}
            </p>
            <p className="text-xs text-gray-400">{seasonalText.claim.body(credits)}</p>
            <button
              type="button"
              disabled={claimingKey === event.key || working}
              className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-60"
              onClick={() => handleClaim(event)}
            >
              {claimingKey === event.key
                ? (<><Loader2 size={13} className="animate-spin" />{seasonalText.claim.claiming}</>)
                : seasonalText.claim.button}
            </button>
          </div>
        )
      })}

      {/* Evento in corso: classifica live, top 5 */}
      {current && (
        <div className="card space-y-3">
          <div>
            <p className="font-semibold text-white text-sm">
              {current.icon} {current.title} · {seasonalText.metricLabels[current.metric]}
            </p>
            <p className="text-xs text-gray-500">{current.subtitle}</p>
            <p className="text-xs text-[var(--red)] mt-1">{seasonalText.daysLeft(seasonalDaysLeft(current))}</p>
          </div>

          {currentLeaderboard.length === 0 ? (
            <p className="text-xs text-gray-500">{seasonalText.emptyHint}</p>
          ) : (
            <div className="space-y-1.5">
              {currentLeaderboard.slice(0, 5).map((r, i) => {
                const maxValue = Math.max(1, currentLeaderboard[0].value)
                return (
                  <div key={r.user_id} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-gray-500 flex-shrink-0 text-center">
                      {seasonalText.podiumEmoji[i + 1] ?? i + 1}
                    </span>
                    <span className={`text-xs w-20 truncate flex-shrink-0 ${r.user_id === user.id ? 'text-[var(--red)] font-semibold' : 'text-gray-400'}`}>
                      @{r.username}{r.user_id === user.id ? seasonalText.youSuffix : ''}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(r.value / maxValue) * 100}%`, background: r.user_id === user.id ? 'var(--red)' : 'var(--grey-light)', transition: 'width 0.7s' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white w-16 text-right flex-shrink-0">{formatDuelValue(current.metric, r.value)}</span>
                  </div>
                )
              })}
              {currentLeaderboard.length > 5 && (
                <p className="text-[10px] text-gray-600 text-right">{seasonalText.andMore(currentLeaderboard.length - 5)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Anteprima del prossimo evento, solo se non c'è nulla in corso ora */}
      {!current && upcoming && (
        <div className="card text-center py-4">
          <p className="text-sm text-gray-500">
            {upcoming.icon} {seasonalText.upcoming.label(upcoming.title, dateLabel(upcoming.startsOn))}
          </p>
        </div>
      )}
    </div>
  )
}
