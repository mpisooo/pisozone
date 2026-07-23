import { useState } from 'react'
import { Download, X } from 'lucide-react'
import {
  useInstallPromptEvent,
  isStandalonePwa,
  isIosDevice,
  isInstallPromptDismissed,
  dismissInstallPrompt,
  clearInstallPromptEvent,
} from '../lib/pwaInstall'
import { useUpdateAvailable } from '../lib/serviceWorkerUpdate'
import shell from '../lib/i18n/shell'

interface Props {
  // Segnale di valore reale raggiunto (P2-02): tipicamente "almeno
  // un'attività registrata" — deciso dal chiamante (Home.tsx), non qui.
  show: boolean
}

// Prompt di installazione PWA (roadmap "PisoZone Next" P2-02): su Android/
// Chrome usa l'evento beforeinstallprompt catturato in main.tsx; su iOS
// Safari (dove quell'evento non esiste) mostra le istruzioni manuali già
// presenti nella landing pubblica, qui al momento giusto per chi è già
// dentro l'app. Su ogni altro browser (nessun evento, non iOS) non mostra
// nulla: non c'è un'azione concreta da offrire.
export default function PwaInstallPrompt({ show }: Props) {
  const deferredEvent = useInstallPromptEvent()
  const updateAvailable = useUpdateAvailable()
  const [dismissed, setDismissed] = useState(() => isInstallPromptDismissed())

  const dismiss = () => {
    dismissInstallPrompt()
    setDismissed(true)
  }

  // Stessa posizione fissa di UpdateAvailableToast (.toast-update): un
  // aggiornamento in corso ha priorità, non li si mostra sovrapposti.
  if (dismissed || !show || isStandalonePwa() || updateAvailable) return null

  const androidAvailable = deferredEvent !== null
  const iosAvailable = !androidAvailable && isIosDevice()
  if (!androidAvailable && !iosAvailable) return null

  const handleInstallClick = async () => {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    await deferredEvent.userChoice
    clearInstallPromptEvent()
    dismiss()
  }

  return (
    <div className="toast-enter toast-update flex items-center gap-3" role="status" aria-live="polite">
      <Download size={20} className="text-[var(--red)] shrink-0" />
      {androidAvailable ? (
        <>
          <p className="text-[var(--color-text)] font-semibold text-sm">{shell.pwaInstallPrompt.androidTitle}</p>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--red)', boxShadow: 'var(--glow-accent)' }}
          >
            {shell.pwaInstallPrompt.androidAction}
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-text)] font-semibold text-sm">{shell.pwaInstallPrompt.iosTitle}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{shell.pwaInstallPrompt.iosBody}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--red)', boxShadow: 'var(--glow-accent)' }}
          >
            {shell.pwaInstallPrompt.iosAction}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label={shell.pwaInstallPrompt.dismissAria}
        className="p-1 -m-1 text-gray-500 hover:text-white transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}
