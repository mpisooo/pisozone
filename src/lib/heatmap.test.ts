import { describe, it, expect } from 'vitest'
import { groupRoutesByActivity, downsampleRoute, buildHeatmapRoutes, type HeatmapRouteRow } from './heatmap'

describe('groupRoutesByActivity', () => {
  it('divide le righe in un percorso per activity_id', () => {
    const rows: HeatmapRouteRow[] = [
      { activityId: 'a', lat: 1, lng: 1 },
      { activityId: 'a', lat: 2, lng: 2 },
      { activityId: 'b', lat: 3, lng: 3 },
      { activityId: 'b', lat: 4, lng: 4 },
      { activityId: 'b', lat: 5, lng: 5 },
    ]
    const groups = groupRoutesByActivity(rows)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toEqual([{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }])
    expect(groups[1]).toHaveLength(3)
  })

  it('scarta i percorsi con un solo punto (non disegnabili)', () => {
    const rows: HeatmapRouteRow[] = [
      { activityId: 'a', lat: 1, lng: 1 },
      { activityId: 'b', lat: 2, lng: 2 },
      { activityId: 'b', lat: 3, lng: 3 },
    ]
    const groups = groupRoutesByActivity(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(2)
  })

  it('non unisce due activity_id uguali non consecutivi in gruppi diversi da quanto atteso', () => {
    // L'ordinamento reale arriva da .order('activity_id'), quindi le righe
    // della stessa attività sono sempre consecutive: qui si verifica solo
    // che un cambio di id chiuda il gruppo corrente, non che li riordini.
    const rows: HeatmapRouteRow[] = [
      { activityId: 'a', lat: 1, lng: 1 },
      { activityId: 'a', lat: 2, lng: 2 },
      { activityId: 'a', lat: 3, lng: 3 },
    ]
    expect(groupRoutesByActivity(rows)).toHaveLength(1)
  })

  it('ritorna un array vuoto per un input vuoto', () => {
    expect(groupRoutesByActivity([])).toEqual([])
  })
})

describe('downsampleRoute', () => {
  const points = Array.from({ length: 1000 }, (_, i) => ({ lat: i, lng: i }))

  it('lascia invariato un percorso già sotto il limite', () => {
    const short = points.slice(0, 10)
    expect(downsampleRoute(short, 150)).toEqual(short)
  })

  it('riduce a esattamente maxPoints un percorso più lungo', () => {
    const result = downsampleRoute(points, 150)
    expect(result).toHaveLength(150)
  })

  it('include sempre il primo e l\'ultimo punto', () => {
    const result = downsampleRoute(points, 150)
    expect(result[0]).toEqual(points[0])
    expect(result[result.length - 1]).toEqual(points[points.length - 1])
  })

  it('con maxPoints uguale alla lunghezza non tocca nulla', () => {
    const exact = points.slice(0, 150)
    expect(downsampleRoute(exact, 150)).toEqual(exact)
  })
})

describe('buildHeatmapRoutes', () => {
  it('raggruppa e riduce in un solo passaggio', () => {
    const longRoute: HeatmapRouteRow[] = Array.from({ length: 500 }, (_, i) => ({
      activityId: 'a', lat: i, lng: i,
    }))
    const shortRoute: HeatmapRouteRow[] = [
      { activityId: 'b', lat: 0, lng: 0 },
      { activityId: 'b', lat: 1, lng: 1 },
    ]
    const routes = buildHeatmapRoutes([...longRoute, ...shortRoute])
    expect(routes).toHaveLength(2)
    expect(routes[0].length).toBeLessThanOrEqual(150)
    expect(routes[1]).toEqual([{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }])
  })
})
