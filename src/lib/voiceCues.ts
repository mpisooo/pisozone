import { getLanguage } from './i18n/language'

// Coach vocale durante il tracciamento GPS (roadmap v8, pilastro 02):
// SpeechSynthesis nativa del browser, nessuna dipendenza nuova. Preferenza
// locale (non un dato personale da sincronizzare, come i temi), default OFF
// alla prima apertura — stesso pattern di lib/language.ts (localStorage
// avvolto in try/catch, l'ambiente Vitest 'node' non ha window).
const STORAGE_KEY = 'pz-voice-cues'

export function getVoiceCuesEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setVoiceCuesEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // preferenza persa solo per questa sessione, non un errore da segnalare
  }
}

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Safari iOS scarta silenziosamente ogni speak() non generato da un gesto
// utente diretto (stesso vincolo già noto per il Wake Lock). Il tap che avvia
// il GPS è quel gesto: un'utterance a volume zero qui sblocca il canale per
// tutta la sessione, comprese le chiamate successive innescate da
// watchPosition durante il tracciamento.
export function primeVoice(): void {
  if (!isVoiceSupported()) return
  try {
    const utterance = new SpeechSynthesisUtterance('')
    utterance.volume = 0
    window.speechSynthesis.speak(utterance)
  } catch {
    // il coach vocale è un extra: non deve mai rompere il tracciamento
  }
}

/** Annuncia `text` se il coach vocale è attivo e supportato dal browser. */
export function speak(text: string): void {
  if (!isVoiceSupported() || !getVoiceCuesEnabled()) return
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getLanguage() === 'en' ? 'en-US' : 'it-IT'
    window.speechSynthesis.speak(utterance)
  } catch {
    // il coach vocale è un extra: non deve mai rompere il tracciamento
  }
}
