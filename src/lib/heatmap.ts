import type { RoutePoint } from '../types'

// Heatmap personale (roadmap v4, pilastro 02): tutti i percorsi GPS
// dell'utente sovrapposti sulla stessa mappa, mai pubblica. La query in
// activityRoutes.ts restituisce le righe di TUTTE le attività in un unico
// flusso ordinato per activity_id, quindi va prima ricomposta in un
// percorso per attività (le sole coordinate non bastano: due giri diversi
// non vanno uniti da una riga fantasma).
export interface HeatmapRouteRow {
  activityId: string
  lat: number
  lng: number
}

// Un percorso da un solo punto non è disegnabile (nessuna linea): scartato.
export function groupRoutesByActivity(rows: HeatmapRouteRow[]): RoutePoint[][] {
  const groups: RoutePoint[][] = []
  let current: RoutePoint[] = []
  let currentId: string | null = null
  for (const row of rows) {
    if (row.activityId !== currentId) {
      if (current.length >= 2) groups.push(current)
      current = []
      currentId = row.activityId
    }
    current.push({ lat: row.lat, lng: row.lng })
  }
  if (current.length >= 2) groups.push(current)
  return groups
}

// Riduce un percorso lungo (es. un'uscita in bici di ore, migliaia di
// campioni) a al più maxPoints, campionando a intervalli regolari: la
// heatmap mostra la forma del giro, non serve ogni singolo rilevamento GPS.
// Primo e ultimo punto sono sempre inclusi.
export function downsampleRoute(points: RoutePoint[], maxPoints: number): RoutePoint[] {
  if (points.length <= maxPoints || maxPoints < 2) return points
  const step = (points.length - 1) / (maxPoints - 1)
  const result: RoutePoint[] = []
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.round(i * step)])
  }
  return result
}

const MAX_POINTS_PER_ROUTE = 150

// Convenienza usata dalla pagina: righe grezze → percorsi pronti da disegnare.
export function buildHeatmapRoutes(rows: HeatmapRouteRow[]): RoutePoint[][] {
  return groupRoutesByActivity(rows).map((route) => downsampleRoute(route, MAX_POINTS_PER_ROUTE))
}
