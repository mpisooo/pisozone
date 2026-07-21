import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { THEME_CSS_VARS, VALID_THEME_IDS, type ThemeId } from '../lib/levels'

// Durata della dissolvenza al cambio tema (roadmap v5, pilastro 02 punto 4),
// coerente con .theme-transition in index.css.
const THEME_TRANSITION_MS = 450

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  toggleTheme: () => void
  syncProfileTheme: (t: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  syncProfileTheme: () => {},
})

const EXPLICIT_KEY = 'pz-theme-explicit'

function isExplicit() {
  return localStorage.getItem(EXPLICIT_KEY) === '1'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('pz-theme')
    if (stored && VALID_THEME_IDS.includes(stored as ThemeId)) return stored as ThemeId
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  // Cambio tema in dissolvenza, non a scatto (roadmap v5, pilastro 02 punto
  // 4) — SOLO sui cambi successivi al primo: al caricamento iniziale
  // dell'app il tema deve applicarsi subito, un fade lì mostrerebbe un lampo
  // del tema sbagliato prima di sfumare in quello giusto.
  const mountedRef = useRef(false)
  useEffect(() => {
    const root = document.documentElement
    if (mountedRef.current) {
      root.classList.add('theme-transition')
    }
    mountedRef.current = true

    const vars = THEME_CSS_VARS[theme]
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    const isLight = theme === 'light' || theme === 'white'
    root.classList.toggle('light', isLight)
    localStorage.setItem('pz-theme', theme)

    if (root.classList.contains('theme-transition')) {
      const timer = window.setTimeout(() => root.classList.remove('theme-transition'), THEME_TRANSITION_MS)
      return () => window.clearTimeout(timer)
    }
  }, [theme])

  // Finché l'utente non ha mai scelto esplicitamente un tema, segue live il
  // tema di sistema (utile per chi tiene l'app aperta a lungo e il telefono
  // passa da chiaro a scuro, es. al tramonto).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      if (isExplicit()) return
      setThemeState(e.matches ? 'light' : 'dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setTheme(t: ThemeId) {
    localStorage.setItem(EXPLICIT_KEY, '1')
    setThemeState(t)
  }

  function toggleTheme() {
    localStorage.setItem(EXPLICIT_KEY, '1')
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Sincronizza active_theme dal profilo DB (cross-device). Il default DB è
  // 'dark': se l'utente non ha mai scelto nulla esplicitamente, non deve
  // sovrascrivere il tema rilevato da prefers-color-scheme al primo avvio.
  function syncProfileTheme(t: ThemeId) {
    if (!isExplicit() && t === 'dark') return
    setThemeState(t)
    if (t !== 'dark') localStorage.setItem(EXPLICIT_KEY, '1')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, syncProfileTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
