import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useGroups } from '../../hooks/useGroups'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import type { FriendProfile } from '../../types'
import Av from './Av'

// ── Create Group View ─────────────────────────────────────────────────────────
interface Props {
  friends: FriendProfile[]
  onBack: () => void
  onCreate: (id: string, name: string) => void
}

export default function CreateGroupView({ friends, onBack, onCreate }: Props) {
  const { createGroup } = useGroups()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleCreate = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    const gid = await createGroup(name, selected)
    setCreating(false)
    if (gid) {
      onCreate(gid, name.trim())
    } else {
      setCreateError(social.groups.create.errors.createFailed)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <p className="font-bebas text-xl text-white tracking-wider">{social.groups.create.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{social.groups.create.nameLabel}</label>
          <input className="input-dark" placeholder={social.groups.create.namePlaceholder} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{social.groups.create.addFriendsHeading(selected.length)}</p>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-500">{social.groups.create.noFriendsHint}</p>
          ) : (
            <div className="space-y-2">
              {friends.map(f => {
                const sel = selected.includes(f.user_id)
                return (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => toggle(f.user_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: sel ? 'rgba(var(--accent-rgb),0.1)' : 'var(--grey)', border: `1px solid ${sel ? 'var(--red)' : 'transparent'}` }}
                  >
                    <Av photo={f.photo_url} name={f.username} size={36} />
                    <p className="flex-1 text-left font-medium text-white">{f.username}</p>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: sel ? 'var(--red)' : '#4b5563', background: sel ? 'var(--red)' : 'transparent' }}
                    >
                      {sel && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--grey)]">
        {createError && <p className="text-xs text-red-400 mb-2 text-center">{createError}</p>}
        <button type="button" onClick={handleCreate} disabled={!name.trim() || creating} className="btn-primary w-full disabled:opacity-50">
          {creating ? social.groups.create.creatingLabel : social.groups.create.submitLabel(selected.length)}
        </button>
      </div>
    </div>
  )
}
