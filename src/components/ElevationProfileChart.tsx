import type { ElevationSample } from '../lib/gps'
import log from '../lib/i18n/log'

interface Props {
  samples: ElevationSample[]
  width?: number
  height?: number
  className?: string
}

// Se il percorso è quasi piatto il range verticale si allarga a un minimo
// fisso, altrimenti pochi metri di rumore residuo riempirebbero il grafico
// come una scalata (l'asse Y non parte da zero, è centrato sulla quota media).
const MIN_RANGE_M = 10

// Profilo altimetrico quota/distanza — SVG puro come RouteShape, niente
// librerie grafiche per un'area con una linea sola.
export default function ElevationProfileChart({ samples, width = 280, height = 72, className }: Props) {
  if (samples.length < 2) return null
  const maxDist = samples[samples.length - 1].distKm
  if (maxDist <= 0) return null

  const pad = 4
  const alts = samples.map((s) => s.altitudeM)
  const minAlt = Math.min(...alts)
  const maxAlt = Math.max(...alts)
  const range = Math.max(maxAlt - minAlt, MIN_RANGE_M)
  const topAlt = (maxAlt + minAlt) / 2 + range / 2
  const usableW = width - 2 * pad
  const usableH = height - 2 * pad

  const projected = samples.map((s) => ({
    x: pad + (s.distKm / maxDist) * usableW,
    y: pad + ((topAlt - s.altitudeM) / range) * usableH,
  }))
  const line = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const baseline = (height - pad).toFixed(1)
  const area = `${projected[0].x.toFixed(1)},${baseline} ${line} ${projected[projected.length - 1].x.toFixed(1)},${baseline}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={log.elevation.chartAriaLabel}
    >
      <polygon points={area} fill="rgba(var(--accent-rgb),0.15)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--red)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
