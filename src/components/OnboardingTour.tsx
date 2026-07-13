import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getZoneByPercent } from '../lib/zones'
import { NEWS_VERSION } from './WhatsNewOverlay'
import shell from '../lib/i18n/shell'

const STEPS = shell.onboarding.steps

// Tour di benvenuto al primo accesso: si mostra solo se onboarding_seen è
// false (i nuovi profili nascono così dalla v25; undefined = migrazione non
// applicata → nascosto). Una volta chiuso, in qualunque modo, non torna più.
export default function OnboardingTour() {
  const { profile, updateProfile } = useProfile()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const visible = profile?.onboarding_seen === false && !closing

  const finish = async (goToLog: boolean) => {
    // Chiudi subito: se il salvataggio fallisce, il tour ricomparirà al
    // prossimo avvio — meglio che bloccare l'utente qui.
    setClosing(true)
    // Il tour copre già tutte le novità: chi lo completa non deve vedere
    // anche l'annuncio "Novità" (solo se la colonna v35 esiste, altrimenti
    // l'upsert fallirebbe e non salverebbe nemmeno onboarding_seen).
    updateProfile({
      onboarding_seen: true,
      ...(profile?.news_seen_version !== undefined ? { news_seen_version: NEWS_VERSION } : {}),
    })
    if (goToLog) navigate('/log')
  }

  useFocusTrap(panelRef, visible, () => finish(false))

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="celebration-backdrop fixed inset-0 z-[110] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={shell.onboarding.ariaLabel}
        className="celebration-pop w-full max-w-sm rounded-2xl p-6 text-center space-y-4"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="text-6xl" aria-hidden="true">{current.icon}</div>
        <h2 className="font-bebas text-3xl tracking-wider text-[var(--red)] leading-none">
          {current.title}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed min-h-16">{current.text}</p>
        {isLast && (
          <p className="text-xs text-gray-500">{shell.onboarding.guideHint}</p>
        )}

        {/* Indicatore di avanzamento: si scalda lungo lo spettro Zone via via
            che si procede, invece del solito pallino rosso fisso. */}
        <div className="flex justify-center gap-1.5" aria-label={shell.onboarding.stepIndicator(step + 1, STEPS.length)}>
          {STEPS.map((_, i) => {
            const zone = getZoneByPercent((i / (STEPS.length - 1)) * 100)
            const reached = i <= step
            return (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  background: reached ? zone.cssVar : 'var(--grey-light)',
                  boxShadow: i === step ? `0 0 8px ${zone.cssVar}` : 'none',
                }}
              />
            )
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              aria-label={shell.onboarding.back}
              className="p-2.5 rounded-lg transition-all active:scale-95"
              style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? finish(true) : setStep((s) => s + 1))}
            className="btn-primary flex-1"
          >
            {isLast ? shell.onboarding.finish : shell.onboarding.next}
          </button>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {shell.onboarding.skip}
          </button>
        )}
      </div>
    </div>
  )
}
