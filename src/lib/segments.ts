import type { RoutePoint } from '../types'
import { haversineMeters, type TrackedPoint } from './gps'

// Segmenti personali (roadmap v4, pilastro 02): un tratto scelto a mano su un
// percorso già registrato (due punti lungo la traccia, mai riconosciuti da
// un algoritmo automatico — scelta deliberata, vedi CLAUDE.md). Qui vive
// tutta la logica pura: riconoscimento di un attraversamento su un'attività
// futura, risoluzione dell'intervallo scelto in fase di creazione, PR.

export const SEGMENT_MATCH_TOLERANCE_M = 30
export const MIN_SEGMENT_DISTANCE_M = 50

export interface SegmentCandidate {
  segmentId: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
}

export interface SegmentMatch {
  segmentId: string
  timeSeconds: number
}

// Un segmento è "attraversato" se il percorso passa entro tolleranza dal
// punto di inizio e poi, più avanti nel tempo, entro tolleranza dal punto di
// fine — sempre il PRIMO campione che entra in tolleranza in entrambi i casi
// (non quello di minima distanza): su un percorso ad anello che ripassa più
// volte vicino allo stesso punto, "il primo passaggio" resta la lettura più
// prevedibile. Il tempo è la differenza tra i due istanti dei campioni scelti.
export function matchSegments(
  points: TrackedPoint[],
  candidates: SegmentCandidate[],
  toleranceM: number = SEGMENT_MATCH_TOLERANCE_M,
): SegmentMatch[] {
  const matches: SegmentMatch[] = []
  for (const c of candidates) {
    const startIdx = points.findIndex(
      (p) => haversineMeters(p, { lat: c.startLat, lng: c.startLng }) <= toleranceM,
    )
    if (startIdx === -1) continue
    let endIdx = -1
    for (let i = startIdx + 1; i < points.length; i++) {
      if (haversineMeters(points[i], { lat: c.endLat, lng: c.endLng }) <= toleranceM) {
        endIdx = i
        break
      }
    }
    if (endIdx === -1) continue
    const timeSeconds = (points[endIdx].t - points[startIdx].t) / 1000
    if (timeSeconds <= 0) continue
    matches.push({ segmentId: c.segmentId, timeSeconds })
  }
  return matches
}

// Distanza cumulata dal primo punto, campione per campione — la base su cui
// vive lo slider di creazione (si sceglie un intervallo in metri, non in
// indice di campione, che varierebbe con la frequenza di rilevamento GPS).
export function cumulativeDistances(points: RoutePoint[]): number[] {
  const cum: number[] = points.length > 0 ? [0] : []
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(points[i - 1], points[i]))
  }
  return cum
}

function nearestIndexAtDistance(cumDist: number[], targetM: number): number {
  let best = 0
  let bestDiff = Math.abs(cumDist[0] - targetM)
  for (let i = 1; i < cumDist.length; i++) {
    const diff = Math.abs(cumDist[i] - targetM)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return best
}

export interface SegmentRange {
  startIdx: number
  endIdx: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  distanceM: number
  timeSeconds: number
}

// Risolve l'intervallo scelto sugli slider (distanza cumulata in metri) nei
// due punti reali del percorso più vicini a quelle distanze. null se
// l'intervallo è troppo corto o degenere (stesso campione per inizio e fine,
// o timestamp non crescente — un percorso con un tratto percorso all'indietro
// nel tempo non produce un segmento valido).
export function segmentRangeFromDistances(
  points: TrackedPoint[],
  cumDist: number[],
  startM: number,
  endM: number,
): SegmentRange | null {
  if (points.length !== cumDist.length || points.length < 2) return null
  if (endM - startM < MIN_SEGMENT_DISTANCE_M) return null
  const startIdx = nearestIndexAtDistance(cumDist, startM)
  const endIdx = nearestIndexAtDistance(cumDist, endM)
  if (endIdx <= startIdx) return null
  const timeSeconds = (points[endIdx].t - points[startIdx].t) / 1000
  if (timeSeconds <= 0) return null
  return {
    startIdx,
    endIdx,
    startLat: points[startIdx].lat,
    startLng: points[startIdx].lng,
    endLat: points[endIdx].lat,
    endLng: points[endIdx].lng,
    distanceM: cumDist[endIdx] - cumDist[startIdx],
    timeSeconds,
  }
}

// Tempo migliore (minimo) di sempre per segmento, dallo storico dei
// tentativi — la base di confronto per i nuovi PR (stesso schema di
// buildPrMap in exerciseSets.ts, ma "vince" il valore più basso).
export function buildSegmentPrMap(attempts: { segment_id: string; time_seconds: number }[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const a of attempts) {
    const t = Number(a.time_seconds)
    if (!Number.isFinite(t) || t <= 0) continue
    const prev = map.get(a.segment_id)
    if (prev === undefined || t < prev) map.set(a.segment_id, t)
  }
  return map
}

// PR = tempo che batte il minimo storico, o primo tentativo in assoluto sul segmento.
export function isNewSegmentPr(segmentId: string, timeSeconds: number, prMap: Map<string, number>): boolean {
  const prev = prMap.get(segmentId)
  return prev === undefined || timeSeconds < prev
}

// Formatta un TEMPO su segmento ("0:42", "4:32", "1:05:10") — stesso schema
// di formatRaceTime (racePredictor.ts) ma da SECONDI, non minuti: i tempi sui
// segmenti sono spesso sotto il minuto, dove arrotondare da minuti perderebbe precisione.
export function formatSegmentTime(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
