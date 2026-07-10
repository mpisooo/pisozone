import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  value: number
  /** Come mostrare il valore interpolato (default: intero arrotondato). */
  format?: (n: number) => string
  durationMs?: number
}

// Numero che "sale" fino al valore invece di comparire secco (roadmap v2,
// pilastro 01 punto 4). Presentazionale puro: rAF + ease-out cubico, zero
// dipendenze. Al primo mount parte da 0; se il valore cambia (es. i crediti
// dopo un claim) riparte da quello mostrato in quel momento. Con "riduci
// movimento" attivo salta ogni animazione e mostra subito il valore finale.
export default function AnimatedNumber({ value, format, durationMs = 700 }: Props) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  const shownRef = useRef(shown)

  useEffect(() => {
    if (prefersReducedMotion()) {
      shownRef.current = value
      setShown(value)
      return
    }
    const from = shownRef.current
    if (from === value) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / durationMs, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = from + (value - from) * eased
      shownRef.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  return <>{format ? format(shown) : String(Math.round(shown))}</>
}
