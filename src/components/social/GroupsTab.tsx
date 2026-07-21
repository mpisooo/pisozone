import { Plus, Users } from 'lucide-react'
import social from '../../lib/i18n/social'
import SkeletonCard from '../SkeletonCard'
import EmptyState from '../EmptyState'
import type { Group } from '../../hooks/useGroups'
import Av from './Av'

// ── Tab GRUPPI ────────────────────────────────────────────────────────────────
interface Props {
  groups: Group[]
  loading: boolean
  onCreateGroup: () => void
  onOpenGroup: (groupId: string, groupName: string, groupPhoto: string | null) => void
}

export default function GroupsTab({ groups, loading, onCreateGroup, onOpenGroup }: Props) {
  return (
    <>
      <button onClick={onCreateGroup} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={18} />
        {social.groups.createButton}
      </button>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <SkeletonCard key={i} lines={2} />)}</div>
      ) : groups.length === 0 ? (
        <div className="card py-12">
          <EmptyState icon="group" title={social.groups.emptyTitle} hint={social.groups.emptyHint} />
        </div>
      ) : (
        <div className="card divide-y divide-[var(--grey)] p-0 overflow-hidden">
          {groups.map(g => (
            <button key={g.id} onClick={() => onOpenGroup(g.id, g.name, g.photo_url)}
              className="tap w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--grey)] transition-colors">
              <Av photo={g.photo_url} name={g.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{g.name}</p>
                <p className="text-xs text-gray-500">{g.memberCount} {g.memberCount === 1 ? social.groups.memberSingular : social.groups.memberPlural} · {g.role === 'admin' ? social.groups.adminRole : social.groups.memberRole}</p>
              </div>
              <Users size={16} className="text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
