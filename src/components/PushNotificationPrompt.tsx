import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Loader2 } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useProfile } from '../hooks/useProfile'
import { subscribeToPush } from '../lib/push'

interface Props {
  userId: string
  onDone: () => void
}

export default function PushNotificationPrompt({ userId, onDone }: Props) {
  const { updateProfile } = useProfile()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  const dismiss = () => {
    if (working) return
    updateProfile({ push_prompt_seen: true })
    onDone()
  }

  useFocusTrap(panelRef, true, dismiss)

  const handleEnable = async () => {
    setWorking(true)
    const { error: err } = await subscribeToPush(userId)
    setWorking(false)
    updateProfile({ push_prompt_seen: true })
    if (err) { setError(err); return }
    onDone()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={dismiss}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Attiva le notifiche"
        className="w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-5 space-y-4"
        style={{ background: 'var(--grey-dark)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center -mb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--grey-light)' }} />
        </div>

        <div className="flex flex-col items-center text-center gap-3 pt-1">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(244,67,82,0.15)' }}
          >
            <Bell size={26} className="text-[#F44352]" />
          </div>
          <h2 className="font-bebas text-2xl text-white tracking-wider">ATTIVA LE NOTIFICHE</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Ricevi un promemoria se non ti alleni entro le 22:00, e un avviso per nuovi messaggi e
            richieste di amicizia — anche ad app chiusa.
          </p>
        </div>

        {error ? (
          <>
            <p className="text-xs text-[#F44352] text-center px-1">{error}</p>
            <p className="text-xs text-gray-500 text-center">
              Potrai riprovare quando vuoi da Profilo → Notifiche.
            </p>
            <button type="button" onClick={onDone} className="btn-primary w-full">
              Ho capito
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={dismiss}
                disabled={working}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 border border-gray-600 disabled:opacity-50"
              >
                Non ora
              </button>
              <button
                type="button"
                onClick={handleEnable}
                disabled={working}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {working ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                {working ? 'Attivazione...' : 'Attiva'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Potrai disattivarle o riattivarle quando vuoi da Profilo → Notifiche.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
