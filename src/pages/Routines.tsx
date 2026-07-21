import { useState } from 'react'
import { ChevronDown, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRoutines } from '../hooks/useRoutines'
import { ROUTINE_MAX, type RoutineWithExercises } from '../lib/workoutRoutines'
import EmptyState from '../components/EmptyState'
import SkeletonCard from '../components/SkeletonCard'
import RoutineCreateModal from '../components/RoutineCreateModal'
import routinesText from '../lib/i18n/routines'
import common from '../lib/i18n/common'

// Routine salvate (v48, roadmap v4 pilastro 03): template riutilizzabili,
// MAI collegati a un'attività — si "parte" da una routine dal picker in
// Log.tsx, qui si gestisce solo la propria libreria (creazione/eliminazione).
export default function RoutinesPage() {
  const { user } = useAuth()
  const { routines, loaded, addLocal, removeLocal } = useRoutines(true)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    const { error } = await removeLocal(id)
    if (error) {
      setConfirmDeleteId(null)
      return
    }
    setConfirmDeleteId(null)
  }

  function handleCreated(routine: RoutineWithExercises) {
    addLocal(routine)
    setShowCreate(false)
  }

  if (!loaded) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{routinesText.page.pageTitle}</span>
        <div className="header-accent" />
        <p className="text-xs text-gray-500 mt-2">{routinesText.page.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        disabled={routines.length >= ROUTINE_MAX}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Plus size={16} />
        {routinesText.page.newButton}
      </button>

      {routines.length === 0 && (
        <div className="card py-10">
          <EmptyState icon="bolt" title={routinesText.page.emptyState.title} hint={routinesText.page.emptyState.hint} />
        </div>
      )}

      {routines.map((r) => (
        <details key={r.id} className="card group !p-0 overflow-hidden">
          <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{r.name}</p>
              <p className="text-xs text-gray-500">{routinesText.page.exercisesCount(r.exercises.length)}</p>
            </div>
            <ChevronDown size={18} className="text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-1.5">
              {r.exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate">{ex.exercise}</span>
                  <span className="text-gray-500 flex-shrink-0">
                    {ex.sets}×{ex.reps}{ex.weight_kg != null ? ` @ ${ex.weight_kg} kg` : ''}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              aria-label={confirmDeleteId === r.id ? common.confirmQuestion : routinesText.page.deleteButton}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                confirmDeleteId === r.id ? 'text-white' : 'text-red-400 hover:bg-red-900/20'
              }`}
              style={confirmDeleteId === r.id ? { background: 'var(--red)' } : { border: '1px solid #7f1d1d' }}
            >
              <Trash2 size={14} />
              {confirmDeleteId === r.id ? common.confirmQuestion : routinesText.page.deleteButton}
            </button>
          </div>
        </details>
      ))}

      {showCreate && user && (
        <RoutineCreateModal
          userId={user.id}
          existingCount={routines.length}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
