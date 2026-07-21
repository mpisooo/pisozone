import { useEffect, useState, type ReactNode } from 'react'

export interface PisoRingSegment {
  key: string
  /** 0-100+: la geometria dell'arco è clampata a 100, il valore grezzo resta
   * utile a chi calcola il colore (es. getZoneByPercent tratta ≥100 come
   * "Picco" per segnalare un obiettivo superato). */
  pct: number
  color: string
}

interface PisoRingProps {
  /** Dal più esterno al più interno. */
  rings: PisoRingSegment[]
  center?: ReactNode
  /** Testo alternativo per screen reader: l'SVG è puramente decorativo. */
  srSummary?: string
  size?: number
  strokeWidth?: number
  gap?: number
}

// Componente presentazionale puro (nessuna logica PisoZone): disegna N
// anelli concentrici stile Apple Activity. Chi lo usa decide percentuali e
// colori — qui vive solo la geometria SVG.
export default function PisoRing({
  rings, center, srSummary, size = 172, strokeWidth = 14, gap = 6,
}: PisoRingProps) {
  const c = size / 2

  // Riempimento animato all'ingresso: il primo frame disegna gli anelli
  // vuoti, poi il valore reale arriva e la transition sullo stroke-dashoffset
  // (già presente sui cerchi) fa il resto. Il doppio rAF garantisce che lo
  // stato "vuoto" venga davvero dipinto prima del cambio; con "riduci
  // movimento" la transition è azzerata dal CSS globale, quindi l'anello
  // appare comunque subito pieno.
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFilled(true))
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [])

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {rings.map((ring, i) => {
          const r = c - strokeWidth / 2 - i * (strokeWidth + gap)
          if (r <= 0) return null
          const circumference = 2 * Math.PI * r
          const clamped = Math.min(Math.max(ring.pct, 0), 100)
          const offset = circumference * (1 - (filled ? clamped : 0) / 100)
          // L'anello che si chiude (roadmap v5, pilastro 01 punto 3): al
          // 100% un impulso di luce breve segna il traguardo — non i confetti
          // riservati a livelli/medaglie, un bagliore che si accende e si
          // spegne una sola volta (mai in loop: un anello già pieno non deve
          // pulsare per sempre a ogni apertura di Home). Il ritardo
          // dell'animazione insegue la transition di riempimento qui sopra,
          // così il bagliore parte proprio quando l'anello finisce di
          // chiudersi.
          const isComplete = filled && clamped >= 100
          return (
            <g key={ring.key}>
              <circle cx={c} cy={c} r={r} fill="none" stroke="var(--grey)" strokeWidth={strokeWidth} />
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={isComplete ? 'piso-ring-complete' : undefined}
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.2, 0.64, 1)',
                  ...(isComplete ? ({ '--ring-color': ring.color } as React.CSSProperties) : {}),
                }}
              />
            </g>
          )
        })}
      </svg>

      {center && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {center}
        </div>
      )}

      {srSummary && <span className="sr-only">{srSummary}</span>}
    </div>
  )
}
