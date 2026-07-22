import { useSyncExternalStore } from 'react'

// Preferenza lingua globale, letta dai proxy dei namespace (vedi ./proxy) e
// da chi deve forzare un remount alla UI (vedi AppLayout in App.tsx). Le
// pagine continuano a importare ogni namespace come oggetto statico
// (`import log from '../lib/i18n/log'`): lo switch avviene "sotto" quello
// stesso import, senza convertire ~180 file a un hook useStrings().
export type Language = 'it' | 'en'

const STORAGE_KEY = 'pz-language'
const listeners = new Set<() => void>()

// `localStorage` non esiste in ambiente Vitest ('node', vitest.config.ts) e
// i namespace i18n sono importati anche da moduli lib/ puri testati lì
// (dataExport, stats, shareCard, insights, perceivedMetrics): niente può
// esplodere al semplice import, quindi ogni accesso è best-effort.
function readStored(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'it'
  } catch {
    return 'it'
  }
}

let currentLanguage: Language = readStored()

export function getLanguage(): Language {
  return currentLanguage
}

export function setLanguage(lang: Language): void {
  if (lang === currentLanguage) return
  currentLanguage = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // best effort: la sessione tiene comunque la lingua in memoria
  }
  listeners.forEach((listener) => listener())
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Sottoscrive il componente chiamante ai cambi di lingua: usato in App.tsx
// per resettare (via key) il sottoalbero visibile quando l'utente cambia
// lingua dalle Impostazioni, così ogni pagina già montata rilegge i namespace col
// valore aggiornato senza bisogno di un reload manuale.
export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage)
}
