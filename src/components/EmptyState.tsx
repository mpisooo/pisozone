import type { ReactNode } from 'react'
import { EMPTY_STATE_PATHS, type EmptyStateIcon } from '../lib/emptyStatePaths'

interface Props {
  icon: EmptyStateIcon
  title: string
  hint?: ReactNode
  cta?: string
  onCta?: () => void
  // Variante ridotta per gli stati vuoti dentro card già piene (es. lista amici)
  compact?: boolean
}

// Stato vuoto illustrato (roadmap v3, pilastro 01 punto 5): al posto delle
// emoji nel cerchio pastello, un pittogramma della famiglia dell'app nel
// cerchio all'accento (lo stesso trattamento della card vuota di Home). Il
// contenitore (card, padding) resta a carico della pagina. Il pittogramma è
// decorativo: titolo e testo raccontano già tutto agli screen reader.
export default function EmptyState({ icon, title, hint, cta, onCta, compact }: Props) {
  const circle = compact ? 'w-16 h-16' : 'w-24 h-24'
  return (
    <div className="text-center">
      <div
        className={`${circle} rounded-full flex items-center justify-center text-[var(--red)] mx-auto ${compact ? 'mb-2' : 'mb-4'}`}
        style={{ background: 'rgba(var(--accent-rgb),0.1)' }}
      >
        <svg
          width={compact ? 36 : 52}
          height={compact ? 36 : 52}
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {EMPTY_STATE_PATHS[icon]}
        </svg>
      </div>
      <p className={`font-bebas text-white tracking-wider mb-1 ${compact ? 'text-xl' : 'text-2xl'}`}>{title}</p>
      {hint && <p className="text-sm text-gray-500 leading-relaxed">{hint}</p>}
      {cta && (
        <button type="button" className="btn-primary px-6 py-2 text-sm mt-5" onClick={onCta}>
          {cta}
        </button>
      )}
    </div>
  )
}
