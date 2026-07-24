import { SkeletonRow } from '../SkeletonCard'
import EmptyState from '../EmptyState'
import social from '../../lib/i18n/social'
import type { LeaderboardEntry } from '../../hooks/useLeaderboard'
import Av from './Av'

// ── Tab CLASSIFICA (solo amici) ─────────────────────────────────────────────
// Il toggle Amici/Globale è stato rimosso (P0-7 dell'audit tecnico del
// 24/07/2026 — decisione prodotto): la landing promette "classifiche solo con
// chi conosci davvero", la classifica globale mostrava aggregati settimanali
// a qualunque utente autenticato, non solo agli amici.

interface Props {
  loading: boolean
  entries: LeaderboardEntry[]
  openProfile: (userId: string, username: string, photo: string | null) => void
}

export default function LeaderboardTab({ loading, entries, openProfile }: Props) {
  return (
    <>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</div>
      ) : entries.length <= 1 ? (
        <div className="card py-14">
          <EmptyState
            icon="trophy"
            title={social.leaderboard.emptyFriendsTitle}
            hint={social.leaderboard.emptyFriendsHint}
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
