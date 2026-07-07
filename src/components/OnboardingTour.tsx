import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Step {
  icon: string
  title: string
  text: string
}

const STEPS: Step[] = [
  {
    icon: '🏃',
    title: 'BENVENUTO SU PISOZONE!',
    text: 'Registra ogni allenamento: 15 sport tra cui scegliere, con le calorie calcolate automaticamente in base al tuo profilo.',
  },
  {
    icon: '💎',
    title: 'GUADAGNA CREDITI',
    text: 'Ogni attività ti fa guadagnare crediti, e ogni giorno hai 3 sfide personalizzate che ne valgono altri. Completale prima di mezzanotte!',
  },
  {
    icon: '🔥',
    title: 'STREAK E MEDAGLIE',
    text: 'Allenati con costanza per far crescere il tuo streak — e se un giorno salti, puoi congelarlo con i crediti. Ti aspettano 18 medaglie e 10 livelli.',
  },
  {
    icon: '🎨',
    title: 'FAI TUO IL TUO SPAZIO',
    text: 'Spendi i crediti nella pagina Profilo: 6 temi colore per tutta l\'app e cornici speciali per il tuo avatar.',
  },
  {
    icon: '👥',
    title: 'MEGLIO IN COMPAGNIA',
    text: 'Nella sezione Amici trovi feed, classifica settimanale, messaggi e gruppi: aggiungi i tuoi amici e sfidatevi.',
  },
]

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
    updateProfile({ onboarding_seen: true })
    if (goToLog) navigate('/log')
  }

  useFocusTrap(panelRef, visible, () => finish(false))

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Benvenuto su PisoZone"
        className="w-full max-w-sm rounded-2xl p-6 text-center space-y-4"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)' }}
      >
        <div className="text-6xl" aria-hidden="true">{current.icon}</div>
        <h2 className="font-bebas text-3xl tracking-wider text-[var(--red)] leading-none">
          {current.title}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed min-h-16">{current.text}</p>

        {/* Indicatore di avanzamento */}
        <div className="flex justify-center gap-1.5" aria-label={`Passo ${step + 1} di ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? 'var(--red)' : 'var(--grey-light)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              aria-label="Indietro"
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
            {isLast ? 'Registra il primo allenamento!' : 'Avanti'}
          </button>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Salta il tour
          </button>
        )}
      </div>
    </div>
  )
}
