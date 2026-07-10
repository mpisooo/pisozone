// Aptica centralizzata (roadmap v2, pilastro 01 punto 4). UNICA porta per il
// feedback tattile: mai chiamare navigator.vibrate direttamente nei componenti.
//
// Il motivo di questo modulo: navigator.vibrate NON esiste su iOS Safari — le
// vibrazioni inline usate finora non hanno mai funzionato sulla PWA iPhone,
// il dispositivo principale dell'utente. Su iOS l'unico canale aptico web è
// il tick nativo che Safari 17.4+ emette quando un <input type="checkbox"
// switch> viene commutato: qui un elemento nascosto viene cliccato via label
// ai tempi giusti per approssimare il pattern richiesto. Il tick rispetta da
// solo l'impostazione di sistema "Feedback aptico" dell'utente.

export type HapticKind = 'light' | 'success' | 'celebrate' | 'error'

/** Pattern in ms nel formato della Vibration API: [vibra, pausa, vibra, ...] */
export const HAPTIC_PATTERNS: Record<HapticKind, number[]> = {
  /** Conferma discreta di un gesto (long-press, sblocco slider, pausa). */
  light: [30],
  /** Azione andata a buon fine (salvataggio, claim sfida, freeze). */
  success: [100, 50, 100],
  /** Momento di festa (level-up, medaglia). */
  celebrate: [80, 40, 80, 40, 200],
  /** Errore mostrato all'utente (toast). */
  error: [60, 80, 60],
}

/**
 * Converte un pattern della Vibration API nei ritardi (ms dall'inizio) a cui
 * emettere il singolo tick iOS: uno all'attacco di ogni segmento di
 * vibrazione. iOS non ha durate: un segmento lungo resta un tick solo.
 */
export function iosTickDelays(pattern: number[]): number[] {
  const delays: number[] = []
  let t = 0
  for (let i = 0; i < pattern.length; i++) {
    if (i % 2 === 0) delays.push(t)
    t += pattern[i]
  }
  return delays
}

// Elemento switch nascosto, creato pigramente e riusato: ogni click() lo
// commuta e ogni commutazione emette un tick. display:none non lo silenzia,
// il feedback è legato all'evento di toggle, non alla visibilità.
let iosSwitch: HTMLLabelElement | null = null

function getIosSwitch(): HTMLLabelElement {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  return iosSwitch
}

/** Emette il feedback tattile richiesto, se la piattaforma lo consente. */
export function haptic(kind: HapticKind): void {
  const pattern = HAPTIC_PATTERNS[kind]
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
      return
    }
    const el = getIosSwitch()
    for (const delay of iosTickDelays(pattern)) {
      if (delay === 0) el.click()
      else setTimeout(() => el.click(), delay)
    }
  } catch {
    // il feedback tattile è un extra: non deve mai rompere il flusso
  }
}
