import type { LucideIcon } from 'lucide-react'
import { Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react'
import { getZoneByPercent, type ZoneDefinition } from './zones'

// Metriche percepite (roadmap v2, pilastro 02 punto 2): RPE (sforzo
// percepito) e umore/energia post-sessione. Dati soggettivi, opzionali,
// pensati per gli insight futuri ("ti alleni meglio la mattina") più che per
// un obiettivo in sé — nessuna gamification agganciata qui.

export const RPE_MIN = 1
export const RPE_MAX = 10

// Scala di sforzo percepito (RPE, Borg CR10 semplificata 1-10) raggruppata in
// 5 fasce per dare un'etichetta leggibile allo slider oltre al numero nudo.
// Come le etichette di lib/zones.ts, sono dati di dominio non stringhe UI:
// stesso precedente (le label restano qui, non in lib/i18n).
const RPE_LEVELS: { max: number; label: string }[] = [
  { max: 2,  label: 'Leggero' },
  { max: 4,  label: 'Moderato' },
  { max: 6,  label: 'Impegnativo' },
  { max: 8,  label: 'Duro' },
  { max: 10, label: 'Massimale' },
]

export function rpeLabel(rpe: number): string {
  return (RPE_LEVELS.find((l) => rpe <= l.max) ?? RPE_LEVELS[RPE_LEVELS.length - 1]).label
}

// Riusa lo spettro Zone (lib/zones.ts) invece di una palette propria: lo
// sforzo percepito è la controparte soggettiva dell'intensità oggettiva da
// MET, ha senso condividano lo stesso linguaggio cromatico blu→verde→ambra→rosso.
export function rpeZone(rpe: number): ZoneDefinition {
  return getZoneByPercent((rpe / RPE_MAX) * 100)
}

export const MOOD_MIN = 1
export const MOOD_MAX = 5

export interface MoodOption {
  value: number
  label: string
  Icon: LucideIcon
}

// lucide-react ha già un set coerente di 5 espressioni — a differenza delle
// icone sportive (pilastro 01 punto 3) qui non serve disegnare nulla di
// nuovo, il set esiste ed è esattamente questo dominio.
export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Esausto',     Icon: Frown },
  { value: 2, label: 'Stanco',      Icon: Annoyed },
  { value: 3, label: 'Nella norma', Icon: Meh },
  { value: 4, label: 'Bene',        Icon: Smile },
  { value: 5, label: 'Alla grande', Icon: Laugh },
]

export function moodOption(mood: number): MoodOption | undefined {
  return MOOD_OPTIONS.find((o) => o.value === mood)
}
