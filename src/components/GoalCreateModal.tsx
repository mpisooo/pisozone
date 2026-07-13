import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, addDays } from 'date-fns'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import {
  GOAL_METRICS, METRIC_NEEDS_DISTANCE, clampTarget, presetRange,
  type GoalMetric,
} from '../lib/goals'
import goalsText from '../lib/i18n/goals'
import type { ActivityType, PersonalGoal } from '../types'

type Period = 'week' | 'month' | 'custom'

interface Props {
  onClose: () => void
  onCreate: (goal: Pick<PersonalGoal, 'metric' | 'target' | 'activity_type' | 'starts_on' | 'ends_on'>) => Promise<boolean>
  working: boolean
}

// Modale di creazione di un obiettivo personale (v36): metrica + traguardo +
// sport opzionale + periodo. Per i km il picker sport mostra solo le attività
// con distanza — un obiettivo che non può avanzare non deve nascere.
export default function GoalCreateModal({ onClose, onCreate, working }: Props) {
  const [metric, setMetric] = useState<GoalMetric>('sessions')
  const [sport, setSport] = useState<ActivityType | ''>('')
  const [target, setTarget] = useState('')
  const [period, setPeriod] = useState<Period>('month')
  const today = format(new Date(), 'yyyy-MM-dd')
  const [customStart, setCustomStart] = useState(today)
  const [customEnd, setCustomEnd] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  // Blocco dello scroll del body finché la modale è aperta (pattern iOS)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const sportOptions = METRIC_NEEDS_DISTANCE[metric]
    ? ACTIVITY_OPTIONS.filter((o) => o.hasDist)
    : ACTIVITY_OPTIONS

  const changeMetric = (m: GoalMetric) => {
    setMetric(m)
    // Uno sport senza distanza non è valido per i km: si torna a "tutti"
    if (METRIC_NEEDS_DISTANCE[m] && sport && !ACTIVITY_OPTIONS.find((o) => o.value === sport)?.hasDist) {
      setSport('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parsedTarget = clampTarget(metric, target)
    if (parsedTarget === null) {
      setErrorMsg(goalsText.create.targetInvalid)
      return
    }

    const range = period === 'custom'
      ? { starts_on: customStart, ends_on: customEnd }
      : presetRange(period)
    if (period === 'custom' && (range.ends_on < range.starts_on || range.ends_on < today)) {
      setErrorMsg(goalsText.create.customEndInvalid)
      return
    }

    const ok = await onCreate({
      metric,
      target: parsedTarget,
      activity_type: sport === '' ? null : sport,
      ...range,
    })
    if (ok) onClose()
  }

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={goalsText.create.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{goalsText.create.title}</h2>
          <button type="button" onClick={onClose} aria-label={goalsText.create.cancel} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">{goalsText.create.metricLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_METRICS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => changeMetric(m)}
                  aria-pressed={metric === m}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    metric === m ? 'border-[var(--red)] text-white' : 'border-transparent text-gray-400'
                  }`}
                  style={{ background: metric === m ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
                >
                  {goalsText.metricLabels[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="goal-sport" className="block text-xs text-gray-400 mb-1">{goalsText.create.sportLabel}</label>
            <select
              id="goal-sport"
              value={sport}
              onChange={(e) => setSport(e.target.value as ActivityType | '')}
              className="input-dark"
            >
              <option value="">{goalsText.create.allSports}</option>
              {sportOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="goal-target" className="block text-xs text-gray-400 mb-1">
              {goalsText.create.targetLabel} ({goalsText.metricLabels[metric].toLowerCase()})
            </label>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              step="any"
              min={1}
              className="input-dark"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={goalsText.create.targetPlaceholder}
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{goalsText.create.periodLabel}</p>
            <div className="flex gap-2 flex-wrap">
              {([['week', goalsText.create.periodWeek], ['month', goalsText.create.periodMonth], ['custom', goalsText.create.periodCustom]] as [Period, string][]).map(([p, label]) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    period === p ? 'bg-[var(--red)] text-[white]' : 'text-gray-400'
                  }`}
                  style={period === p ? undefined : { background: 'var(--grey)' }}
                >
                  {label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="min-w-0">
                  <label htmlFor="goal-start" className="block text-xs text-gray-400 mb-1">{goalsText.create.customStartLabel}</label>
                  <input id="goal-start" type="date" className="input-dark w-full" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="goal-end" className="block text-xs text-gray-400 mb-1">{goalsText.create.customEndLabel}</label>
                  <input id="goal-end" type="date" className="input-dark w-full" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-[var(--red)] px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={working} className="btn-primary w-full disabled:opacity-60">
            {working ? goalsText.create.creating : goalsText.create.submit}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
