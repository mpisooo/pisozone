import { useMemo } from 'react'
import { computeSplits, computeElevationProfile, formatPaceClock, type TrackedPoint } from '../lib/gps'
import ElevationProfileChart from './ElevationProfileChart'
import log from '../lib/i18n/log'

interface Props {
  points: TrackedPoint[]
}

// Sezioni "passo per km" e "altimetria" derivate dal percorso: nate in
// ActivityEditModal, estratte per essere riusate identiche dal recap del
// dopo-allenamento (WorkoutRecapOverlay). Le regole restano quelle di sempre:
// gli split compaiono solo con almeno un km completo, l'altimetria solo se la
// quota è salvata e copre abbastanza percorso (computeElevationProfile → null).
export default function RouteInsights({ points }: Props) {
  const splits = useMemo(() => computeSplits(points), [points])
  const showSplits = splits.some((s) => !s.partial)
  const fastestPace = Math.min(...splits.map((s) => s.paceMinPerKm))
  const elevation = useMemo(() => computeElevationProfile(points), [points])

  if (!showSplits && !elevation) return null

  return (
    <>
      {showSplits && (
        <div className="pt-1 space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">{log.splits.title}</p>
          {splits.map((s) => (
            <div key={s.index} className="flex items-center gap-2">
              <span className={`text-[11px] tabular-nums w-16 flex-shrink-0 ${s.partial ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.partial
                  ? log.splits.partialLabel(s.distanceKm.toLocaleString('it-IT', { maximumFractionDigits: 2 }))
                  : log.splits.kmLabel(s.index)}
              </span>
              {/* Barra comparativa: lo split più veloce riempie tutta la
                  traccia, gli altri in proporzione (passo → velocità). */}
              <div className="progress-track flex-1 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((fastestPace / s.paceMinPerKm) * 100)}%`,
                    background: s.partial ? 'rgba(var(--accent-rgb),0.35)' : 'var(--red)',
                  }}
                />
              </div>
              <span className="text-[11px] text-white tabular-nums w-10 text-right flex-shrink-0">
                {formatPaceClock(s.paceMinPerKm)}
              </span>
            </div>
          ))}
        </div>
      )}
      {elevation && (
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{log.elevation.title}</p>
            <p className="text-[10px] text-gray-400 tabular-nums">
              {log.elevation.gain(Math.round(elevation.gainM))}
              {' · '}
              {log.elevation.loss(Math.round(elevation.lossM))}
              {' · '}
              {log.elevation.range(Math.round(elevation.minM), Math.round(elevation.maxM))}
            </p>
          </div>
          <ElevationProfileChart samples={elevation.samples} width={280} height={72} />
        </div>
      )}
    </>
  )
}
