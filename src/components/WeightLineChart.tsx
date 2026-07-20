export interface WeightChartPoint {
  label: string
  value: number | null
}

interface Props {
  points: WeightChartPoint[]
  ariaLabel: string
  width?: number
  height?: number
  referenceValue?: number | null
  referenceLabel?: string
  formatValue?: (v: number) => string
}

// Linea SVG pura per serie con eventuali buchi (peso non pesato ogni
// settimana): un polyline per ogni tratto contiguo di valori noti, come
// connectNulls di recharts — collega solo entro lo stesso tratto, mai
// attraverso un buco. Stesso stile di ExerciseProgressionChart (ultimo
// valore annotato, prima/ultima etichetta in basso, niente tooltip).
export default function WeightLineChart({
  points, ariaLabel, width = 300, height = 130, referenceValue, referenceLabel, formatValue,
}: Props) {
  const known = points.filter((p) => p.value != null)
  if (known.length < 2) return null

  const padX = 8
  const padTop = 16
  const padBottom = 20
  const values = known.map((p) => p.value as number)
  const allValues = referenceValue != null ? [...values, referenceValue] : values
  const minV = Math.min(...allValues)
  const maxV = Math.max(...allValues)
  const range = Math.max(maxV - minV, 1)
  const usableW = width - 2 * padX
  const usableH = height - padTop - padBottom
  const n = points.length

  const xFor = (i: number) => padX + (n > 1 ? (i / (n - 1)) * usableW : usableW / 2)
  const yFor = (v: number) => padTop + ((maxV - v) / range) * usableH

  const segments: { x: number; y: number }[][] = []
  let current: { x: number; y: number }[] = []
  points.forEach((p, i) => {
    if (p.value == null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push({ x: xFor(i), y: yFor(p.value) })
    }
  })
  if (current.length) segments.push(current)

  const firstKnownIdx = points.findIndex((p) => p.value != null)
  let lastKnownIdx = firstKnownIdx
  points.forEach((p, i) => { if (p.value != null) lastKnownIdx = i })
  const referenceY = referenceValue != null ? yFor(referenceValue) : null

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {referenceY != null && (
        <>
          <line
            x1={padX} x2={width - padX} y1={referenceY} y2={referenceY}
            stroke="var(--color-text)" strokeOpacity={0.3} strokeDasharray="5 3"
          />
          {referenceLabel && (
            <text x={width - padX} y={referenceY - 4} textAnchor="end" fontSize={9} fill="var(--color-text)" opacity={0.55}>
              {referenceLabel}
            </text>
          )}
        </>
      )}
      {segments.map((seg, i) => (
        <polyline
          key={i}
          points={seg.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none"
          stroke="var(--red)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {points.map((p, i) => p.value != null && (
        <circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3} fill="var(--red)" />
      ))}
      <text
        x={xFor(lastKnownIdx)}
        y={Math.max(10, yFor(points[lastKnownIdx].value as number) - 8)}
        textAnchor="end"
        fontSize={11}
        fontWeight={600}
        fill="var(--color-text)"
      >
        {formatValue ? formatValue(points[lastKnownIdx].value as number) : points[lastKnownIdx].value}
      </text>
      <text x={xFor(firstKnownIdx)} y={height - 6} fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {points[firstKnownIdx].label}
      </text>
      <text x={xFor(n - 1)} y={height - 6} textAnchor="end" fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {points[n - 1].label}
      </text>
    </svg>
  )
}
