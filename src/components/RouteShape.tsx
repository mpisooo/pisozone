import { useEffect, useRef, useState } from 'react'
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
  const lineRef = useRef<SVGPolylineElement>(null)
  // Il percorso si disegna invece di comparire già tracciato (roadmap v5,
  // pilastro 01 punto 2) — stroke-dasharray/dashoffset sulla lunghezza reale
  // del tracciato (getTotalLength, misurabile solo a elemento montato: nel
  // frame prima della misura la linea resta invisibile via opacity, mai un
  // lampo del tracciato completo). Il traguardo (cerchio bianco) appare con
  // un ritardo che segue la fine del disegno, non prima.
  const [dashLen, setDashLen] = useState<number | null>(null)
  const [drawn, setDrawn] = useState(false)
  const hasData = points.length >= 2
  const projected = hasData ? projectToViewBox(points, width, height, 16) : []
  const path = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

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
  }, [path])

  if (!hasData) return null
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
        ref={lineRef}
        points={path}
        fill="none"
        stroke="var(--red)"
        strokeWidth={3}
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
      <circle cx={startPoint.x} cy={startPoint.y} r={4} fill="var(--red)" opacity={0.5} />
      <circle
        cx={endPoint.x}
        cy={endPoint.y}
        r={5}
        fill="white"
        stroke="var(--red)"
        strokeWidth={2}
        style={{ opacity: drawn ? 1 : 0, transition: 'opacity .3s ease .85s' }}
      />
    </svg>
  )
}
