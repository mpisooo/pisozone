import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { haptic } from '../lib/haptics'
import { emptyDraft, draftsToEntries, type ExerciseDraft } from '../lib/exerciseSets'
import { createRoutine, ROUTINE_MAX, type RoutineWithExercises } from '../lib/workoutRoutines'
import ExerciseSetsFields from './ExerciseSetsFields'
import routinesText from '../lib/i18n/routines'

interface Props {
  userId: string
  existingCount: number
  onClose: () => void
  onCreated: (routine: RoutineWithExercises) => void
}

// Creazione di una routine salvata (v48, roadmap v4 pilastro 03): riusa
// ExerciseSetsFields con allowGrouping=false — un template resta una lista
// piatta di blocchi, senza superset/drop set (quelli hanno senso solo su una
// sessione vera). Schermata fissa a tutto schermo, come Registra/Modifica: un
// form con più blocchi è un "form lungo" per convenzione del progetto.
export default function RoutineCreateModal({ userId, existingCount, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [drafts, setDrafts] = useState<ExerciseDraft[]>([emptyDraft()])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const atLimit = existingCount >= ROUTINE_MAX
  const entries = draftsToEntries(drafts)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (!name.trim() || entries.length === 0 || atLimit) return
    setSaving(true)
    const { routine, error } = await createRoutine(userId, name.trim(), entries)
    setSaving(false)
    if (error || !routine) {
      setErrorMsg(routinesText.create.failed)
      return
    }
    haptic('success')
    onCreated({ ...routine, exercises: entries.map((e, seq) => ({
      id: `local-${seq}`, routine_id: routine.id, user_id: userId, seq,
      exercise: e.exercise, sets: e.sets, reps: e.reps, weight_kg: e.weightKg,
    })) })
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={routinesText.create.dialogAriaLabel}
      className="fixed inset-0 z-50 flex flex-col page-enter"
      style={{ background: 'var(--black)' }}
    >
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-[var(--grey)]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <span className="font-bebas text-2xl text-white tracking-wider">{routinesText.create.title}</span>
        <button type="button" onClick={onClose} aria-label={routinesText.create.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
          <X size={22} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="card space-y-2">
          <label htmlFor="routine-name" className="block text-xs text-gray-400">{routinesText.create.nameLabel}</label>
          <input
            id="routine-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={routinesText.create.namePlaceholder}
            maxLength={60}
            className="input-dark"
            autoFocus
          />
        </div>

        <ExerciseSetsFields
          drafts={drafts}
          onChange={setDrafts}
          suggestions={[]}
          idPrefix="routine"
          title={routinesText.create.exercisesTitle}
          hint={routinesText.create.exercisesHint}
          allowGrouping={false}
        />

        {atLimit && (
          <p className="text-xs text-amber-400 px-1">{routinesText.create.limitReached(ROUTINE_MAX)}</p>
        )}
        {errorMsg && (
          <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !name.trim() || entries.length === 0 || atLimit}
          className="btn-primary w-full disabled:opacity-60"
        >
          {saving ? routinesText.create.saving : routinesText.create.submit}
        </button>
      </form>
    </div>,
    document.body,
  )
}
