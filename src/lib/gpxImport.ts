// Import GPX (roadmap v4, pilastro 04): parser puro, senza dipendenze — niente
// DOMParser (i test girano in ambiente 'node', senza DOM) né una libreria XML,
// un GPX è abbastanza regolare da leggerlo con un paio di espressioni
// regolari. Copre solo ciò che serve a ricostruire un'attività: punti
// lat/lon/quota/orario e il nome della traccia, se presente.

import { dropNonIncreasingTimestamps, type TrackedPoint } from './gps'

export const MIN_GPX_POINTS = 2

export interface ParsedGpx {
  points: TrackedPoint[]
  name: string | null
}

const XML_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'',
}

function decodeXmlEntities(raw: string): string {
  return raw.replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => XML_ENTITIES[e])
}

function extractAttr(tag: string, name: string): number | null {
  const m = tag.match(new RegExp(`${name}="(-?[0-9.]+)"`))
  if (!m) return null
  const n = Number.parseFloat(m[1])
  return Number.isFinite(n) ? n : null
}

// Un file GPX reale ha un <trkpt> per campione, con lat/lon come attributi
// (in ordine non garantito) e <ele>/<time> come figli opzionali — solo
// <time> è indispensabile: senza orario non c'è modo di derivare una durata
// reale, e "non inventare un dato mancante" vale anche qui.
export function parseGpx(xml: string): ParsedGpx {
  const nameMatch = xml.match(/<name>([^<]*)<\/name>/i)
  const name = nameMatch ? decodeXmlEntities(nameMatch[1].trim()) || null : null

  const points: TrackedPoint[] = []
  const trkptRe = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/gi
  let match: RegExpExecArray | null
  while ((match = trkptRe.exec(xml)) !== null) {
    const [, attrs, body] = match
    const lat = extractAttr(attrs, 'lat')
    const lng = extractAttr(attrs, 'lon')
    if (lat == null || lng == null) continue

    const timeMatch = body.match(/<time>([^<]*)<\/time>/i)
    if (!timeMatch) continue
    const t = Date.parse(timeMatch[1].trim())
    if (!Number.isFinite(t)) continue

    const eleMatch = body.match(/<ele>([^<]*)<\/ele>/i)
    const ele = eleMatch ? Number.parseFloat(eleMatch[1]) : null
    const altitudeM = ele != null && Number.isFinite(ele) ? ele : null

    points.push({ lat, lng, t, altitudeM })
  }

  return { points: dropNonIncreasingTimestamps(points), name }
}
