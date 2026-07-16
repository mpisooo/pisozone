import type { ActivityType } from '../types'
import { MET, metForSpeed, type GpsTrackableType } from './constants'

export type ZoneId = 1 | 2 | 3 | 4

export interface ZoneDefinition {
  id: ZoneId
  label: string
  cssVar: string
  maxMet: number
}

// Tassonomia fissa a 4 zone (blu→verde→ambra→rosso), lo stesso linguaggio
// delle fasce di frequenza cardiaca usato da qualunque app fitness: non segue
// l'accento del tema attivo (eccezione deliberata come la scala BMI — qui il
// colore comunica un significato, non lo stile). Soglie tarate sui MET già
// in uso in constants.ts: yoga/camminata ricadono in Recupero, la maggior
// parte di sport di squadra/palestra in Moderata, gli sport più cardio in
// Intensa, la corsa (unico sport sopra 8.4 MET) in Picco.
export const ZONES: ZoneDefinition[] = [
  { id: 1, label: 'Recupero', cssVar: 'var(--zone-1)', maxMet: 3.9 },
  { id: 2, label: 'Moderata', cssVar: 'var(--zone-2)', maxMet: 6.4 },
  { id: 3, label: 'Intensa',  cssVar: 'var(--zone-3)', maxMet: 8.4 },
  { id: 4, label: 'Picco',    cssVar: 'var(--zone-4)', maxMet: Infinity },
]

export function getZoneByMet(met: number): ZoneDefinition {
  return ZONES.find((z) => met <= z.maxMet) ?? ZONES[ZONES.length - 1]
}

export function getZoneForActivity(type: ActivityType): ZoneDefinition {
  return getZoneByMet(MET[type])
}

// Per grandezze già espresse in percentuale (es. avanzamento verso un
// obiettivo): più ci si avvicina o si supera il 100%, più la zona si scalda.
// Usata dagli anelli di progresso (PisoRing, pillar 01 punto 2).
export function getZoneByPercent(pct: number): ZoneDefinition {
  if (pct >= 100) return ZONES[3]
  if (pct >= 70) return ZONES[2]
  if (pct >= 35) return ZONES[1]
  return ZONES[0]
}

// Zona "live" durante il tracciamento GPS (roadmap v3, pilastro 01 punto 6):
// stessa scala a 4 zone, ma con il MET derivato dalla velocità corrente (la
// tabella per fascia di calcCaloriesFromSpeed) invece che fisso per sport.
// Da fermi o senza una velocità valida si è in Recupero: nessuno sforzo.
export function zoneForSpeed(type: GpsTrackableType, speedKmh: number): ZoneDefinition {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) return ZONES[0]
  return getZoneByMet(metForSpeed(type, speedKmh))
}

// Il gradiente "spettro" vive come token CSS (--zone-spectrum in index.css,
// sezione Design tokens): qui si punta a quel token invece di ripeterne i
// valori, così resta UNA sola fonte anche per chi lo usa in JS/inline style.
export const ZONE_SPECTRUM_GRADIENT = 'var(--zone-spectrum)'
