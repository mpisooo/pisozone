import { useEffect, useState } from 'react'
import shell from '../lib/i18n/shell'

type Phase = 'logo' | 'crossfade' | 'text' | 'exit'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('logo')

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase('crossfade'), 1400), // logo inizia a uscire
      setTimeout(() => setPhase('text'),      1950), // linea e tagline entrano
      setTimeout(() => setPhase('exit'),      3400), // overlay scuro
      setTimeout(onDone,                      3900),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onDone])

  const showLogo     = phase === 'logo' || phase === 'crossfade'
  const showWordmark = phase === 'crossfade' || phase === 'text' || phase === 'exit'

  // Layer helper: fullscreen flex centered
  const layer: React.CSSProperties = {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D0D0D', overflow: 'hidden', pointerEvents: 'none',
    }}>

      {/* ── Layer 1: emblema SVG ── */}
      {showLogo && (
        <div style={layer}>
          <div className={phase === 'logo' ? 'splash-emblem-in' : 'splash-emblem-out'}>
            <img
              src="/pisozone-logo.svg?v=2"
              alt="PisoZone"
              draggable={false}
              style={{ width: 'min(290px, 70vw)', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* ── Layer 2: wordmark PISOZONE ── */}
      {showWordmark && (
        <div style={{ ...layer, flexDirection: 'column' }}>

          {/* Il testo sale dalla posizione del wordmark nel SVG verso il centro */}
          <div
            className={phase === 'crossfade' ? 'splash-wordmark-rise' : ''}
            style={{ lineHeight: 1 }}
          >
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.8rem, 14vw, 4.5rem)',
              letterSpacing: '0.1em',
              color: '#f5f5f5',
            }}>PISO</span>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.8rem, 14vw, 4.5rem)',
              letterSpacing: '0.1em',
              color: '#F44352',
              filter: 'drop-shadow(0 0 18px rgba(244,67,82,0.7))',
            }}>ZONE</span>
          </div>

          {/* Linea e tagline: appaiono solo nella fase 'text' */}
          {(phase === 'text' || phase === 'exit') && (
            <>
              <div className="splash-line" />
              <p className="splash-tagline">{shell.splash.tagline}</p>
            </>
          )}
        </div>
      )}

      {/* ── Overlay di uscita ── */}
      {phase === 'exit' && <div className="splash-exit-overlay" />}
    </div>
  )
}
