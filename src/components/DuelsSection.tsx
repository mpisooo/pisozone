import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Swords, Trophy, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDuels } from '../hooks/useDuels'
import { useFriends } from '../hooks/useFriends'
import { useGroups } from '../hooks/useGroups'
import { useProfile } from '../hooks/useProfile'
import { duelState, duelDaysLeft, duelWinnerId, canClaimDuel, formatDuelValue, duelBarPct, DUEL_WIN_CREDITS, type DuelProgressRow } from '../lib/duels'
import { haptic } from '../lib/haptics'
import EmptyState from './EmptyState'
import DuelCreateModal from './DuelCreateModal'
import duelsText from '../lib/i18n/duels'
import type { Duel } from '../types'

// Sezione "Sfide con gli amici" nella pagina Sfide (roadmap v2, pilastro 03).
// Pre-migrazione v37 (unavailable) la sezione sparisce del tutto.
export default function DuelsSection() {
  const { user } = useAuth()
  const { refetch: refetchProfile } = useProfile()
  const { duels, names, loading, unavailable, working, createDuel, respondDuel, withdrawDuel, finishDuel, fetchProgress } = useDuels()
  const { friends } = useFriends()
  const { groups } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [progress, setProgress] = useState<Map<string, DuelProgressRow[]>>(new Map())
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const groupNames = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups])

  // Duelli mostrati: mai i rifiutati altrui; i chiusi solo gli ultimi 3
  const visible = useMemo(() => {
    const open = duels.filter((d) => d.status === 'pending' || d.status === 'active')
    const closed = duels.filter((d) => d.status === 'finished').slice(0, 3)
    const declinedMine = duels.filter((d) => d.status === 'declined' && d.creator_id === user?.id)
    return [...open, ...declinedMine, ...closed]
  }, [duels, user?.id])

  // Avanzamento per i duelli attivi/chiusi (la RPC aggrega per partecipante)
  useEffect(() => {
    let cancelled = false
    const targets = visible.filter((d) => d.status === 'active' || d.status === 'finished')
    Promise.all(targets.map(async (d) => [d.id, await fetchProgress(d.id)] as const)).then((entries) => {
      if (!cancelled) setProgress(new Map(entries))
    })
    return () => { cancelled = true }
  }, [visible, fetchProgress])

  if (unavailable || !user) return null

  const titleOf = (d: Duel) => {
    if (d.group_id) return duelsText.card.group(groupNames.get(d.group_id) ?? '…')
    const otherId = d.creator_id === user.id ? d.opponent_id : d.creator_id
    return duelsText.card.vs(names.get(otherId ?? '') ?? '…')
  }

  async function handleClaim(d: Duel, rows: DuelProgressRow[]) {
    setClaimingId(d.id)
    const winner = duelWinnerId(rows, d.metric)
    const { error } = await finishDuel(d.id, winner)
    setClaimingId(null)
    if (!error && winner === user!.id) {
      haptic('celebrate')
      refetchProfile()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="font-bebas text-2xl text-white tracking-wider flex items-center gap-2">
            <Swords size={18} className="text-[var(--red)]" />
            {duelsText.heading}
          </h2>
          <p className="text-xs text-gray-500">{duelsText.subtitle}</p>
        </div>
        <button type="button" className="btn-primary text-xs px-3 py-1.5 flex-shrink-0" onClick={() => setShowCreate(true)}>
          {duelsText.newButton}
        </button>
      </div>

      {!loading && visible.length === 0 && (
        <div className="card py-6">
          <EmptyState icon="bolt" compact title={duelsText.emptyTitle} hint={duelsText.emptyHint} />
        </div>
      )}

      {visible.map((d) => {
        const state = duelState(d, todayIso)
        const rows = progress.get(d.id) ?? []
        const allValues = rows.map((r) => r.value)
        const incoming = d.status === 'pending' && d.opponent_id === user.id
        const canClaim = canClaimDuel(d, rows, user.id, todayIso)
        const isDraw = state === 'ended' && duelWinnerId(rows, d.metric) === null
        // Sfida di percorso (v47): il nome del segmento è più parlante di
        // un'etichetta generica "Tempo sul segmento".
        const metricLabel = d.metric === 'segment_time' && d.segment_name
          ? d.segment_name
          : (duelsText.metricLabels[d.metric] ?? d.metric)

        return (
          <div key={d.id} className={`card space-y-3 ${state === 'running' ? 'border border-[var(--red)]/30' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {metricLabel} · {titleOf(d)}
                </p>
                <p className="text-xs text-gray-500">
                  {state === 'running' && duelsText.card.daysLeft(duelDaysLeft(d, todayIso))}
                  {state === 'pending' && (incoming ? duelsText.card.pendingIncoming(names.get(d.creator_id) ?? '…') : duelsText.card.pendingOutgoing)}
                  {state === 'declined' && duelsText.card.declined}
                  {state === 'finished' && (d.winner_id
                    ? d.winner_id === user.id ? duelsText.card.wonByYou : duelsText.card.wonBy(names.get(d.winner_id) ?? '…')
                    : duelsText.card.draw)}
                  {state === 'ended' && isDraw && duelsText.card.draw}
                </p>
              </div>
              {state === 'finished' && d.winner_id === user.id && <Trophy size={18} className="text-yellow-400 flex-shrink-0" />}
            </div>

            {/* Barre di avanzamento per partecipante (top 4) */}
            {rows.length > 0 && (state === 'running' || state === 'ended' || state === 'finished') && (
              <div className="space-y-1.5">
                {rows.slice(0, 4).map((r) => (
                  <div key={r.user_id} className="flex items-center gap-2">
                    <span className={`text-xs w-24 truncate flex-shrink-0 ${r.user_id === user.id ? 'text-[var(--red)] font-semibold' : 'text-gray-400'}`}>
                      @{r.username}{r.user_id === user.id ? duelsText.card.youSuffix : ''}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${duelBarPct(r.value, allValues, d.metric)}%`, background: r.user_id === user.id ? 'var(--red)' : 'var(--grey-light)', transition: 'width 0.7s' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white w-16 text-right flex-shrink-0">{formatDuelValue(d.metric, r.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Azioni */}
            {incoming && (
              <div className="flex gap-2">
                <button type="button" disabled={working} className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50" onClick={() => respondDuel(d.id, true)}>
                  {duelsText.card.accept}
                </button>
                <button type="button" disabled={working} className="flex-1 text-xs py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: 'var(--grey)', color: 'var(--color-text)' }} onClick={() => respondDuel(d.id, false)}>
                  {duelsText.card.decline}
                </button>
              </div>
            )}
            {(state === 'pending' && !incoming) || state === 'declined' ? (
              <button type="button" disabled={working} className="text-xs text-gray-500 hover:text-white disabled:opacity-50" onClick={() => withdrawDuel(d.id)}>
                {duelsText.card.withdraw}
              </button>
            ) : null}
            {canClaim && (
              <button type="button" disabled={claimingId === d.id} className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-60" onClick={() => handleClaim(d, rows)}>
                {claimingId === d.id ? (<><Loader2 size={13} className="animate-spin" />{duelsText.card.claiming}</>) : duelsText.card.claim(DUEL_WIN_CREDITS)}
              </button>
            )}
            {isDraw && (
              <button type="button" disabled={claimingId === d.id} className="w-full text-xs py-1.5 rounded-lg disabled:opacity-50" style={{ background: 'var(--grey)', color: 'var(--color-text)' }} onClick={() => handleClaim(d, rows)}>
                {duelsText.card.close}
              </button>
            )}
          </div>
        )
      })}

      {showCreate && (
        <DuelCreateModal
          friends={friends}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          working={working}
          onCreate={async (target, metric, days) => {
            const { error } = await createDuel(target, metric, days)
            if (!error) haptic('success')
            return !error
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
