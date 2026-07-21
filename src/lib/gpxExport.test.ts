import { describe, it, expect } from 'vitest'
import { buildGpxDocument } from './gpxExport'

const P1 = { lat: 45.4642, lng: 9.19, t: Date.parse('2026-07-01T08:00:00Z') }
const P2 = { lat: 45.4650, lng: 9.191, t: Date.parse('2026-07-01T08:00:10Z'), altitudeM: 120.4 }

describe('buildGpxDocument', () => {
  it('produce un documento GPX 1.1 valido con i trkpt in ordine', () => {
    const xml = buildGpxDocument([P1, P2], 'Corsa mattutina')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<gpx version="1.1"')
    expect(xml).toContain('<name>Corsa mattutina</name>')
    expect((xml.match(/<trkpt/g) ?? []).length).toBe(2)
    expect(xml).toContain('lat="45.4642"')
    expect(xml).toContain('lon="9.19"')
    expect(xml.indexOf('08:00:00')).toBeLessThan(xml.indexOf('08:00:10'))
  })

  it('include <ele> solo quando la quota è presente', () => {
    const xml = buildGpxDocument([P1, P2], 'Test')
    const [firstTrkpt, secondTrkpt] = xml.split('\n').filter((l) => l.includes('<trkpt'))
    expect(firstTrkpt).not.toContain('<ele>')
    expect(secondTrkpt).toContain('<ele>120.4</ele>')
  })

  it('scrive il timestamp come ISO 8601', () => {
    const xml = buildGpxDocument([P1], 'Test')
    expect(xml).toContain('<time>2026-07-01T08:00:00.000Z</time>')
  })

  it('esegue l\'escape dei caratteri XML speciali nel nome', () => {
    const xml = buildGpxDocument([P1], 'Corsa & Bici <test> "virgolette"')
    expect(xml).toContain('<name>Corsa &amp; Bici &lt;test&gt; &quot;virgolette&quot;</name>')
  })

  it('gestisce un percorso senza punti', () => {
    const xml = buildGpxDocument([], 'Vuoto')
    expect(xml).toContain('<trkseg>')
    expect(xml).not.toContain('<trkpt')
  })
})
