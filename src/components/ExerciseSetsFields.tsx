import { useState } from 'react'
import { Plus, Trash2, Link2, X, Calculator, Timer } from 'lucide-react'
import {
  emptyDraft, draftStatus, draftsToEntries, totalVolumeKg,
  linkToPrevious, unlinkFromGroup, pruneOrphanGroups,
  EXERCISE_NAME_MAX, SETS_MAX, REPS_MAX, WEIGHT_KG_MAX,
  type ExerciseDraft,
} from '../lib/exerciseSets'
import { useRestTimer } from '../hooks/useRestTimer'
import { formatRestClock, REST_TIMER_STEP_SEC } from '../lib/restTimer'
import PlateCalculatorModal from './PlateCalculatorModal'
import log from '../lib/i18n/log'

interface Props {
  drafts: ExerciseDraft[]
  onChange: (drafts: ExerciseDraft[]) => void
  // Nomi già usati in passato, per la <datalist>: scrivere sempre lo stesso
  // nome è ciò che rende affidabili PR e record.
  suggestions: string[]
  // Prefisso per id/datalist unici tra Log ('log') e ActivityEditModal ('edit')
  idPrefix: string
  // Titolo/sottotitolo sovrascrivibili: RoutineCreateModal riusa questo stesso
  // editor per i blocchi di una routine (non un log di allenamento vero).
  title?: string
  hint?: string
  // Superset/drop set (roadmap v4, pilastro 03): le routine restano template
  // piatti, senza gruppi — false lì disattiva collegamento e badge.
  allowGrouping?: boolean
}

function parseWeightLoose(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

// Card del log palestra strutturato (roadmap v2, pilastro 02 punto 1),
// condivisa da Log.tsx, ActivityEditModal.tsx e RoutineCreateModal e mostrata
// solo per la palestra. Controllata dall'esterno come PerceivedMetricsFields:
// le bozze sono stringhe grezze (ogni campo può restare vuoto), la
// conversione a righe valide vive in lib/exerciseSets.ts. Superset/drop set e
// calcolatore piastre/timer di recupero (pilastro 03) vivono qui: sono
// concetti legati al singolo blocco/sessione, non al form che li ospita.
export default function ExerciseSetsFields({ drafts, onChange, suggestions, idPrefix, title, hint, allowGrouping = true }: Props) {
  const datalistId = `${idPrefix}-exercise-suggestions`
  const entries = draftsToEntries(drafts)
  const volume = totalVolumeKg(entries)
  const restTimer = useRestTimer()
  const [plateCalcTargetKg, setPlateCalcTargetKg] = useState<number | null>(null)
  const [plateCalcOpen, setPlateCalcOpen] = useState(false)

  const updateDraft = (key: string, patch: Partial<ExerciseDraft>) => {
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  const removeDraft = (key: string) => {
    onChange(pruneOrphanGroups(drafts.filter((d) => d.key !== key)))
  }

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{title ?? log.form.gym.title}</h2>
        <p className="text-xs text-gray-500 mt-1">{hint ?? log.form.gym.hint}</p>
      </div>

      {suggestions.length > 0 && (
        <datalist id={datalistId}>
          {suggestions.map((name) => <option key={name} value={name} />)}
        </datalist>
      )}

      {drafts.map((draft, i) => {
        const status = draftStatus(draft)
        return (
          <div
            key={draft.key}
            className="rounded-xl border p-2.5 space-y-2 stagger-in"
            style={{ borderColor: draft.groupId ? 'var(--red)' : 'var(--grey)', '--stagger-i': i } as React.CSSProperties}
          >
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
                onClick={() => { restTimer.start(); }}
                aria-label={log.form.gym.restTimerAria}
                className="p-2 text-gray-500 hover:text-[var(--red)] transition-colors shrink-0"
              >
                <Timer size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeDraft(draft.key)}
                aria-label={log.form.gym.removeAria(draft.exercise.trim())}
                className="p-2 -mr-1 text-gray-500 hover:text-[var(--red)] transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {allowGrouping && i > 0 && (
              draft.groupId ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="chip"
                    style={draft.setType === 'dropset'
                      ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
                      : { background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--red)' }}
                  >
                    {draft.setType === 'dropset' ? log.form.gym.dropsetBadge : log.form.gym.supersetBadge}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(unlinkFromGroup(drafts, draft.key))}
                    aria-label={log.form.gym.unlinkAria}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(linkToPrevious(drafts, draft.key))}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                >
                  <Link2 size={11} />
                  {log.form.gym.linkToPrevious}
                </button>
              )
            )}

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
                <div className="flex items-center gap-1">
                  <input
                    id={`${idPrefix}-weight-${draft.key}`}
                    type="number"
                    inputMode="decimal"
                    className="input-dark flex-1 min-w-0"
                    value={draft.weight}
                    onChange={(e) => updateDraft(draft.key, { weight: e.target.value })}
                    placeholder={log.form.gym.weightPlaceholder}
                    min={0}
                    max={WEIGHT_KG_MAX}
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={() => { setPlateCalcTargetKg(parseWeightLoose(draft.weight)); setPlateCalcOpen(true) }}
                    aria-label={log.form.gym.plateCalcAria}
                    className="p-2 text-gray-500 hover:text-[var(--red)] transition-colors shrink-0"
                  >
                    <Calculator size={16} />
                  </button>
                </div>
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

      {restTimer.active && restTimer.remainingMs != null && (
        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--grey)' }}>
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-[var(--red)]" />
            <span className="text-xs text-gray-400">{log.restTimer.label}</span>
            <span className="font-bebas text-2xl text-white tabular-nums">{formatRestClock(restTimer.remainingMs)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => restTimer.adjust(-REST_TIMER_STEP_SEC)}
              aria-label={log.restTimer.adjustLessAria}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              style={{ border: '1px solid var(--grey-light)' }}
            >
              −{REST_TIMER_STEP_SEC}
            </button>
            <button
              type="button"
              onClick={() => restTimer.adjust(REST_TIMER_STEP_SEC)}
              aria-label={log.restTimer.adjustMoreAria}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              style={{ border: '1px solid var(--grey-light)' }}
            >
              +{REST_TIMER_STEP_SEC}
            </button>
            <button
              type="button"
              onClick={restTimer.dismiss}
              aria-label={log.restTimer.dismissAria}
              className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-xs text-gray-400">{log.form.gym.summary(entries.length, volume)}</p>
      )}

      {plateCalcOpen && (
        <PlateCalculatorModal initialTargetKg={plateCalcTargetKg} onClose={() => setPlateCalcOpen(false)} />
      )}
    </div>
  )
}
