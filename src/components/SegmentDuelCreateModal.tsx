import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { DUEL_DURATIONS } from '../lib/duels'
import segmentsText from '../lib/i18n/segments'
import type { FriendProfile, RouteSegment } from '../types'

interface Props {
  segment: RouteSegment
  friends: FriendProfile[]
  working: boolean
  onCreate: (opponentId: string, days: number) => Promise<boolean>
  onClose: () => void
}

// Sfida di percorso (v47, roadmap v4 pilastro 02): a differenza di
// DuelCreateModal non c'è una metrica da scegliere (è sempre il tempo su
// QUESTO segmento) né la modalità di gruppo (farsi trovare tutti sullo
// stesso tratto di strada non è realistico) — solo amico + durata.
export default function SegmentDuelCreateModal({ segment, friends, working, onCreate, onClose }: Props) {
  const [opponentId, setOpponentId] = useState('')
  const [days, setDays] = useState(7)
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!opponentId) return
    const ok = await onCreate(opponentId, days)
    if (ok) onClose()
    else setErrorMsg(segmentsText.duelCreate.failed)
  }

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={segmentsText.duelCreate.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{segmentsText.duelCreate.title}</h2>
          <button type="button" onClick={onClose} aria-label={segmentsText.duelCreate.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 -mt-2">{segmentsText.duelCreate.hint(segment.name)}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="segment-duel-friend" className="block text-xs text-gray-400 mb-1">
              {segmentsText.duelCreate.friendPlaceholder}
            </label>
            {friends.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">{segmentsText.duelCreate.noFriends}</p>
            ) : (
              <select id="segment-duel-friend" value={opponentId} onChange={(e) => setOpponentId(e.target.value)} className="input-dark">
                <option value="">—</option>
                {friends.map((f) => <option key={f.user_id} value={f.user_id}>@{f.username}</option>)}
              </select>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{segmentsText.duelCreate.durationLabel}</p>
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
                  {segmentsText.duelCreate.durationOption(n)}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={working || !opponentId} className="btn-primary w-full disabled:opacity-60">
            {working ? segmentsText.duelCreate.creating : segmentsText.duelCreate.submit}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
