import type { RoutePoint } from '../types'

export interface TrackedPoint extends RoutePoint {
  t: number
  accuracyM?: number | null
}

export interface RouteStats {
  distanceKm: number
  avgSpeedKmh: number
  currentSpeedKmh: number
  paceMinPerKm: number | null
}

const EARTH_RADIUS_M = 6371000
const MAX_ACCEPTABLE_ACCURACY_M = 50

export function haversineMeters(a: RoutePoint, b: RoutePoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Scarta campioni GPS troppo imprecisi o che implicherebbero una velocità
// irrealistica rispetto al precedente (rimbalzo del segnale, non movimento reale).
export function isPlausibleSample(
  prev: TrackedPoint | null,
  next: TrackedPoint,
  maxSpeedKmh: number,
): boolean {
  if (next.accuracyM != null && next.accuracyM > MAX_ACCEPTABLE_ACCURACY_M) return false
  if (!prev) return true
  const dtSeconds = (next.t - prev.t) / 1000
  if (dtSeconds <= 0) return false
  const impliedSpeedKmh = (haversineMeters(prev, next) / dtSeconds) * 3.6
  return impliedSpeedKmh <= maxSpeedKmh
}

export function computeRouteStats(points: TrackedPoint[], elapsedMs: number): RouteStats {
  let distanceM = 0
  for (let i = 1; i < points.length; i++) {
    distanceM += haversineMeters(points[i - 1], points[i])
  }
  const distanceKm = distanceM / 1000
  const elapsedHours = elapsedMs / 3_600_000
  const avgSpeedKmh = elapsedHours > 0 ? distanceKm / elapsedHours : 0

  let currentSpeedKmh = 0
  if (points.length >= 2) {
    const a = points[points.length - 2]
    const b = points[points.length - 1]
    const dtSeconds = (b.t - a.t) / 1000
    if (dtSeconds > 0) currentSpeedKmh = (haversineMeters(a, b) / dtSeconds) * 3.6
  }

  const paceMinPerKm = distanceKm > 0 ? elapsedMs / 60000 / distanceKm : null

  return { distanceKm, avgSpeedKmh, currentSpeedKmh, paceMinPerKm }
}

export interface KmSplit {
  index: number // 1-based: "1° km", "2° km", ...
  distanceKm: number // 1 per gli split completi, < 1 per l'ultimo parziale
  durationMs: number
  paceMinPerKm: number
  partial: boolean
}

const SPLIT_M = 1000
// Sotto questa distanza l'ultimo tratto parziale è rumore GPS o la semplice
// fermata finale: un passo calcolato su pochi metri sarebbe privo di senso.
const MIN_PARTIAL_M = 50

// Segmenta il percorso in blocchi cumulativi da 1 km e calcola il passo di
// ciascuno. Il confine di ogni km cade quasi sempre a metà di un segmento tra
// due campioni: l'istante di attraversamento è interpolato linearmente sulla
// distanza, così il tempo del tratto a cavallo si ripartisce tra i due split.
// L'ultimo blocco sotto il km è marcato `partial` con la sua distanza reale,
// mai spacciato per uno split completo. Il tempo è quello tra i campioni
// (wall clock): un'eventuale pausa del tracciamento gonfia lo split in cui
// cade, limite noto e accettato per i percorsi già registrati.
export function computeSplits(points: TrackedPoint[]): KmSplit[] {
  // Stessa difesa di isPlausibleSample: un campione con timestamp non
  // crescente non è un movimento reale e va ignorato (i punti storici in
  // activity_routes sono già filtrati, ma la funzione non deve fidarsi).
  const clean: TrackedPoint[] = []
  for (const p of points) {
    const prev = clean[clean.length - 1]
    if (prev && p.t <= prev.t) continue
    clean.push(p)
  }
  if (clean.length < 2) return []

  const splits: KmSplit[] = []
  let splitStartT = clean[0].t
  let distInSplitM = 0

  for (let i = 1; i < clean.length; i++) {
    let segM = haversineMeters(clean[i - 1], clean[i])
    let segStartT = clean[i - 1].t
    const segEndT = clean[i].t
    // Un segmento lungo può attraversare più confini di km in un colpo solo.
    while (distInSplitM + segM >= SPLIT_M) {
      const neededM = SPLIT_M - distInSplitM
      const crossT = segStartT + (segEndT - segStartT) * (segM > 0 ? neededM / segM : 0)
      const durationMs = crossT - splitStartT
      splits.push({
        index: splits.length + 1,
        distanceKm: 1,
        durationMs,
        paceMinPerKm: durationMs / 60000,
        partial: false,
      })
      splitStartT = crossT
      segStartT = crossT
      segM -= neededM
      distInSplitM = 0
    }
    distInSplitM += segM
  }

  const lastT = clean[clean.length - 1].t
  if (distInSplitM >= MIN_PARTIAL_M && lastT > splitStartT) {
    const durationMs = lastT - splitStartT
    const distanceKm = distInSplitM / 1000
    splits.push({
      index: splits.length + 1,
      distanceKm,
      durationMs,
      paceMinPerKm: durationMs / 60000 / distanceKm,
      partial: true,
    })
  }

  return splits
}

// Proietta lat/lng in coordinate SVG per disegnare la sagoma del percorso
// (non una mappa reale): correzione cos(latMedia) sulla longitudine perché un
// grado di longitudine copre meno terreno di uno di latitudine man mano che ci
// si allontana dall'equatore (in Italia, ~41-46°N, senza correzione la sagoma
// risulterebbe visibilmente schiacciata in orizzontale).
export function projectToViewBox(
  points: RoutePoint[],
  width: number,
  height: number,
  padding: number,
): { x: number; y: number }[] {
  if (points.length === 0) return []

  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const avgLat = (minLat + maxLat) / 2
  const lngScale = Math.cos((avgLat * Math.PI) / 180)

  const spanX = (Math.max(...lngs) - minLng) * lngScale
  const spanY = maxLat - minLat
  const usableW = width - 2 * padding
  const usableH = height - 2 * padding
  const scale = Math.min(
    spanX > 0 ? usableW / spanX : Infinity,
    spanY > 0 ? usableH / spanY : Infinity,
  )
  const finiteScale = Number.isFinite(scale) ? scale : 1

  const offsetX = (width - spanX * finiteScale) / 2
  const offsetY = (height - spanY * finiteScale) / 2

  return points.map((p) => ({
    x: offsetX + (p.lng - minLng) * lngScale * finiteScale,
    y: offsetY + (maxLat - p.lat) * finiteScale,
  }))
}
