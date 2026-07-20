export interface BarStatItem {
  key: string
  label: string
  value: number
  color?: string
}

interface Props {
  items: BarStatItem[]
  ariaLabel: string
  height?: number
  color?: string
  referenceValue?: number
  referenceLabel?: string
  showValueLabels?: boolean
  formatValue?: (v: number) => string
}

// Grafico a colonne in puro CSS (niente SVG/lib) — lo stile nato con "Carico
// settimanale" (roadmap v3, pilastro 02), generalizzato per rimpiazzare i
// BarChart di recharts nel pilastro 04: bottone niente hover, valore sempre
// visibile sopra la colonna invece del tooltip.
export default function BarStatChart({
  items,
  ariaLabel,
  height = 112,
  color = 'var(--red)',
  referenceValue,
  referenceLabel,
  showValueLabels = true,
  formatValue,
}: Props) {
  if (items.length === 0) return null
  const labelReserve = showValueLabels ? 20 : 0
  const usableH = height - labelReserve
  const maxValue = Math.max(...items.map((i) => i.value), referenceValue ?? 0, 1)
  const referenceOffset = referenceValue != null ? Math.round((referenceValue / maxValue) * usableH) : null

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative flex items-end gap-1.5" style={{ height }}>
        {referenceOffset != null && (
          <>
            <div
              className="absolute left-0 right-0 border-t border-dashed"
              style={{ bottom: referenceOffset, borderColor: 'var(--grey-light)' }}
            />
            {referenceLabel && (
              <span className="absolute right-0 text-[9px] text-gray-500" style={{ bottom: referenceOffset + 3 }}>
                {referenceLabel}
              </span>
            )}
          </>
        )}
        {items.map((item) => {
          const barH = Math.max(item.value > 0 ? 4 : 2, Math.round((item.value / maxValue) * usableH))
          return (
            <div key={item.key} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
              {showValueLabels && item.value > 0 && (
                <span className="text-[9px] text-gray-500 tabular-nums leading-none">
                  {formatValue ? formatValue(item.value) : item.value}
                </span>
              )}
              <div className="w-full rounded-t" style={{ height: barH, background: item.color ?? color }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {items.map((item) => (
          <span key={item.key} className="flex-1 text-center text-[9px] text-gray-500 truncate">{item.label}</span>
        ))}
      </div>
    </div>
  )
}
