// Export GPX dei percorsi (roadmap v4, pilastro 04): serializzazione pura di
// un percorso già registrato in GPX 1.1, lo standard che ogni strumento GPS
// al mondo legge — a differenza dell'export CSV/JSON già esistente
// (lib/dataExport.ts), portabile fuori da PisoZone. Zero dipendenze: XML così
// semplice si scrive a mano.

export interface GpxPoint {
  lat: number
  lng: number
  t: number
  altitudeM?: number | null
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildGpxDocument(points: GpxPoint[], name: string): string {
  const trkpts = points
    .map((p) => {
      const ele = p.altitudeM != null && Number.isFinite(p.altitudeM) ? `<ele>${p.altitudeM.toFixed(1)}</ele>` : ''
      return `      <trkpt lat="${p.lat}" lon="${p.lng}">${ele}<time>${new Date(p.t).toISOString()}</time></trkpt>`
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="PisoZone" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <trk>',
    `    <name>${escapeXml(name)}</name>`,
    '    <trkseg>',
    trkpts,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n')
}
