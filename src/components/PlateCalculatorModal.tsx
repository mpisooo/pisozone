import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { calcPlateLoad, DEFAULT_BAR_WEIGHT_KG } from '../lib/plateCalculator'
import log from '../lib/i18n/log'

interface Props {
  initialTargetKg: number | null
  onClose: () => void
}

// Calcolatore piastre (roadmap v4, pilastro 03): funzione pura in
// lib/plateCalculator.ts, qui solo la UI. Aperto dal bottone accanto al peso
// in ExerciseSetsFields, prefill col peso di quella riga se presente.
export default function PlateCalculatorModal({ initialTargetKg, onClose }: Props) {
  const [target, setTarget] = useState(initialTargetKg != null ? String(initialTargetKg) : '')
  const [barWeight, setBarWeight] = useState(String(DEFAULT_BAR_WEIGHT_KG))
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const targetKg = Number.parseFloat(target.replace(',', '.'))
  const barKg = Number.parseFloat(barWeight.replace(',', '.'))
  const result = useMemo(() => {
    if (!Number.isFinite(targetKg) || targetKg <= 0 || !Number.isFinite(barKg) || barKg < 0) return null
    return calcPlateLoad(targetKg, barKg)
  }, [targetKg, barKg])

  return createPortal(
    <div className="overlay-fade fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={log.plateCalculator.dialogAriaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-[var(--red)] tracking-wider">{log.plateCalculator.title}</h2>
          <button type="button" onClick={onClose} aria-label={log.plateCalculator.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="plate-target" className="block text-xs text-gray-400 mb-1">{log.plateCalculator.targetLabel}</label>
            <input
              id="plate-target"
              type="number"
              inputMode="decimal"
              className="input-dark"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              min={0}
              step="any"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="plate-bar" className="block text-xs text-gray-400 mb-1">{log.plateCalculator.barLabel}</label>
            <input
              id="plate-bar"
              type="number"
              inputMode="decimal"
              className="input-dark"
              value={barWeight}
              onChange={(e) => setBarWeight(e.target.value)}
              min={0}
              step="any"
            />
          </div>
        </div>

        {result && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--grey)' }}>
            <div>
              <p className="text-[10px] text-gray-400 mb-2">{log.plateCalculator.perSideLabel}</p>
              {result.perSideKg.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.perSideKg.map((p, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-sm font-bebas tracking-wide text-white"
                      style={{ background: 'rgba(var(--accent-rgb),0.25)', border: '1px solid var(--red)' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">{log.plateCalculator.noPlates}</p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{log.plateCalculator.achievedLabel}</span>
              <span className="font-bebas text-xl text-[var(--red)]">{result.achievedKg} kg</span>
            </div>
            {result.remainderKg > 0 && (
              <p className="text-[11px] text-amber-400">{log.plateCalculator.remainderHint(result.remainderKg)}</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
