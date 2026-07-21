import { useEffect, useId, useState } from 'react'

interface Props {
  points: { label: string; value: number }[]
  ariaLabel: string
  width?: number
  height?: number
  formatValue?: (v: number) => string
}

// Andamento nel tempo — area+linea SVG puro, stesso stile di
// ElevationProfileChart/ExerciseProgressionChart: niente tooltip a comparsa
// (inutile su mobile senza hover), il valore dell'ultimo punto resta sempre
// leggibile come annotazione, poche etichette sull'asse per non affollarlo.
export default function AreaTrendChart({ points, ariaLabel, width = 300, height = 140, formatValue }: Props) {
  const clipId = useId()
  const hasData = points.length >= 2

  const padX = 4
  const padTop = 16
  const padBottom = 18
  const maxV = Math.max(...points.map((p) => p.value), 1)
  const usableW = width - 2 * padX
  const usableH = height - padTop - padBottom

  const projected = points.map((p, i) => ({
    x: padX + (points.length > 1 ? (i / (points.length - 1)) * usableW : usableW / 2),
    y: padTop + usableH - (p.value / maxV) * usableH,
  }))
  const line = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const baseline = (height - padBottom).toFixed(1)
  const area = hasData
    ? `${projected[0].x.toFixed(1)},${baseline} ${line} ${projected[projected.length - 1].x.toFixed(1)},${baseline}`
    : ''
  const last = points[points.length - 1]

  // Al più 5 etichette sull'asse, sempre includendo la prima e l'ultima.
  const tickCount = Math.min(5, points.length)
  const tickIdxs = [...new Set(
    Array.from({ length: tickCount }, (_, i) => Math.round((i * (points.length - 1)) / (tickCount - 1 || 1)))
  )]

  // Disegno da sinistra a destra (roadmap v5, pilastro 01 punto 1): un
  // rettangolo di clip animato scopre linea/area/etichetta finale, invece di
  // farle comparire già complete. Le etichette d'asse restano FUORI dal clip
  // (sono un riferimento, non un dato che si "disegna"). La dipendenza sulla
  // stringa `line` fa ripartire il disegno anche quando i punti cambiano
  // (es. filtro periodo in Statistiche), non solo al primo mount.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    setRevealed(false)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setRevealed(true))
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [line])

  if (!hasData) return null

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <clipPath id={clipId}>
        <rect
          x={0} y={0} width={revealed ? width : 0} height={height}
          style={{ transition: 'width 1s var(--ease-out)' }}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <polygon points={area} fill="rgba(var(--accent-rgb),0.15)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--red)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x={projected[projected.length - 1].x}
          y={Math.max(10, projected[projected.length - 1].y - 8)}
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          fill="var(--color-text)"
        >
          {formatValue ? formatValue(last.value) : last.value}
        </text>
      </g>
      {tickIdxs.map((i) => (
        <text
          key={i}
          x={projected[i].x}
          y={height - 4}
          textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          fontSize={9}
          fill="var(--color-text)"
          opacity={0.55}
        >
          {points[i].label}
        </text>
      ))}
    </svg>
  )
}
