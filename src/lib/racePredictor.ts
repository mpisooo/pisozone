import { parseISO, subDays, startOfDay } from 'date-fns'
import type { Activity } from '../types'

// Passo gara previsto (roadmap v4, pilastro 01): stima il tempo su 5K, 10K,
// mezza maratona e maratona con la formula di Riegel, applicata al miglior
// sforzo recente tra le corse comparabili — stesso principio di
// detectGpsRecords in workoutRecap.ts (il passo più veloce), qui esteso a
// distanze mai corse davvero. Nessuna estrapolazione se mancano dati
// sufficienti: mai un tempo inventato. Solo la corsa: la formula di Riegel
// nasce dal decadimento aerobico della corsa, non ha senso per bici/nuoto.

export const RACE_PREDICTOR_MIN_KM = 1
export const RACE_PREDICTOR_LOOKBACK_DAYS = 90
const RIEGEL_EXPONENT = 1.06

export interface RaceDistance {
  key: string
  label: string
  km: number
}

// Le 4 distanze da gara più comuni — non un catalogo configurabile, sono
// standard internazionali fissi.
export const RACE_DISTANCES: RaceDistance[] = [
  { key: '5k', label: '5K', km: 5 },
  { key: '10k', label: '10K', km: 10 },
  { key: 'half', label: 'Mezza maratona', km: 21.0975 },
  { key: 'marathon', label: 'Maratona', km: 42.195 },
]

export interface RacePrediction {
  key: string
  label: string
  km: number
  minutes: number
}

export interface RacePredictorResult {
  referenceKm: number
  referenceMinutes: number
  predictions: RacePrediction[]
}

export function predictRaceTimes(
  activities: Activity[],
  now: Date = new Date(),
): RacePredictorResult | null {
  const since = subDays(startOfDay(now), RACE_PREDICTOR_LOOKBACK_DAYS)
  const candidates = activities.filter((a) => {
    if (a.type !== 'corsa' || a.distance_km == null || a.duration_min <= 0) return false
    if (a.distance_km < RACE_PREDICTOR_MIN_KM) return false
    const d = parseISO(a.date)
    return d >= since && d <= now
  })
  if (candidates.length === 0) return null

  const best = candidates.reduce((fastest, a) => {
    const pace = a.duration_min / a.distance_km!
    const fastestPace = fastest.duration_min / fastest.distance_km!
    return pace < fastestPace ? a : fastest
  })

  const referenceKm = best.distance_km!
  const referenceMinutes = best.duration_min

  const predictions: RacePrediction[] = RACE_DISTANCES.map((d) => ({
    key: d.key,
    label: d.label,
    km: d.km,
    minutes: referenceMinutes * Math.pow(d.km / referenceKm, RIEGEL_EXPONENT),
  }))

  return { referenceKm, referenceMinutes, predictions }
}

// Formatta una DURATA totale di gara ("22:14", "1:46:02") — diverso da
// formatPaceClock (gps.ts), che formatta un PASSO (min/km), non un tempo totale.
export function formatRaceTime(totalMinutes: number): string {
  const totalSeconds = Math.round(totalMinutes * 60)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
