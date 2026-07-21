import { useEffect, useState } from 'react'

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
  const hasData = known.length >= 2

  // Ingresso in dissolvenza (roadmap v5, pilastro 01 punto 1; corretto il
  // 21/07/2026 — la prima versione usava un clip-path animato via url(),
  // rivelatosi inaffidabile su Safari/iOS: il clip poteva restare bloccato
  // e non rivelare mai il grafico, facendo sparire il punto di partenza del
  // peso e lasciando visibile solo l'ultimo valore annotato — esattamente il
  // bug segnalato). Un semplice fade in opacity su un <g> non ha questo
  // rischio. La linea di riferimento (peso obiettivo) e le etichette d'asse
  // restano fuori dal gruppo, sono un traguardo statico sempre visibile.
  // `known.length` nella dipendenza fa ripartire la dissolvenza quando la
  // serie cambia (nuova pesata, filtro periodo).
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    setRevealed(false)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setRevealed(true))
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [known.length, points.map((p) => p.value).join(',')])

  if (!hasData) return null

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
      <g style={{ opacity: revealed ? 1 : 0, transition: 'opacity .8s var(--ease-out)' }}>
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
        {/* Peso di partenza: prima solo un puntino senza numero, a differenza
            dell'ultimo valore — asimmetria che leggeva come "il grafico non
            mostra il peso iniziale". Etichettato allo stesso modo, ancorato
            a sinistra invece che a destra per non sovrapporsi al tracciato. */}
        {firstKnownIdx !== lastKnownIdx && (
          <text
            x={xFor(firstKnownIdx)}
            y={Math.max(10, yFor(points[firstKnownIdx].value as number) - 8)}
            textAnchor="start"
            fontSize={11}
            fontWeight={600}
            fill="var(--color-text)"
            opacity={0.75}
          >
            {formatValue ? formatValue(points[firstKnownIdx].value as number) : points[firstKnownIdx].value}
          </text>
        )}
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
      </g>
      <text x={xFor(firstKnownIdx)} y={height - 6} fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {points[firstKnownIdx].label}
      </text>
      <text x={xFor(n - 1)} y={height - 6} textAnchor="end" fontSize={9} fill="var(--color-text)" opacity={0.55}>
        {points[n - 1].label}
      </text>
    </svg>
  )
}
