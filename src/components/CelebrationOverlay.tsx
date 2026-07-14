import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { haptic } from '../lib/haptics'

interface Props {
  icon: string
  title: string
  subtitle?: string
  onDone: () => void
  autoDismissMs?: number
}

const CONFETTI_COLORS = ['#F44352', '#FF5E63', '#FFD166', '#4ade80', '#60a5fa']

export default function CelebrationOverlay({ icon, title, subtitle, onDone, autoDismissMs = 2800 }: Props) {
  useEffect(() => {
    haptic('celebrate')
    const t = setTimeout(onDone, autoDismissMs)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 0.9,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    []
  )

  // Portal su body: renderizzato inline dentro una pagina, il transform
  // residuo di .page-enter farebbe da containing block per il fixed e la
  // celebrazione finirebbe centrata a metà dell'altezza della pagina, fuori
  // dal viewport — non al centro dello schermo.
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center celebration-backdrop"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onDone}
    >
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
      <div className="celebration-pop text-center px-6">
        <div className="text-7xl mb-3">{icon}</div>
        <p className="font-bebas text-4xl text-white tracking-widest">{title}</p>
        {subtitle && <p className="text-sm text-gray-300 mt-2">{subtitle}</p>}
      </div>
    </div>,
    document.body,
  )
}
