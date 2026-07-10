import { useState, useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useAuth } from '../context/AuthContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import auth from '../lib/i18n/auth'

// Blocco non dismissibile per chi si è registrato prima dell'introduzione di
// Privacy Policy e Termini di Servizio: profiles.terms_accepted_at resta NULL
// finché l'utente non accetta (i nuovi account nascono già con now() come
// default, perché la registrazione richiede la spunta obbligatoria).
// Se il campo è undefined la migrazione v21 non è ancora applicata: il blocco
// resta disattivato per non chiudere fuori tutti.
export default function ConsentGate() {
  const { profile, updateProfile } = useProfile()
  const { signOut } = useAuth()
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  const mustAccept = profile?.terms_accepted_at === null
  // Niente chiusura con Esc: l'accettazione è l'unica via (oltre al logout)
  useFocusTrap(panelRef, mustAccept, () => {})

  if (!mustAccept) return null

  const handleAccept = async () => {
    if (!checked || saving) return
    setSaving(true)
    setError('')
    const { error: err } = await updateProfile({ terms_accepted_at: new Date().toISOString() })
    setSaving(false)
    if (err) setError(auth.consentGate.saveFailed)
  }

  const handleDecline = async () => {
    await signOut()
  }

  return (
    <div className="overlay-fade fixed inset-0 z-[60] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={auth.consentGate.ariaLabel}
        className="modal-pop w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--grey-dark)', border: '1px solid var(--grey)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--red)]" />
          <h2 className="font-bebas text-2xl text-white tracking-wider leading-none">{auth.consentGate.heading}</h2>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          {auth.consentGate.intro.before}<strong>{auth.legalLinks.privacyPolicy}</strong>{auth.consentGate.intro.middle}<strong>{auth.legalLinks.termsOfService}</strong>{auth.consentGate.intro.after}
        </p>

        {/* target=_blank: le pagine si aprono a parte, il blocco resta attivo */}
        <div className="flex gap-4 text-sm">
          <a href="/privacy" target="_blank" rel="noopener" className="text-[var(--red)] underline">{auth.legalLinks.privacyPolicy}</a>
          <a href="/termini" target="_blank" rel="noopener" className="text-[var(--red)] underline">{auth.legalLinks.termsOfService}</a>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--red)]"
          />
          <span className="text-xs text-gray-400 leading-relaxed">
            {auth.consentGate.checkboxLabel}
          </span>
        </label>

        {error && (
          <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--red)' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked || saving}
          className="btn-primary w-full disabled:opacity-40"
        >
          {saving ? auth.consentGate.accepting : auth.consentGate.accept}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {auth.consentGate.decline}
        </button>
      </div>
    </div>
  )
}
