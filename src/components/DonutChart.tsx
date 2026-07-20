export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  slices: DonutSlice[]
  ariaLabel: string
  size?: number
}

// Torta a ciambella in puro CSS (conic-gradient), niente SVG/lib — il buco
// centrale usa lo sfondo di .card (--grey-dark) per fondersi con la card.
export default function DonutChart({ slices, ariaLabel, size = 160 }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (total <= 0) return null

  let cursor = 0
  const stops = slices.map((s) => {
    const pct = (s.value / total) * 100
    const stop = `${s.color} ${cursor}% ${cursor + pct}%`
    cursor += pct
    return stop
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="img"
        aria-label={ariaLabel}
        className="rounded-full relative flex-shrink-0"
        style={{ width: size, height: size, background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="absolute rounded-full" style={{ inset: size * 0.28, background: 'var(--grey-dark)' }} />
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 w-full">
        {slices.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            {s.label}
            <span className="text-gray-600">· {Math.round((s.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
