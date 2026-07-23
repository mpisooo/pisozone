import { useSyncExternalStore } from 'react'

// Prompt di installazione PWA contestuale (roadmap "PisoZone Next" P2-02):
// su Android/Chrome il browser emette `beforeinstallprompt` secondo i SUOI
// tempi (spesso prima che l'utente abbia visto valore reale) — va
// intercettato con preventDefault() e "congelato" qui, così è chi decide il
// momento giusto (PwaInstallPrompt.tsx, dopo un segnale di valore) a
// deciderne la comparsa, non l'euristica del browser. Su iOS Safari questo
// evento non esiste affatto: serve un'istruzione manuale (vedi isIosDevice).
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const listeners = new Set<() => void>()
let capturedEvent: BeforeInstallPromptEvent | null = null

export function captureInstallPromptEvent(e: Event): void {
  capturedEvent = e as BeforeInstallPromptEvent
  listeners.forEach((l) => l())
}

export function clearInstallPromptEvent(): void {
  capturedEvent = null
  listeners.forEach((l) => l())
}

function getSnapshot(): BeforeInstallPromptEvent | null {
  return capturedEvent
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallPromptEvent(): BeforeInstallPromptEvent | null {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// L'app gira già come PWA installata: mai proporre di installarla di nuovo.
export function isStandalonePwa(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

// UA sniffing inevitabile: nessuna API sostituisce "sei su iOS" per decidere
// se mostrare le istruzioni manuali (beforeinstallprompt non esiste su iOS,
// nessun altro segnale è disponibile). iPadOS 13+ si presenta come
// "Macintosh" nello user agent ma ha un touch screen, a differenza di un Mac.
export function isIosDevice(): boolean {
  try {
    const ua = window.navigator.userAgent
    const isAppleTouchDevice = /iPad|iPhone|iPod/.test(ua)
    const isIpadOsDisguisedAsMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
    return isAppleTouchDevice || isIpadOsDisguisedAsMac
  } catch {
    return false
  }
}

// Dismiss one-shot (client-only, localStorage): chi chiude il prompt non lo
// rivede più — non è mai bloccante per usare l'app (notIncluded dell'item).
const DISMISSED_KEY = 'pz-pwa-install-dismissed'

export function isInstallPromptDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return true
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Best effort
  }
}
