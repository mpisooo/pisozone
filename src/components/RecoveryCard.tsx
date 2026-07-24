import { Droplets, Moon, BedDouble, Plus, Minus } from 'lucide-react'
import {
  canMarkRest, restRemainingInWeek, clampWater, clampSleep, waterPct,
  WATER_GLASS_ML, WATER_GOAL_ML, WATER_MAX_ML, SLEEP_START_H, SLEEP_MAX_H,
} from '../lib/recovery'
import { haptic } from '../lib/haptics'
import recovery from '../lib/i18n/recovery'
import type { RecoveryLog } from '../types'

// Colori semantici fissi, indipendenti dai 6 temi (stessa eccezione della
// scala BMI): l'acqua è azzurra e la notte è viola in ogni tema.
const WATER_COLOR = '#38BDF8'
const SLEEP_COLOR = '#A78BFA'

interface Props {
  todayLog: RecoveryLog | undefined
  restDates: string[]
  today: string // yyyy-MM-dd
  // Decisione prodotto (audit tecnico del 24/07/2026, P0-4): un giorno con
  // attività già registrate non è selezionabile come riposo.
  hasActivityToday: boolean
  onPatch: (patch: Partial<Pick<RecoveryLog, 'rest' | 'water_ml' | 'sleep_hours'>>) => void
}

function StepButton({ onClick, disabled, ariaLabel, children }: {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-8 h-8 rounded-full flex items-center justify-center border text-gray-300 tap disabled:opacity-30 flex-shrink-0"
      style={{ borderColor: 'var(--grey-light)', background: 'var(--grey)' }}
    >
      {children}
    </button>
  )
}

// Card "Recupero di oggi" in Home (roadmap v2, pilastro 02 punto 5):
// giorno di riposo (protegge la streak, max 2 a settimana), idratazione a
// bicchieri da 250 ml, ore di sonno. Controllata dall'esterno come
// PerceivedMetricsFields: lo stato vive in useRecovery, qui solo i tocchi.
export default function RecoveryCard({ todayLog, restDates, today, hasActivityToday, onPatch }: Props) {
  const rest = todayLog?.rest ?? false
  const waterMl = todayLog?.water_ml ?? 0
  const sleep = todayLog?.sleep_hours ?? null

  const restAllowed = canMarkRest(restDates, today, hasActivityToday)
  const remaining = restRemainingInWeek(restDates, today)
  const waterDone = waterMl >= WATER_GOAL_ML

  const toggleRest = () => {
    haptic('light')
    onPatch({ rest: !rest })
  }

  const changeWater = (deltaGlasses: number) => {
    const next = clampWater(waterMl + deltaGlasses * WATER_GLASS_ML)
    haptic(waterMl < WATER_GOAL_ML && next >= WATER_GOAL_ML ? 'success' : 'light')
    onPatch({ water_ml: next })
  }

  const changeSleep = (deltaHours: number) => {
    haptic('light')
    // Primo "+": parte dalla mediana adulta come cursore da aggiustare
    // (il valore si salva solo perché l'utente l'ha toccato, come l'RPE).
    const next = sleep == null ? SLEEP_START_H : clampSleep(sleep + deltaHours)
    onPatch({ sleep_hours: next })
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{recovery.cardTitle}</h2>

      {/* Giorno di riposo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <BedDouble size={16} className="flex-shrink-0 mt-0.5" style={{ color: rest ? SLEEP_COLOR : 'var(--grey-light)' }} />
          <div className="min-w-0">
            <p className="text-sm text-gray-300">{recovery.rest.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {rest
                ? recovery.rest.hintActive
                : hasActivityToday
                ? recovery.rest.hintHasActivity
                : restAllowed
                ? recovery.rest.hintAvailable(remaining)
                : recovery.rest.hintExhausted}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rest ? 'true' : 'false'}
          aria-label={recovery.rest.ariaLabel}
          onClick={toggleRest}
          disabled={!rest && !restAllowed}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 flex-shrink-0 mt-0.5 ${
            rest ? 'bg-[var(--red)]' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              rest ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Idratazione */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Droplets size={16} className="flex-shrink-0" style={{ color: WATER_COLOR }} />
            <span className="text-sm text-gray-300">{recovery.water.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <StepButton onClick={() => changeWater(-1)} disabled={waterMl <= 0} ariaLabel={recovery.water.removeAria}>
              <Minus size={14} />
            </StepButton>
            <span className="text-xs font-semibold text-white tabular-nums min-w-[72px] text-center">
              {recovery.water.value(waterMl, WATER_GOAL_ML)}
            </span>
            <StepButton onClick={() => changeWater(1)} disabled={waterMl >= WATER_MAX_ML} ariaLabel={recovery.water.addAria}>
              <Plus size={14} />
            </StepButton>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--grey)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${waterPct(waterMl)}%`, background: WATER_COLOR, transition: 'width 0.4s var(--ease-out)' }}
          />
        </div>
        {waterDone && <p className="text-[11px] text-green-400 mt-1.5">{recovery.water.goalReached}</p>}
      </div>

      {/* Sonno */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Moon size={16} className="flex-shrink-0" style={{ color: sleep != null ? SLEEP_COLOR : 'var(--grey-light)' }} />
            <div className="min-w-0">
              <p className="text-sm text-gray-300">{recovery.sleep.label}</p>
              <p className="text-[11px] text-gray-500">{recovery.sleep.hint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StepButton onClick={() => changeSleep(-0.5)} disabled={sleep == null || sleep <= 0} ariaLabel={recovery.sleep.removeAria}>
              <Minus size={14} />
            </StepButton>
            <span className="text-xs font-semibold text-white tabular-nums min-w-[44px] text-center">
              {sleep != null ? recovery.sleep.value(sleep) : recovery.sleep.unset}
            </span>
            <StepButton onClick={() => changeSleep(0.5)} disabled={sleep != null && sleep >= SLEEP_MAX_H} ariaLabel={recovery.sleep.addAria}>
              <Plus size={14} />
            </StepButton>
          </div>
        </div>
        {sleep != null && (
          <div className="text-right mt-1">
            <button
              type="button"
              onClick={() => { haptic('light'); onPatch({ sleep_hours: null }) }}
              className="text-[11px] text-gray-500 hover:text-white transition-colors"
            >
              {recovery.sleep.clear}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
