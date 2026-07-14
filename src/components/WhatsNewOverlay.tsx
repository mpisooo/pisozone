import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import shell from '../lib/i18n/shell'

// Versione corrente dell'"ondata" di novità: incrementarla (e aggiornare
// shell.whatsNew.items) quando c'è una nuova infornata da annunciare. Chi ha
// profiles.news_seen_version più basso vede il pannello una volta al rientro.
export const NEWS_VERSION = 3

// Annuncio one-shot delle novità per gli utenti esistenti (v35): si mostra
// solo a tour di benvenuto già visto (i nuovi utenti hanno il tour, che copre
// tutto) e a colonna presente (undefined = migrazione non eseguita → nascosto,
// stesso pattern di onboarding_seen).
export default function WhatsNewOverlay() {
  const { profile, updateProfile } = useProfile()
  const navigate = useNavigate()
  const [closing, setClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const visible =
    !closing &&
    profile != null &&
    profile.onboarding_seen !== false &&
    profile.news_seen_version !== undefined &&
    profile.news_seen_version < NEWS_VERSION

  const dismiss = (openGuide: boolean) => {
    // Chiudi subito: se il salvataggio fallisce, l'annuncio ricomparirà al
    // prossimo avvio — meglio che bloccare l'utente qui.
    setClosing(true)
    updateProfile({ news_seen_version: NEWS_VERSION })
    if (openGuide) navigate('/guide')
  }

  useFocusTrap(panelRef, visible, () => dismiss(false))

  if (!visible) return null

  return (
    <div
      className="celebration-backdrop fixed inset-0 z-[110] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={shell.whatsNew.ariaLabel}
        className="celebration-pop w-full max-w-sm rounded-2xl p-6 space-y-4 max-h-[85dvh] flex flex-col"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="text-center">
          <h2 className="font-bebas text-3xl tracking-wider text-[var(--red)] leading-none">
            {shell.whatsNew.title}
          </h2>
          <p className="text-xs text-gray-500 mt-2">{shell.whatsNew.subtitle}</p>
        </div>

        <div className="space-y-3 overflow-y-auto overscroll-contain min-h-0">
          {shell.whatsNew.items.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'var(--grey)' }}>
              <span className="text-2xl flex-shrink-0" aria-hidden="true">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <button type="button" onClick={() => dismiss(false)} className="btn-primary w-full">
            {shell.whatsNew.gotIt}
          </button>
          <button
            type="button"
            onClick={() => dismiss(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors py-1.5"
          >
            <BookOpen size={13} />
            {shell.whatsNew.openGuide}
          </button>
        </div>
      </div>
    </div>
  )
}
