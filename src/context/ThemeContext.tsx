import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { THEME_CSS_VARS, VALID_THEME_IDS, type ThemeId } from '../lib/levels'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('pz-theme')
    if (stored && VALID_THEME_IDS.includes(stored as ThemeId)) return stored as ThemeId
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    const vars = THEME_CSS_VARS[theme]
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val)
    })
    const isLight = theme === 'light' || theme === 'white'
    document.documentElement.classList.toggle('light', isLight)
    localStorage.setItem('pz-theme', theme)
  }, [theme])

  function setTheme(t: ThemeId) {
    setThemeState(t)
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
