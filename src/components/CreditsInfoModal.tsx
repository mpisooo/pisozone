import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Dumbbell, Target, Award } from 'lucide-react'
import { CHALLENGE_POOL } from '../lib/challenges'
import { TIER_CREDITS } from '../lib/constants'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  onClose: () => void
}

export default function CreditsInfoModal({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  const challengeCredits = CHALLENGE_POOL.map((c) => c.credits)
  const minChallenge = Math.min(...challengeCredits)
  const maxChallenge = Math.max(...challengeCredits)

  const ways = [
    {
      icon: <Dumbbell size={20} className="text-[var(--red)]" />,
      title: 'Registra attività',
      description: '1 💎 ogni 10 minuti di attività, fino a un massimo di 10 💎 al giorno.',
    },
    {
      icon: <Target size={20} className="text-[var(--red)]" />,
      title: 'Sfide giornaliere',
      description: `Da ${minChallenge} a ${maxChallenge} 💎 a sfida completata, fino a 3 sfide al giorno.`,
    },
    {
      icon: <Award size={20} className="text-[var(--red)]" />,
      title: 'Medaglie sbloccate',
      description: `Bonus una tantum allo sblocco: 🥉 ${TIER_CREDITS.bronze} · 🥈 ${TIER_CREDITS.silver} · 🥇 ${TIER_CREDITS.gold} · 💎 ${TIER_CREDITS.diamond}`,
    },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Come guadagnare crediti"
        className="w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-4 space-y-4"
        style={{ background: 'var(--grey-dark)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center -mb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--grey-light)' }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bebas text-2xl text-white tracking-wider">💎 COME GUADAGNARE CREDITI</span>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="p-1 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 pb-2">
          {ways.map((w) => (
            <div key={w.title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--grey)' }}>
              <div className="mt-0.5 shrink-0">{w.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{w.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{w.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Usa i crediti per sbloccare livelli, temi e cornici nella pagina Profilo.
        </p>
      </div>
    </div>,
    document.body
  )
}
