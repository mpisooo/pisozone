import { useState } from 'react'
import { Check } from 'lucide-react'
import social from '../../lib/i18n/social'
import type { FriendProfile } from '../../types'
import Av from './Av'
import ActionSheet from './ActionSheet'

// ── Aggiungi membri (roadmap v6, "Gruppi vivi") ────────────────────────────────
// Stesso pattern del picker amici di CreateGroupView, ma dentro un ActionSheet
// (il gruppo è già aperto in un overlay, una seconda vista a tutto schermo
// sarebbe un livello di navigazione in più senza bisogno).
interface Props {
  friends: FriendProfile[]
  existingMemberIds: string[]
  onClose: () => void
  onSubmit: (userIds: string[]) => Promise<void>
}

export default function AddMembersSheet({ friends, existingMemberIds, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const candidates = friends.filter(f => !existingMemberIds.includes(f.user_id))

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleSubmit = async () => {
    if (selected.length === 0 || submitting) return
    setSubmitting(true)
    await onSubmit(selected)
    setSubmitting(false)
  }

  return (
    <ActionSheet onClose={onClose} label={social.groups.manage.addMembersSheetLabel}>
      <div className="px-4 pt-4 pb-3 border-b border-[var(--grey)]">
        <p className="text-sm font-semibold text-white">{social.groups.manage.addMembersSheetLabel}</p>
      </div>
      <div className="max-h-[45vh] overflow-y-auto overscroll-contain px-4 py-3 space-y-2">
        {candidates.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">{social.groups.manage.addMembersEmptyHint}</p>
        ) : (
          candidates.map(f => {
            const sel = selected.includes(f.user_id)
            return (
              <button
                key={f.user_id}
                type="button"
                onClick={() => toggle(f.user_id)}
                className="tap w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: sel ? 'rgba(var(--accent-rgb),0.1)' : 'var(--grey)', border: `1px solid ${sel ? 'var(--red)' : 'transparent'}` }}
              >
                <Av photo={f.photo_url} name={f.username} size={36} />
                <p className="flex-1 text-left font-medium text-white">{f.username}</p>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: sel ? 'var(--red)' : '#4b5563', background: sel ? 'var(--red)' : 'transparent' }}
                >
                  {sel && <Check size={12} className="text-white" />}
                </div>
              </button>
            )
          })
        )}
      </div>
      {candidates.length > 0 && (
        <div className="p-4 border-t border-[var(--grey)]">
          <button type="button" onClick={handleSubmit} disabled={selected.length === 0 || submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? social.groups.manage.addingLabel : social.groups.manage.addMembersSubmitLabel(selected.length)}
          </button>
        </div>
      )}
    </ActionSheet>
  )
}
