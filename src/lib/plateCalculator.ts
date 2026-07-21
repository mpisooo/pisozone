// Calcolatore piastre (roadmap v4, pilastro 03): funzione pura, zero
// dipendenze. Algoritmo greedy dalla piastra più pesante alla più leggera,
// come si carica davvero un bilanciere — nessuna combinazione ottima cercata,
// non serve per il set standard di piastre disponibili in palestra.

export const DEFAULT_BAR_WEIGHT_KG = 20
export const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 1]

export interface PlateLoadResult {
  // Piastre da caricare su UN lato del bilanciere, dalla più pesante.
  perSideKg: number[]
  achievedKg: number
  // Quanto manca al peso richiesto per via della granularità delle piastre
  // disponibili (0 se il peso è raggiungibile esattamente).
  remainderKg: number
}

// Tolleranza per il confronto in virgola mobile (25+20+... si accumula).
const EPS = 1e-6

export function calcPlateLoad(
  targetKg: number,
  barWeightKg: number = DEFAULT_BAR_WEIGHT_KG,
  availablePlatesKg: number[] = AVAILABLE_PLATES_KG,
): PlateLoadResult {
  const perSideTarget = Math.max(0, (targetKg - barWeightKg) / 2)
  const sorted = [...availablePlatesKg].filter((p) => p > 0).sort((a, b) => b - a)
  const perSideKg: number[] = []
  let remaining = perSideTarget
  for (const plate of sorted) {
    while (remaining + EPS >= plate) {
      perSideKg.push(plate)
      remaining -= plate
    }
  }
  const achievedKg = barWeightKg + perSideKg.reduce((sum, p) => sum + p, 0) * 2
  const remainderKg = Math.max(0, Math.round((targetKg - achievedKg) * 100) / 100)
  return { perSideKg, achievedKg: Math.round(achievedKg * 100) / 100, remainderKg }
}
