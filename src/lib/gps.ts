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
