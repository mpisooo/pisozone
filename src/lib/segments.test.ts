import { describe, it, expect } from 'vitest'
import {
  matchSegments, cumulativeDistances, segmentRangeFromDistances,
  buildSegmentPrMap, isNewSegmentPr, formatSegmentTime,
  type SegmentCandidate,
} from './segments'
import { haversineMeters, type TrackedPoint } from './gps'

const START = { lat: 45.0, lng: 9.0 }
const END = { lat: 45.001, lng: 9.0 } // ~111m a nord di START, ben oltre la tolleranza di 30m

const candidate: SegmentCandidate = {
  segmentId: 'seg-1',
  startLat: START.lat, startLng: START.lng,
  endLat: END.lat, endLng: END.lng,
}

describe('matchSegments', () => {
  it('riconosce un attraversamento: passa da inizio poi, più tardi, da fine', () => {
    const points: TrackedPoint[] = [
      { lat: 44.0, lng: 8.0, t: 0 },
      { lat: START.lat, lng: START.lng, t: 1000 },
      { lat: 44.5, lng: 8.5, t: 2000 },
      { lat: END.lat, lng: END.lng, t: 5000 },
    ]
    const matches = matchSegments(points, [candidate])
    expect(matches).toEqual([{ segmentId: 'seg-1', timeSeconds: 4 }])
  })

  it('non riconosce nulla se il percorso non passa mai vicino all\'inizio', () => {
    const points: TrackedPoint[] = [
      { lat: 44.0, lng: 8.0, t: 0 },
      { lat: 44.5, lng: 8.5, t: 1000 },
      { lat: END.lat, lng: END.lng, t: 2000 },
    ]
    expect(matchSegments(points, [candidate])).toEqual([])
  })

  it('non riconosce nulla se il punto di fine compare solo PRIMA dell\'inizio nel tempo', () => {
    const points: TrackedPoint[] = [
      { lat: END.lat, lng: END.lng, t: 0 },   // fine, ma troppo presto
      { lat: 44.0, lng: 8.0, t: 1000 },
      { lat: START.lat, lng: START.lng, t: 2000 }, // inizio, dopo
    ]
    expect(matchSegments(points, [candidate])).toEqual([])
  })

  it('scarta un attraversamento con tempo non positivo (campioni fuori ordine)', () => {
    const points: TrackedPoint[] = [
      { lat: START.lat, lng: START.lng, t: 5000 },
      { lat: END.lat, lng: END.lng, t: 1000 }, // prima nell'array ma con timestamp precedente
    ]
    expect(matchSegments(points, [candidate])).toEqual([])
  })

  it('valuta più candidati indipendentemente', () => {
    const other: SegmentCandidate = { segmentId: 'seg-2', startLat: 44.0, startLng: 8.0, endLat: START.lat, endLng: START.lng }
    const points: TrackedPoint[] = [
      { lat: 44.0, lng: 8.0, t: 0 },
      { lat: START.lat, lng: START.lng, t: 1000 },
      { lat: END.lat, lng: END.lng, t: 3000 },
    ]
    const matches = matchSegments(points, [candidate, other])
    expect(matches).toHaveLength(2)
    expect(matches.find((m) => m.segmentId === 'seg-1')?.timeSeconds).toBe(2)
    expect(matches.find((m) => m.segmentId === 'seg-2')?.timeSeconds).toBe(1)
  })
})

describe('cumulativeDistances', () => {
  it('parte da zero e cresce monotonamente', () => {
    const points = [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }, { lat: 0, lng: 0.002 }]
    const cum = cumulativeDistances(points)
    expect(cum[0]).toBe(0)
    expect(cum[1]).toBeGreaterThan(0)
    expect(cum[2]).toBeGreaterThan(cum[1])
  })

  it('la distanza totale coincide con la somma dei tratti haversine', () => {
    const points = [{ lat: 45.0, lng: 9.0 }, { lat: 45.001, lng: 9.0 }, { lat: 45.001, lng: 9.001 }]
    const cum = cumulativeDistances(points)
    const expected = haversineMeters(points[0], points[1]) + haversineMeters(points[1], points[2])
    expect(cum[2]).toBeCloseTo(expected, 6)
  })

  it('ritorna un array vuoto per un input vuoto', () => {
    expect(cumulativeDistances([])).toEqual([])
  })
})

describe('segmentRangeFromDistances', () => {
  // Punti equidistanti lungo una linea di longitudine all'equatore, ~25m a passo.
  const DELTA_LNG = 25 / 111320
  const points: TrackedPoint[] = Array.from({ length: 10 }, (_, i) => ({
    lat: 0, lng: i * DELTA_LNG, t: i * 10000,
  }))
  const cumDist = cumulativeDistances(points)

  it('risolve un intervallo valido nei punti reali più vicini', () => {
    const range = segmentRangeFromDistances(points, cumDist, cumDist[2], cumDist[7])
    expect(range).not.toBeNull()
    expect(range!.startIdx).toBe(2)
    expect(range!.endIdx).toBe(7)
    expect(range!.timeSeconds).toBe(50) // (70000-20000)/1000
    expect(range!.distanceM).toBeCloseTo(cumDist[7] - cumDist[2], 6)
  })

  it('rifiuta un intervallo più corto della distanza minima', () => {
    const range = segmentRangeFromDistances(points, cumDist, cumDist[2], cumDist[2] + 10)
    expect(range).toBeNull()
  })

  it('rifiuta un intervallo degenere che risolve allo stesso campione', () => {
    // Due soli punti lontanissimi: sia 400m che 460m di distanza cumulata
    // (58m di differenza, sopra la soglia minima) sono più vicini a 0 che a 1000.
    const twoPoints: TrackedPoint[] = [{ lat: 0, lng: 0, t: 0 }, { lat: 0, lng: 10, t: 1000 }]
    const twoCum = [0, 1000]
    const range = segmentRangeFromDistances(twoPoints, twoCum, 400, 460)
    expect(range).toBeNull()
  })

  it('rifiuta un percorso con meno di 2 punti', () => {
    expect(segmentRangeFromDistances([points[0]], [0], 0, 100)).toBeNull()
  })
})

describe('buildSegmentPrMap / isNewSegmentPr', () => {
  it('tiene il tempo minimo per segmento', () => {
    const map = buildSegmentPrMap([
      { segment_id: 'a', time_seconds: 60 },
      { segment_id: 'a', time_seconds: 45 },
      { segment_id: 'b', time_seconds: 30 },
    ])
    expect(map.get('a')).toBe(45)
    expect(map.get('b')).toBe(30)
  })

  it('ignora tempi non validi', () => {
    const map = buildSegmentPrMap([{ segment_id: 'a', time_seconds: 0 }, { segment_id: 'a', time_seconds: -5 }])
    expect(map.has('a')).toBe(false)
  })

  it('un tempo più basso del minimo storico è un nuovo PR', () => {
    const map = new Map([['a', 45]])
    expect(isNewSegmentPr('a', 40, map)).toBe(true)
    expect(isNewSegmentPr('a', 50, map)).toBe(false)
  })

  it('il primo tentativo in assoluto è sempre un PR', () => {
    expect(isNewSegmentPr('new-segment', 999, new Map())).toBe(true)
  })
})

describe('formatSegmentTime', () => {
  it('formatta sotto il minuto come m:ss', () => {
    expect(formatSegmentTime(42)).toBe('0:42')
  })

  it('formatta sopra il minuto', () => {
    expect(formatSegmentTime(272)).toBe('4:32')
  })

  it('formatta oltre l\'ora come h:mm:ss', () => {
    expect(formatSegmentTime(3910)).toBe('1:05:10')
  })
})
