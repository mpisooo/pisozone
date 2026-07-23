import { useState } from 'react'
import { X } from 'lucide-react'
import { hasSeenTip, markTipSeen, type TipId } from '../lib/contextualTips'
import common from '../lib/i18n/common'

interface Props {
  tipId: TipId
  icon: string
  title: string
  text: string
  // Margini/posizionamento a carico della pagina ospitante (es. px-4 in
  // pagine senza padding a livello di container) — nullo quando il tip è
  // già stato chiuso, non lascia mai un div vuoto con margine residuo.
  className?: string
}

// Suggerimento contestuale one-shot (P1-02): non un dialog bloccante — resta
// nel flusso della pagina, si chiude da solo dopo la prima chiusura e non
// blocca l'interazione con il resto della schermata (niente focus trap).
export default function ContextualTip({ tipId, icon, title, text, className }: Props) {
  const [dismissed, setDismissed] = useState(() => hasSeenTip(tipId))
  if (dismissed) return null

  const dismiss = () => {
    markTipSeen(tipId)
    setDismissed(true)
  }

  return (
    <div
      className={`card flex items-start gap-3 ${className ?? ''}`}
      style={{ borderColor: 'var(--red)', background: 'rgba(var(--accent-rgb),0.06)' }}
    >
      <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{text}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={common.close}
        className="p-1 -mt-1 -mr-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}
