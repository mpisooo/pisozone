import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { haptic } from '../lib/haptics'

interface ToastCtx {
  showError: (message: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

// Toast d'errore globale: usato dagli hook per segnalare fallimenti di fetch che
// altrimenti si tradurrebbero in uno stato vuoto indistinguibile da "nessun dato".
export function ToastProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showError = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    haptic('error')
    setError(message)
    timerRef.current = setTimeout(() => setError(null), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {error && (
        <div className="toast-enter toast-error flex items-center gap-3">
          <AlertTriangle size={22} className="text-[var(--red)] shrink-0" />
          <p className="text-[var(--color-text)] text-sm">{error}</p>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast used outside ToastProvider')
  return ctx
}
