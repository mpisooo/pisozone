import { describe, it, expect } from 'vitest'
import { haversineMeters, isPlausibleSample, computeRouteStats, computeSplits, computeElevationProfile, projectToViewBox, type TrackedPoint } from './gps'

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

describe('computeSplits', () => {
  // Punti equidistanti lungo un meridiano: 0.001° di latitudine ≈ 111.3 m.
  // A intervallo costante la velocità è uniforme, quindi ogni split (completo
  // o parziale) deve avere lo stesso passo: ~4.49 min/km con campioni a 30s.
  const uniformRoute = (count: number, dtMs = 30000): TrackedPoint[] =>
    Array.from({ length: count }, (_, i) => ({ lat: 45 + i * 0.001, lng: 9, t: i * dtMs }))

  it('ritorna un array vuoto senza punti o con un punto solo', () => {
    expect(computeSplits([])).toEqual([])
    expect(computeSplits([{ lat: 45, lng: 9, t: 0 }])).toEqual([])
  })

  it('un percorso sotto il km produce un solo split parziale, mai uno completo', () => {
    // 3 segmenti ≈ 334 m
    const splits = computeSplits(uniformRoute(4))
    expect(splits).toHaveLength(1)
    expect(splits[0].partial).toBe(true)
    expect(splits[0].distanceKm).toBeCloseTo(0.334, 2)
    expect(splits[0].paceMinPerKm).toBeCloseTo(4.49, 1)
  })

  it('segmenta un percorso lungo in split completi più l\'ultimo parziale', () => {
    // 26 segmenti ≈ 2894 m → 2 km completi + parziale da ~894 m
    const splits = computeSplits(uniformRoute(27))
    expect(splits).toHaveLength(3)
    expect(splits.map((s) => s.index)).toEqual([1, 2, 3])
    expect(splits[0].partial).toBe(false)
    expect(splits[0].distanceKm).toBe(1)
    expect(splits[1].partial).toBe(false)
    expect(splits[2].partial).toBe(true)
    expect(splits[2].distanceKm).toBeCloseTo(0.894, 2)
    // Velocità costante: il passo interpolato deve essere uguale ovunque
    for (const s of splits) expect(s.paceMinPerKm).toBeCloseTo(4.49, 1)
  })

  it('il tempo del segmento a cavallo del confine si ripartisce tra i due split', () => {
    // Due soli punti: 1113 m in 6 minuti. Il primo km "consuma" solo la sua
    // quota proporzionale dei 6 minuti, il resto va al parziale.
    const points: TrackedPoint[] = [
      { lat: 45, lng: 9, t: 0 },
      { lat: 45.01, lng: 9, t: 6 * 60 * 1000 },
    ]
    const splits = computeSplits(points)
    const totalM = haversineMeters(points[0], points[1])
    expect(splits).toHaveLength(2)
    expect(splits[0].durationMs).toBeCloseTo(360000 * (1000 / totalM), 5)
    expect(splits[0].paceMinPerKm).toBeCloseTo(5.39, 1)
    expect(splits[1].partial).toBe(true)
    expect(splits[1].paceMinPerKm).toBeCloseTo(5.39, 1)
  })

  it('scarta un tratto parziale finale di pochi metri (rumore, non uno split)', () => {
    // 9 segmenti ≈ 1002 m → 1 km completo + 2 m di avanzo da ignorare
    const splits = computeSplits(uniformRoute(10))
    expect(splits).toHaveLength(1)
    expect(splits[0].partial).toBe(false)
  })

  it('ignora i campioni con timestamp non crescente, come isPlausibleSample', () => {
    const clean = uniformRoute(27)
    const withBogus = [...clean]
    // Un rimbalzo lontano con lo stesso timestamp del campione precedente:
    // se non filtrato, aggiungerebbe distanza inesistente agli split.
    withBogus.splice(5, 0, { lat: 45.02, lng: 9, t: clean[4].t })
    expect(computeSplits(withBogus)).toEqual(computeSplits(clean))
  })
})

describe('computeElevationProfile', () => {
  // Percorso lungo un meridiano (0.001° ≈ 111.3 m tra campioni) con le quote
  // passate in lista: null = campione senza altitudine, come dal Geolocation API.
  const routeWithAlts = (alts: (number | null)[]): TrackedPoint[] =>
    alts.map((a, i) => ({ lat: 45 + i * 0.001, lng: 9, t: i * 30000, altitudeM: a }))

  it('ritorna null senza quote (percorsi pre-v42 o dispositivo senza altitudine)', () => {
    const noField: TrackedPoint[] = Array.from({ length: 10 }, (_, i) => ({ lat: 45 + i * 0.001, lng: 9, t: i * 30000 }))
    expect(computeElevationProfile(noField)).toBeNull()
    expect(computeElevationProfile(routeWithAlts(Array(10).fill(null)))).toBeNull()
  })

  it('ritorna null con quote troppo sparse per un profilo onesto', () => {
    // 4 campioni quotati su 10: sotto il minimo assoluto
    const few = Array(10).fill(null).map((_, i) => (i < 4 ? 100 + i : null))
    expect(computeElevationProfile(routeWithAlts(few))).toBeNull()
    // 8 su 20: sopra il minimo assoluto ma sotto la copertura del 50%
    const sparse = Array(20).fill(null).map((_, i) => (i % 3 === 0 ? 100 + i : null))
    expect(computeElevationProfile(routeWithAlts(sparse))).toBeNull()
  })

  it('su un percorso piatto il rumore sotto soglia non inventa dislivello', () => {
    const profile = computeElevationProfile(routeWithAlts([100, 101, 100, 101, 100, 101, 100, 101, 100, 101]))
    expect(profile).not.toBeNull()
    expect(profile!.gainM).toBe(0)
    expect(profile!.lossM).toBe(0)
    expect(profile!.samples).toHaveLength(10)
  })

  it('una salita costante accumula il dislivello positivo, non quello negativo', () => {
    // 100 → 150 a gradini di 5 m, con plateau iniziale/finale perché la media
    // mobile non tagli le estremità
    const profile = computeElevationProfile(
      routeWithAlts([100, 100, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 150, 150]),
    )!
    expect(profile.gainM).toBeGreaterThan(45)
    expect(profile.gainM).toBeLessThanOrEqual(50)
    expect(profile.lossM).toBe(0)
    expect(profile.minM).toBeCloseTo(100, 5)
    expect(profile.maxM).toBeCloseTo(150, 5)
  })

  it('salita e discesa si accumulano separatamente (D+ e D−)', () => {
    const profile = computeElevationProfile(
      routeWithAlts([100, 100, 100, 110, 120, 130, 140, 140, 140, 140, 140, 130, 120, 110, 100, 90, 80, 80, 80, 80, 80]),
    )!
    expect(profile.gainM).toBeGreaterThan(36)
    expect(profile.gainM).toBeLessThanOrEqual(40)
    expect(profile.lossM).toBeGreaterThanOrEqual(54)
    expect(profile.lossM).toBeLessThanOrEqual(60)
    expect(profile.minM).toBeCloseTo(80, 5)
    expect(profile.maxM).toBeCloseTo(140, 5)
  })

  it('un picco isolato viene smussato invece di contare come scalata', () => {
    // +30 m su un solo campione: rumore GPS, non una salita vera
    const alts = Array(15).fill(100)
    alts[7] = 130
    const profile = computeElevationProfile(routeWithAlts(alts))!
    expect(profile.gainM).toBeLessThan(10)
  })

  it('le distanze dei campioni sono cumulative e coprono tutto il percorso', () => {
    const profile = computeElevationProfile(routeWithAlts([100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]))!
    const dists = profile.samples.map((s) => s.distKm)
    for (let i = 1; i < dists.length; i++) expect(dists[i]).toBeGreaterThan(dists[i - 1])
    // 10 segmenti da ~111.2 m
    expect(dists[dists.length - 1]).toBeCloseTo(1.11, 1)
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
