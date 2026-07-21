import type { Dispatch, SetStateAction } from 'react'
import { SkeletonRow } from '../SkeletonCard'
import EmptyState from '../EmptyState'
import social from '../../lib/i18n/social'
import type { LeaderboardEntry } from '../../hooks/useLeaderboard'
import Av from './Av'

// ── Tab CLASSIFICA ────────────────────────────────────────────────────────────
type LbScope = 'friends' | 'global'

interface Props {
  lbScope: LbScope
  setLbScope: Dispatch<SetStateAction<LbScope>>
  loading: boolean
  entries: LeaderboardEntry[]
  openProfile: (userId: string, username: string, photo: string | null) => void
}

export default function LeaderboardTab({ lbScope, setLbScope, loading, entries, openProfile }: Props) {
  return (
    <>
      {/* Toggle Amici / Globale */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--grey)]">
        {([['friends', social.leaderboard.scopeFriendsLabel], ['global', social.leaderboard.scopeGlobalLabel]] as const).map(([scope, label]) => (
          <button
            key={scope}
            type="button"
            onClick={() => setLbScope(scope)}
            className={`tap flex-1 py-2 text-xs font-semibold transition-all ${lbScope === scope ? 'text-[white]' : 'text-gray-500'}`}
            style={{ background: lbScope === scope ? 'var(--red)' : 'var(--grey-dark)' }}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</div>
      ) : (lbScope === 'friends' ? entries.length <= 1 : entries.length === 0) ? (
        <div className="card py-14">
          <EmptyState
            icon="trophy"
            title={lbScope === 'friends' ? social.leaderboard.emptyFriendsTitle : social.leaderboard.emptyGlobalTitle}
            hint={lbScope === 'friends' ? social.leaderboard.emptyFriendsHint : social.leaderboard.emptyGlobalHint}
          />
        </div>
      ) : (
        <div className="card">
          <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">{social.leaderboard.weekHeading}</p>
          <div className="divide-y divide-[var(--grey)]">
            {entries.map((entry, i) => (
              /* Scoperta (v37): ogni riga apre il profilo pubblico */
              <button
                key={entry.user_id}
                type="button"
                disabled={entry.isMe}
                onClick={() => openProfile(entry.user_id, entry.username, entry.photo_url)}
                className="tap w-full flex items-center gap-3 py-2.5 text-left"
              >
                <span className={`font-bebas text-lg w-6 text-center flex-shrink-0 ${
                  i === 0 ? 'text-[var(--red)]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <Av photo={entry.photo_url} name={entry.username} size={36} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.isMe ? 'text-[var(--red)]' : 'text-white'}`}>
                    {entry.username}{entry.isMe ? social.leaderboard.meSuffix : ''}
                  </p>
                  <p className="text-xs text-gray-500">{entry.count} {entry.count === 1 ? social.leaderboard.sessionSingular : social.leaderboard.sessionPlural} · {entry.minutes} {social.shared.units.min}</p>
                </div>
                <p className="text-sm font-semibold text-white flex-shrink-0">{entry.calories} {social.shared.units.kcal}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
