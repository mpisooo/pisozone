import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { RoutineWithExercises } from '../lib/workoutRoutines'
import routinesText from '../lib/i18n/routines'

interface Props {
  routines: RoutineWithExercises[]
  onSelect: (routine: RoutineWithExercises) => void
  onClose: () => void
}

// Picker "Usa una routine" (v48, roadmap v4 pilastro 03): selezionare una
// routine precompila i blocchi in Log.tsx (rowsToDrafts sui suoi esercizi),
// da modificare come un log normale prima di salvare.
export default function RoutinePickerModal({ routines, onSelect, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={routinesText.picker.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{routinesText.picker.title}</h2>
          <button type="button" onClick={onClose} aria-label={routinesText.picker.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 -mt-2">{routinesText.picker.hint}</p>

        <div className="space-y-2">
          {routines.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--grey)]"
              style={{ border: '1px solid var(--grey)' }}
            >
              <span className="font-medium text-white text-sm truncate">{r.name}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">{routinesText.picker.exercisesCount(r.exercises.length)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
