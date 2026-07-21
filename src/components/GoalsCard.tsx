import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Target, Plus, Trash2 } from 'lucide-react'
import { computeGoalProgress, countActiveGoals, MAX_ACTIVE_GOALS, type GoalMetric } from '../lib/goals'
import { getZoneByPercent } from '../lib/zones'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import { haptic } from '../lib/haptics'
import GoalCreateModal from './GoalCreateModal'
import goalsText from '../lib/i18n/goals'
import type { Activity, PersonalGoal } from '../types'

interface Props {
  goals: PersonalGoal[]
  activities: Activity[]
  working: boolean
  onCreate: (goal: Pick<PersonalGoal, 'metric' | 'target' | 'activity_type' | 'starts_on' | 'ends_on'>) => Promise<boolean>
  onDelete: (goalId: string) => Promise<boolean>
}

// Widget "I miei obiettivi" in Home (roadmap v2, pilastro 04): mete libere con
// barra di avanzamento derivata dalle attività. Senza obiettivi la card è un
// invito compatto; l'eliminazione usa il doppio tocco di conferma (pattern di
// ActivityEditModal), con reset automatico dopo qualche secondo.
export default function GoalsCard({ goals, activities, working, onCreate, onDelete }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current) }, [])

  const activeCount = countActiveGoals(goals, activities)
  const canAdd = activeCount < MAX_ACTIVE_GOALS

  const handleDelete = async (goalId: string) => {
    if (pendingDelete !== goalId) {
      setPendingDelete(goalId)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setPendingDelete(null), 3000)
      return
    }
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setPendingDelete(null)
    const ok = await onDelete(goalId)
    if (ok) haptic('light')
  }

  const handleCreate = async (goal: Parameters<Props['onCreate']>[0]) => {
    const ok = await onCreate(goal)
    if (ok) haptic('success')
    return ok
  }

  return (
    <>
      {goals.length === 0 ? (
        <button type="button" className="card tap w-full text-left" onClick={() => setShowCreate(true)}>
          <div className="flex items-center gap-3">
            <Target size={22} className="text-gray-700 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-400">{goalsText.discoverTitle}</p>
              <p className="text-xs text-gray-600">{goalsText.discoverBody}</p>
            </div>
            <Plus size={16} className="text-gray-600 flex-shrink-0" />
          </div>
        </button>
      ) : (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-[var(--red)]" />
              <span className="text-xs text-gray-400">{goalsText.cardTitle}</span>
            </div>
            {canAdd ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={13} />
                {goalsText.newGoal}
              </button>
            ) : (
              <span className="text-[10px] text-gray-600 text-right max-w-[55%]">{goalsText.limitReached}</span>
            )}
          </div>

          {goals.map((goal) => {
            const p = computeGoalProgress(goal, activities)
            const zone = getZoneByPercent(p.pct)
            const metric = goal.metric as GoalMetric
            const targetLabel = goalsText.targetLabels[metric](Number(goal.target))
            const sportLabel = goal.activity_type
              ? ACTIVITY_OPTIONS.find((o) => o.value === goal.activity_type)?.label ?? goal.activity_type
              : null
            const title = goalsText.goalTitle(targetLabel, sportLabel)
            const confirming = pendingDelete === goal.id
            return (
              <div key={goal.id} className={p.expired ? 'opacity-60' : ''}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white flex-1 min-w-0 truncate">{title}</p>
                  {p.reached ? (
                    <span className="text-[10px] text-green-400 font-semibold flex-shrink-0">{goalsText.reachedBadge}</span>
                  ) : p.expired ? (
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{goalsText.expiredBadge}</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{goalsText.daysLeft(p.daysLeft)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    aria-label={goalsText.deleteAria(title)}
                    className={`p-1.5 -mr-1 flex-shrink-0 transition-colors ${confirming ? 'text-[var(--red)]' : 'text-gray-600 hover:text-gray-400'}`}
                  >
                    {confirming
                      ? <span className="text-[10px] font-semibold">{goalsText.deleteConfirm}</span>
                      : <Trash2 size={13} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="progress-track flex-1 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.pct}%`,
                        background: p.expired ? 'var(--grey-light)' : zone.cssVar,
                        transition: 'width 0.6s var(--ease-out)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">
                    {goalsText.progressValue(p.current, Number(goal.target))}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {format(parseISO(goal.starts_on), 'd MMM', { locale: it })} – {format(parseISO(goal.ends_on), 'd MMM', { locale: it })}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <GoalCreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          working={working}
        />
      )}
    </>
  )
}
