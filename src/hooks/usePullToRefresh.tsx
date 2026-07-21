import { useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { haptic } from '../lib/haptics'

// Pull-to-refresh generico (roadmap v5, pilastro 03): su iOS in modalità
// standalone (il dispositivo dell'utente) l'overscroll-refresh nativo di
// Safari non esiste — stesso limite già noto per GPS in background/
// Background Sync. Stessa tecnica touch di Calendar.tsx (swipe mese), qui
// generalizzata in un hook riusabile: nessuna libreria, gli `handlers` vanno
// spalmati sul contenitore di pagina già esistente (mai un wrapper nuovo, per
// non rompere lo spacing `space-y-*` dei figli diretti) e `indicator` va reso
// come primo figlio. Il gesto risponde SOLO quando la pagina è già in cima
// (window.scrollY a 0 — .app-main non ha un suo overflow, scrolla la
// finestra); `overscroll-behavior-y: contain` in index.css evita il doppio
// effetto con il rimbalzo nativo.
const THRESHOLD = 64
const MAX_PULL = 96

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)
  const active = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing || window.scrollY > 0) return
    active.current = true
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!active.current || startY.current == null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0 || window.scrollY > 0) {
      active.current = false
      setDragging(false)
      setPull(0)
      return
    }
    setDragging(true)
    setPull(Math.min(dy * 0.45, MAX_PULL))
  }

  const endDrag = async () => {
    if (!active.current) {
      setDragging(false)
      return
    }
    active.current = false
    startY.current = null
    setDragging(false)
    if (pull >= THRESHOLD) {
      setRefreshing(true)
      haptic('light')
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPull(0)
  }

  const showIndicator = pull > 0 || refreshing
  const indicatorHeight = refreshing ? 48 : pull
  const progress = Math.min(pull / THRESHOLD, 1)

  const indicator = showIndicator ? (
    <div
      aria-hidden="true"
      className="flex items-center justify-center overflow-hidden"
      style={{ height: indicatorHeight, transition: dragging ? 'none' : 'height .25s var(--ease-out)' }}
    >
      <RefreshCw
        size={20}
        className={`text-[var(--red)] ${refreshing ? 'animate-spin' : ''}`}
        style={refreshing ? undefined : { opacity: progress, transform: `rotate(${progress * 180}deg)` }}
      />
    </div>
  ) : null

  return {
    indicator,
    handlers: { onTouchStart, onTouchMove, onTouchEnd: endDrag, onTouchCancel: endDrag },
  }
}
