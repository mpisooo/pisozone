import { describe, it, expect } from 'vitest'
import { haversineMeters, isPlausibleSample, computeRouteStats, projectToViewBox, type TrackedPoint } from './gps'

describe('haversineMeters', () => {
  it('calcola correttamente circa 1.11 km per 0.01° di latitudine', () => {
    const a = { lat: 45, lng: 9 }
    const b = { lat: 45.01, lng: 9 }
    expect(haversineMeters(a, b)).toBeCloseTo(1113, -1)
  })

  it('è zero per lo stesso punto', () => {
    const p = { lat: 45.4642, lng: 9.19 }
    expect(haversineMeters(p, p)).toBeCloseTo(0, 5)
  })
})

describe('isPlausibleSample', () => {
  it('accetta sempre il primo campione se l\'accuratezza è ragionevole', () => {
    const p: TrackedPoint = { lat: 45, lng: 9, t: 1000, accuracyM: 10 }
    expect(isPlausibleSample(null, p, 40)).toBe(true)
  })

  it('scarta un campione con accuratezza dichiarata troppo bassa', () => {
    const p: TrackedPoint = { lat: 45, lng: 9, t: 1000, accuracyM: 80 }
    expect(isPlausibleSample(null, p, 40)).toBe(false)
  })

  it('accetta un movimento plausibile per una corsa', () => {
    const prev: TrackedPoint = { lat: 45, lng: 9, t: 0, accuracyM: 10 }
    // ~14m in 5s ≈ 10 km/h, plausibile per una corsa (soglia 40 km/h)
    const next: TrackedPoint = { lat: 45.000126, lng: 9, t: 5000, accuracyM: 10 }
    expect(isPlausibleSample(prev, next, 40)).toBe(true)
  })

  it('scarta un salto che implicherebbe una velocità irrealistica', () => {
    const prev: TrackedPoint = { lat: 45, lng: 9, t: 0, accuracyM: 10 }
    // 1.1 km in 1s ≈ 4000 km/h: rimbalzo del segnale, non un vero movimento
    const next: TrackedPoint = { lat: 45.01, lng: 9, t: 1000, accuracyM: 10 }
    expect(isPlausibleSample(prev, next, 40)).toBe(false)
  })

  it('scarta due campioni con timestamp non crescente', () => {
    const prev: TrackedPoint = { lat: 45, lng: 9, t: 5000, accuracyM: 10 }
    const next: TrackedPoint = { lat: 45.0001, lng: 9, t: 5000, accuracyM: 10 }
    expect(isPlausibleSample(prev, next, 40)).toBe(false)
  })
})

describe('computeRouteStats', () => {
  it('ritorna zeri e passo nullo senza punti', () => {
    const stats = computeRouteStats([], 0)
    expect(stats.distanceKm).toBe(0)
    expect(stats.avgSpeedKmh).toBe(0)
    expect(stats.currentSpeedKmh).toBe(0)
    expect(stats.paceMinPerKm).toBeNull()
  })

  it('calcola distanza, velocità media e passo su un percorso semplice', () => {
    const points: TrackedPoint[] = [
      { lat: 45, lng: 9, t: 0 },
      { lat: 45.01, lng: 9, t: 6 * 60 * 1000 },
    ]
    // ~1.113 km in 6 minuti di camminata veloce
    const stats = computeRouteStats(points, 6 * 60 * 1000)
    expect(stats.distanceKm).toBeCloseTo(1.113, 2)
    expect(stats.avgSpeedKmh).toBeCloseTo(11.13, 1)
    expect(stats.paceMinPerKm).toBeCloseTo(6 / 1.113, 1)
    expect(stats.currentSpeedKmh).toBeCloseTo(11.13, 1)
  })
})

describe('projectToViewBox', () => {
  it('centra un singolo punto nel viewBox', () => {
    const [p] = projectToViewBox([{ lat: 45, lng: 9 }], 200, 100, 10)
    expect(p.x).toBeCloseTo(100, 5)
    expect(p.y).toBeCloseTo(50, 5)
  })

  it('mantiene tutti i punti dentro i confini del viewBox (con padding)', () => {
    const points = [
      { lat: 45.00, lng: 9.00 },
      { lat: 45.01, lng: 9.02 },
      { lat: 45.02, lng: 9.00 },
      { lat: 45.005, lng: 9.015 },
    ]
    const projected = projectToViewBox(points, 200, 100, 10)
    for (const p of projected) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(200)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(100)
    }
  })

  it('ritorna un array vuoto senza punti', () => {
    expect(projectToViewBox([], 200, 100, 10)).toEqual([])
  })
})
