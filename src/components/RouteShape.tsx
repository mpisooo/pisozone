import { projectToViewBox } from '../lib/gps'
import log from '../lib/i18n/log'
import type { RoutePoint } from '../types'

interface Props {
  points: RoutePoint[]
  width?: number
  height?: number
  className?: string
}

// Sagoma stilizzata del percorso (non una mappa reale, vedi lib/gps.ts): serve
// a mostrare la forma del tracciato senza scaricare tile da servizi esterni.
export default function RouteShape({ points, width = 280, height = 160, className }: Props) {
  if (points.length < 2) return null
  const projected = projectToViewBox(points, width, height, 16)
  const path = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const startPoint = projected[0]
  const endPoint = projected[projected.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={log.routeShapeAriaLabel}
    >
      <polyline
        points={path}
        fill="none"
        stroke="var(--red)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={startPoint.x} cy={startPoint.y} r={4} fill="var(--red)" opacity={0.5} />
      <circle cx={endPoint.x} cy={endPoint.y} r={5} fill="white" stroke="var(--red)" strokeWidth={2} />
    </svg>
  )
}
