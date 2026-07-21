import { useEffect, useRef, useState } from 'react'
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
  const lineRef = useRef<SVGPolylineElement>(null)
  // Stesso disegno progressivo di RouteShape (roadmap v5, pilastro 01 punto
  // 2): l'area si dissolve in mentre la linea si traccia, mai comparsa già
  // completa.
  const [dashLen, setDashLen] = useState<number | null>(null)
  const [drawn, setDrawn] = useState(false)
  const hasData = samples.length >= 2 && samples[samples.length - 1].distKm > 0

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    setDashLen(el.getTotalLength())
    setDrawn(false)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDrawn(true))
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [samples])

  if (!hasData) return null

  const maxDist = samples[samples.length - 1].distKm
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
      <polygon
        points={area}
        fill="rgba(var(--accent-rgb),0.15)"
        style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1s var(--ease-out)' }}
      />
      <polyline
        ref={lineRef}
        points={line}
        fill="none"
        stroke="var(--red)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          dashLen == null
            ? { opacity: 0 }
            : {
                strokeDasharray: dashLen,
                strokeDashoffset: drawn ? 0 : dashLen,
                transition: 'stroke-dashoffset 1.1s var(--ease-out)',
              }
        }
      />
    </svg>
  )
}
