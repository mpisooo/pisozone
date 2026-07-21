import { describe, it, expect } from 'vitest'
import { parseGpx } from './gpxImport'

const VALID_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="Strava">
  <trk>
    <name>Corsa del mattino</name>
    <trkseg>
      <trkpt lat="45.4642" lon="9.1900">
        <ele>120.5</ele>
        <time>2026-07-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="45.4650" lon="9.1910">
        <ele>121.2</ele>
        <time>2026-07-01T08:00:10Z</time>
      </trkpt>
      <trkpt lon="9.1925" lat="45.4661">
        <time>2026-07-01T08:00:25Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

describe('parseGpx', () => {
  it('estrae i punti in ordine con lat/lon/quota/orario', () => {
    const { points, name } = parseGpx(VALID_GPX)
    expect(name).toBe('Corsa del mattino')
    expect(points).toHaveLength(3)
    expect(points[0]).toEqual({ lat: 45.4642, lng: 9.19, t: Date.parse('2026-07-01T08:00:00Z'), altitudeM: 120.5 })
    expect(points[2].altitudeM).toBeNull()
  })

  it('legge lat/lon indipendentemente dall\'ordine degli attributi', () => {
    const { points } = parseGpx(VALID_GPX)
    expect(points[2].lat).toBe(45.4661)
    expect(points[2].lng).toBe(9.1925)
  })

  it('scarta i punti senza <time>: non si inventa un orario', () => {
    const xml = `<gpx><trk><trkseg>
      <trkpt lat="1" lon="1"><time>2026-01-01T00:00:00Z</time></trkpt>
      <trkpt lat="2" lon="2"></trkpt>
    </trkseg></trk></gpx>`
    const { points } = parseGpx(xml)
    expect(points).toHaveLength(1)
  })

  it('scarta i punti con timestamp non crescente (fuori ordine o duplicato)', () => {
    const xml = `<gpx><trk><trkseg>
      <trkpt lat="1" lon="1"><time>2026-01-01T00:00:10Z</time></trkpt>
      <trkpt lat="2" lon="2"><time>2026-01-01T00:00:05Z</time></trkpt>
      <trkpt lat="3" lon="3"><time>2026-01-01T00:00:20Z</time></trkpt>
    </trkseg></trk></gpx>`
    const { points } = parseGpx(xml)
    expect(points.map((p) => p.lat)).toEqual([1, 3])
  })

  it('decodifica le entità XML nel nome', () => {
    const xml = `<gpx><trk><name>Giro &amp; ritorno</name><trkseg></trkseg></trk></gpx>`
    expect(parseGpx(xml).name).toBe('Giro & ritorno')
  })

  it('nome assente = null', () => {
    expect(parseGpx('<gpx><trk><trkseg></trkseg></trk></gpx>').name).toBeNull()
  })

  it('file senza trkpt validi = array vuoto', () => {
    expect(parseGpx('<gpx></gpx>').points).toEqual([])
  })
})
