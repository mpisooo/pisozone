import { useState, useEffect, useRef, useCallback } from 'react'
import { haptic } from '../lib/haptics'
import { clampRestSeconds, remainingMs, DEFAULT_REST_TIMER_SEC } from '../lib/restTimer'

// Timer di recupero tra le serie (roadmap v4, pilastro 03): stato locale a
// un componente, nessuna persistenza (vedi lib/restTimer.ts per il perché).
// endsAt è l'istante reale di fine, mai un contatore che scala da solo — un
// tab in background non deve far perdere secondi al rientro.
export function useRestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  useEffect(() => {
    if (endsAt == null || firedRef.current) return
    if (remainingMs(endsAt, now) === 0) {
      firedRef.current = true
      haptic('success')
    }
  }, [endsAt, now])

  const start = useCallback((seconds: number = DEFAULT_REST_TIMER_SEC) => {
    firedRef.current = false
    const startNow = Date.now()
    setNow(startNow)
    setEndsAt(startNow + clampRestSeconds(seconds) * 1000)
  }, [])

  // Aggiusta la durata residua (+/- pochi secondi): se il timer era già a
  // zero, riparte da REST_TIMER_MIN_SEC + il delta invece di restare fermo.
  const adjust = useCallback((deltaSec: number) => {
    setEndsAt((prev) => {
      const base = prev == null ? 0 : remainingMs(prev, Date.now()) / 1000
      firedRef.current = false
      return Date.now() + clampRestSeconds(base + deltaSec) * 1000
    })
  }, [])

  const dismiss = useCallback(() => setEndsAt(null), [])

  return {
    active: endsAt != null,
    remainingMs: endsAt == null ? null : remainingMs(endsAt, now),
    start,
    adjust,
    dismiss,
  }
}
