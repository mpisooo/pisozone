import { useState, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  onClose: () => void
}

export default function DeleteAccountModal({ onClose }: Props) {
  const { user } = useAuth()
  const username: string = user?.user_metadata?.username ?? ''
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  const confirmed = confirmText.trim().toLowerCase() === username.toLowerCase() && username !== ''

  const handleDelete = async () => {
    if (!confirmed || deleting) return
    setDeleting(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setError('Sessione scaduta: fai di nuovo il login e riprova.')
      setDeleting(false)
      return
    }

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      setError('Eliminazione non riuscita. Controlla la connessione e riprova.')
      setDeleting(false)
      return
    }

    // Account eliminato sul server: pulisce la sessione locale e riparte da zero.
    try { await supabase.auth.signOut() } catch { /* l'utente non esiste più, il logout server può fallire */ }
    window.location.href = '/auth'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Elimina account"
        className="w-full max-h-[88vh] overflow-y-auto rounded-t-2xl p-4 space-y-4"
        style={{ background: 'var(--grey-dark)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center -mb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--grey-light)' }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bebas text-2xl text-[#F44352] tracking-wider">ELIMINA ACCOUNT</span>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="p-1 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div
          className="flex items-start gap-2.5 rounded-lg p-3 text-sm leading-relaxed"
          style={{ background: 'rgba(244,67,82,0.1)', border: '1px solid rgba(244,67,82,0.35)' }}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#F44352]" />
          <p className="text-gray-300">
            Questa azione è <strong className="text-[#F44352]">definitiva e irreversibile</strong>: verranno
            eliminati profilo, attività, statistiche, medaglie, crediti, messaggi, amicizie e foto.
            Nessun dato potrà essere recuperato.
          </p>
        </div>

        <p className="text-xs text-gray-500">
          Vuoi prima una copia dei tuoi dati? Chiudi questa finestra e usa "Esporta i miei dati".
        </p>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Per confermare, scrivi il tuo username: <strong className="text-white">{username}</strong>
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="input-dark"
            placeholder={username}
            autoCapitalize="none"
            autoComplete="off"
          />
        </div>

        {error && (
          <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'rgba(244,67,82,0.12)', color: '#F44352' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-[white] transition-all active:scale-95 disabled:opacity-40 bg-[#F44352]"
          >
            <Trash2 size={15} />
            {deleting ? 'Eliminazione…' : 'Elimina per sempre'}
          </button>
        </div>
      </div>
    </div>
  )
}
