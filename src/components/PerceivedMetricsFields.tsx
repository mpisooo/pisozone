import { RPE_MIN, RPE_MAX, rpeLabel, rpeZone, MOOD_OPTIONS } from '../lib/perceivedMetrics'
import log from '../lib/i18n/log'

interface Props {
  rpe: number | null
  mood: number | null
  onRpeChange: (rpe: number | null) => void
  onMoodChange: (mood: number | null) => void
}

// Posizione del cursore quando rpe è ancora null: un valore di mezzo, mai
// salvato finché l'utente non tocca davvero lo slider (vedi onRpeChange).
const RPE_UNSET_THUMB = 5

// Card condivisa da Log.tsx (nuova attività) e ActivityEditModal.tsx
// (modifica) per le metriche percepite (roadmap v2, pilastro 02 punto 2).
// Controllata dall'esterno (non registrata su react-hook-form): entrambi i
// campi sono facoltativi e devono poter tornare a null, cosa che un
// <input type="range"> non rappresenta da solo.
export default function PerceivedMetricsFields({ rpe, mood, onRpeChange, onMoodChange }: Props) {
  const displayRpe = rpe ?? RPE_UNSET_THUMB
  const zone = rpeZone(displayRpe)

  return (
    <div className="card space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{log.form.perceived.rpeTitle}</h2>
          {rpe !== null && (
            <button
              type="button"
              onClick={() => onRpeChange(null)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {log.form.perceived.clear}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">{log.form.perceived.rpeHint}</p>

        <div className="flex items-baseline gap-2 mb-3">
          <span
            className="font-bebas text-3xl leading-none"
            style={{ color: rpe !== null ? zone.cssVar : 'var(--grey-light)' }}
          >
            {rpe ?? '–'}
          </span>
          <span className="text-xs text-gray-400">
            {rpe !== null ? rpeLabel(rpe) : log.form.perceived.rpeUnset}
          </span>
        </div>

        <input
          type="range"
          className="spectrum-slider"
          min={RPE_MIN}
          max={RPE_MAX}
          value={displayRpe}
          onChange={(e) => onRpeChange(Number(e.target.value))}
          aria-label={log.form.perceived.rpeAriaLabel(displayRpe)}
        />
      </div>

      <div>
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider mb-1">{log.form.perceived.moodTitle}</h2>
        <p className="text-xs text-gray-500 mb-3">{log.form.perceived.moodHint}</p>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map(({ value, label, Icon }) => {
            const isSelected = mood === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onMoodChange(isSelected ? null : value)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                  isSelected ? 'border-[var(--red)]' : 'border-transparent hover:border-gray-600'
                }`}
                style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)' }}
              >
                <Icon size={22} className={isSelected ? 'text-[var(--red)]' : 'text-gray-400'} />
                <span className="text-[10px] text-gray-300 text-center leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
