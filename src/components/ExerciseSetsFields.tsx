import { Plus, Trash2 } from 'lucide-react'
import {
  emptyDraft, draftStatus, draftsToEntries, totalVolumeKg,
  EXERCISE_NAME_MAX, SETS_MAX, REPS_MAX, WEIGHT_KG_MAX,
  type ExerciseDraft,
} from '../lib/exerciseSets'
import log from '../lib/i18n/log'

interface Props {
  drafts: ExerciseDraft[]
  onChange: (drafts: ExerciseDraft[]) => void
  // Nomi già usati in passato, per la <datalist>: scrivere sempre lo stesso
  // nome è ciò che rende affidabili PR e record.
  suggestions: string[]
  // Prefisso per id/datalist unici tra Log ('log') e ActivityEditModal ('edit')
  idPrefix: string
}

// Card del log palestra strutturato (roadmap v2, pilastro 02 punto 1),
// condivisa da Log.tsx e ActivityEditModal.tsx e mostrata solo per la
// palestra. Controllata dall'esterno come PerceivedMetricsFields: le bozze
// sono stringhe grezze (ogni campo può restare vuoto), la conversione a righe
// valide vive in lib/exerciseSets.ts.
export default function ExerciseSetsFields({ drafts, onChange, suggestions, idPrefix }: Props) {
  const datalistId = `${idPrefix}-exercise-suggestions`
  const entries = draftsToEntries(drafts)
  const volume = totalVolumeKg(entries)

  const updateDraft = (key: string, patch: Partial<ExerciseDraft>) => {
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.gym.title}</h2>
        <p className="text-xs text-gray-500 mt-1">{log.form.gym.hint}</p>
      </div>

      {suggestions.length > 0 && (
        <datalist id={datalistId}>
          {suggestions.map((name) => <option key={name} value={name} />)}
        </datalist>
      )}

      {drafts.map((draft, i) => {
        const status = draftStatus(draft)
        return (
          <div key={draft.key} className="rounded-xl border p-2.5 space-y-2" style={{ borderColor: 'var(--grey)' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input-dark flex-1 min-w-0"
                value={draft.exercise}
                onChange={(e) => updateDraft(draft.key, { exercise: e.target.value })}
                placeholder={log.form.gym.exercisePlaceholder}
                list={suggestions.length > 0 ? datalistId : undefined}
                maxLength={EXERCISE_NAME_MAX}
                aria-label={`${log.form.gym.exerciseLabel} ${i + 1}`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => onChange(drafts.filter((d) => d.key !== draft.key))}
                aria-label={log.form.gym.removeAria(draft.exercise.trim())}
                className="p-2 -mr-1 text-gray-500 hover:text-[var(--red)] transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor={`${idPrefix}-sets-${draft.key}`} className="block text-[10px] text-gray-500 mb-1">{log.form.gym.setsLabel}</label>
                <input
                  id={`${idPrefix}-sets-${draft.key}`}
                  type="number"
                  inputMode="numeric"
                  className="input-dark"
                  value={draft.sets}
                  onChange={(e) => updateDraft(draft.key, { sets: e.target.value })}
                  min={1}
                  max={SETS_MAX}
                  step={1}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-reps-${draft.key}`} className="block text-[10px] text-gray-500 mb-1">{log.form.gym.repsLabel}</label>
                <input
                  id={`${idPrefix}-reps-${draft.key}`}
                  type="number"
                  inputMode="numeric"
                  className="input-dark"
                  value={draft.reps}
                  onChange={(e) => updateDraft(draft.key, { reps: e.target.value })}
                  min={1}
                  max={REPS_MAX}
                  step={1}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-weight-${draft.key}`} className="block text-[10px] text-gray-500 mb-1">{log.form.gym.weightLabel}</label>
                <input
                  id={`${idPrefix}-weight-${draft.key}`}
                  type="number"
                  inputMode="decimal"
                  className="input-dark"
                  value={draft.weight}
                  onChange={(e) => updateDraft(draft.key, { weight: e.target.value })}
                  placeholder={log.form.gym.weightPlaceholder}
                  min={0}
                  max={WEIGHT_KG_MAX}
                  step="any"
                />
              </div>
            </div>
            {status === 'incomplete' && (
              <p className="text-[10px] text-amber-400">{log.form.gym.incompleteRow}</p>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([...drafts, emptyDraft()])}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-sm text-gray-400 hover:text-white transition-colors"
        style={{ borderColor: 'var(--grey-light)' }}
      >
        <Plus size={16} />
        {log.form.gym.addExercise}
      </button>

      {entries.length > 0 && (
        <p className="text-xs text-gray-400">{log.form.gym.summary(entries.length, volume)}</p>
      )}
    </div>
  )
}
