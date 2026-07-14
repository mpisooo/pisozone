import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { DUEL_METRICS, DUEL_DURATIONS } from '../lib/duels'
import duelsText from '../lib/i18n/duels'
import type { FriendProfile } from '../types'

interface Props {
  friends: FriendProfile[]
  groups: { id: string; name: string }[]
  working: boolean
  onCreate: (target: { opponent_id?: string; group_id?: string }, metric: string, days: number) => Promise<boolean>
  onClose: () => void
}

// Creazione di una sfida: amico o gruppo + metrica + durata (v37).
export default function DuelCreateModal({ friends, groups, working, onCreate, onClose }: Props) {
  const [kind, setKind] = useState<'friend' | 'group'>('friend')
  const [targetId, setTargetId] = useState('')
  const [metric, setMetric] = useState<string>('sessions')
  const [days, setDays] = useState(7)
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const options = kind === 'friend'
    ? friends.map((f) => ({ id: f.user_id, label: `@${f.username}` }))
    : groups.map((g) => ({ id: g.id, label: g.name }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!targetId) return
    const ok = await onCreate(
      kind === 'friend' ? { opponent_id: targetId } : { group_id: targetId },
      metric,
      days,
    )
    if (ok) onClose()
    else setErrorMsg(duelsText.create.createFailed)
  }

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={duelsText.create.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{duelsText.create.title}</h2>
          <button type="button" onClick={onClose} aria-label={duelsText.card.decline} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">{duelsText.create.typeLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {([['friend', duelsText.create.friendTab], ['group', duelsText.create.groupTab]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { setKind(k); setTargetId('') }}
                  aria-pressed={kind === k}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${kind === k ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'}`}
                  style={{ background: kind === k ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">{kind === 'friend' ? duelsText.create.friendHint : duelsText.create.groupHint}</p>
          </div>

          <div>
            <label htmlFor="duel-target" className="block text-xs text-gray-400 mb-1">
              {kind === 'friend' ? duelsText.create.friendPlaceholder : duelsText.create.groupPlaceholder}
            </label>
            {options.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">{kind === 'friend' ? duelsText.create.noFriends : duelsText.create.noGroups}</p>
            ) : (
              <select id="duel-target" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="input-dark">
                <option value="">—</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{duelsText.create.metricLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {DUEL_METRICS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  aria-pressed={metric === m}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${metric === m ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'}`}
                  style={{ background: metric === m ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                >
                  {duelsText.metricLabels[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{duelsText.create.durationLabel}</p>
            <div className="flex gap-2">
              {DUEL_DURATIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDays(n)}
                  aria-pressed={days === n}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${days === n ? 'bg-[var(--red)] text-[white]' : 'text-gray-400'}`}
                  style={days === n ? undefined : { background: 'var(--grey)' }}
                >
                  {duelsText.create.durationOption(n)}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={working || !targetId} className="btn-primary w-full disabled:opacity-60">
            {working ? duelsText.create.creating : duelsText.create.submit}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
