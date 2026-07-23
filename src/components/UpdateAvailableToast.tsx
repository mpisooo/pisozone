import { RefreshCw } from 'lucide-react'
import { useUpdateAvailable } from '../lib/serviceWorkerUpdate'
import shell from '../lib/i18n/shell'

// P0-08 (roadmap "PisoZone Next"): avviso discreto quando il service worker
// ha già attivato una nuova build mentre l'app era aperta — vedi
// lib/serviceWorkerUpdate.ts per il perché di skipWaiting()/controllerchange.
export default function UpdateAvailableToast() {
  const available = useUpdateAvailable()
  if (!available) return null

  return (
    <div className="toast-enter toast-update flex items-center gap-3" role="status" aria-live="polite">
      <RefreshCw size={20} className="text-[var(--red)] shrink-0" />
      <p className="text-[var(--color-text)] font-semibold text-sm">{shell.updatePrompt.title}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
        style={{ background: 'var(--red)', boxShadow: 'var(--glow-accent)' }}
      >
        {shell.updatePrompt.action}
      </button>
    </div>
  )
}
