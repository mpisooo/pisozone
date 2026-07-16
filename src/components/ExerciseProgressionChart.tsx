import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ProgressionPoint } from '../lib/exerciseSets'
import stats from '../lib/i18n/stats'

interface Props {
  points: ProgressionPoint[]
  width?: number
  height?: number
}

// Se i carichi sono quasi costanti il range verticale si allarga a un minimo
// fisso: una serie piatta deve sembrare piatta, non un'altalena di rumore
// (stessa difesa di ElevationProfileChart).
const MIN_RANGE_KG = 10

// Progressione carichi per esercizio (roadmap v3, pilastro 01 punto 4) —
// SVG puro come ElevationProfileChart: una linea con i punti delle giornate,
// spaziate uniformemente (conta la sequenza delle sessioni, non i giorni di
// pausa tra l'una e l'altra). Niente recharts: per una linea sola non serve.
export default function ExerciseProgressionChart({ points, width = 280, height = 110 }: Props) {
  if (points.length < 2) return null

  const padX = 8
  const padTop = 14
  const padBottom = 22
  const weights = points.map((p) => p.weightKg)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = Math.max(maxW - minW, MIN_RANGE_KG)
  const top = (maxW + minW) / 2 + range / 2
  const usableW = width - 2 * padX
  const usableH = height - padTop - padBottom

  const projected = points.map((p, i) => ({
    x: padX + (points.length > 1 ? (i / (points.length - 1)) * usableW : usableW / 2),
    y: padTop + ((top - p.weightKg) / range) * usableH,
  }))
  const line = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const baseline = (height - padBottom).toFixed(1)
  const area = `${projected[0].x.toFixed(1)},${baseline} ${line} ${projected[projected.length - 1].x.toFixed(1)},${baseline}`

  const first = points[0]
  const last = points[points.length - 1]
  const fmtDate = (iso: string) => format(parseISO(iso), 'd MMM', { locale: it })

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={stats.progression.chartAriaLabel}
    >
      <polygon points={area} fill="rgba(var(--accent-rgb),0.12)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--red)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {projected.map((p, i) => (
        <circle key={points[i].date} cx={p.x} cy={p.y} r={3} fill="var(--red)" />
      ))}
      {/* Carico dell'ultima giornata, ancorato all'ultimo punto */}
      <text
        x={projected[projected.length - 1].x}
        y={Math.max(10, projected[projected.length - 1].y - 8)}
        textAnchor="end"
        fontSize={11}
        fontWeight={600}
        fill="var(--color-text)"
      >
        {stats.progression.pointValue(last.weightKg)}
      </text>
      {/* Estremi temporali della serie */}
      <text x={padX} y={height - 6} fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {fmtDate(first.date)}
      </text>
      <text x={width - padX} y={height - 6} textAnchor="end" fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {fmtDate(last.date)}
      </text>
    </svg>
  )
}
