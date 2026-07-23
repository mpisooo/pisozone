// Suggerimenti contestuali (roadmap "PisoZone Next" P1-02): al posto di
// spiegare crediti/sfide/programmi/social in slide upfront prima di qualunque
// azione reale, il tour di benvenuto (OnboardingTour.tsx) resta breve e un
// piccolo tip appare una sola volta quando l'utente incontra DAVVERO quella
// sezione per la prima volta. Puramente client (localStorage), nessuna nuova
// colonna profilo: un tip mancato non è mai un problema serio, quindi non
// serve farlo sopravvivere al cambio dispositivo.
const STORAGE_PREFIX = 'pz-tip-seen-'

export type TipId = 'challenges' | 'social'

export function hasSeenTip(id: TipId): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id) === '1'
  } catch {
    // Storage inaccessibile: meglio non mostrare mai un tip che rischia di
    // restare bloccato per sempre che mostrarlo ripetutamente.
    return true
  }
}

export function markTipSeen(id: TipId): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, '1')
  } catch {
    // Best effort, coerente con lib/i18n/language.ts
  }
}
