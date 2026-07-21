import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Coins } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { TIER_LABELS } from '../lib/constants'
import { haptic } from '../lib/haptics'
import medals from '../lib/i18n/medals'
import type { MedalTier } from '../types'

interface Props {
  icon: string
  name: string
  tier: MedalTier
  credits: number
  onDone: () => void
}

const TIER_GLOW: Record<MedalTier, { c1: string; c2: string; darkText: boolean }> = {
  bronze:  { c1: '#f59e0b', c2: '#b45309', darkText: false },
  silver:  { c1: '#e2e8f0', c2: '#94a3b8', darkText: true },
  gold:    { c1: '#fde047', c2: '#eab308', darkText: true },
  diamond: { c1: '#22d3ee', c2: '#a855f7', darkText: false },
}

export default function MedalCelebrationOverlay({ icon, name, tier, credits, onDone }: Props) {
  const glow = TIER_GLOW[tier]
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onDone)

  useEffect(() => {
    haptic('celebrate')
  }, [])

  const confetti = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1.2,
        color: i % 2 === 0 ? glow.c1 : glow.c2,
        rotate: Math.random() * 360,
        size: 5 + Math.random() * 7,
      })),
    [glow.c1, glow.c2]
  )

  // Portal su body: come CelebrationOverlay — inline dentro la pagina, il
  // transform residuo di .page-enter la centrerebbe a metà pagina, non a schermo.
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={medals.celebration.unlockedAriaLabel(name)}
      className="fixed inset-0 z-[9999] flex items-center justify-center medal-celebration-backdrop"
      onClick={onDone}
    >
      {/* ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none medal-celebration-glow"
        style={{ background: `radial-gradient(circle at 50% 42%, ${glow.c1}40 0%, transparent 55%)` }}
      />

      {/* confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 0.4,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="medal-celebration-pop text-center px-6 relative" onClick={(e) => e.stopPropagation()}>
        {/* rays + rings + icon */}
        <div className="relative w-40 h-40 mx-auto mb-5 flex items-center justify-center">
          <div
            className="absolute inset-0 medal-celebration-rays"
            style={{ background: `repeating-conic-gradient(from 0deg, ${glow.c1}90 0deg 4deg, transparent 4deg 30deg)` }}
          />
          <div className="medal-celebration-ring" style={{ borderColor: glow.c1 }} />
          <div className="medal-celebration-ring" style={{ borderColor: glow.c2, animationDelay: '0.5s' }} />
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center text-6xl medal-celebration-icon-shine"
            style={{
              background: `linear-gradient(135deg, ${glow.c1}, ${glow.c2})`,
              boxShadow: `0 0 45px 10px ${glow.c1}55`,
            }}
          >
            {icon}
          </div>
        </div>

        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1" style={{ color: glow.c1 }}>
          {TIER_LABELS[tier]}
        </p>
        <p className="font-bebas text-3xl text-white tracking-wide mb-1">{medals.celebration.title}</p>
        <p className="font-bebas text-2xl mb-4" style={{ color: glow.c1 }}>{name}</p>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${glow.c1}55` }}
        >
          <Coins size={16} className="text-yellow-400" />
          <span className="text-white font-semibold text-sm">{medals.celebration.creditsEarned(credits)}</span>
        </div>

        <div>
          <button
            type="button"
            onClick={onDone}
            className="px-8 py-2.5 rounded-full font-bold text-sm tap"
            style={{
              background: `linear-gradient(90deg, ${glow.c1}, ${glow.c2})`,
              color: glow.darkText ? '#0D0D0D' : '#fff',
            }}
          >
            {medals.celebration.doneButton}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
