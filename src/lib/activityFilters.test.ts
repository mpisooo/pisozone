import { describe, it, expect } from 'vitest'
import {
  EMPTY_FILTERS, hasActiveFilters, activeFilterCount, filterActivities, typesInActivities,
  type ActivityFilters,
} from './activityFilters'
import type { Activity } from '../types'

let seq = 0
function act(partial: Partial<Activity>): Activity {
  return {
    id: `a${++seq}`,
    user_id: 'u1',
    type: 'corsa',
    date: '2026-07-10T18:00:00+02:00',
    duration_min: 45,
    calories: null,
    distance_km: null,
    notes: null,
    created_at: '2026-07-10T19:00:00Z',
    credits_earned: 0,
    ...partial,
  }
}

const filters = (partial: Partial<ActivityFilters>): ActivityFilters => ({ ...EMPTY_FILTERS, ...partial })

describe('hasActiveFilters / activeFilterCount', () => {
  it('i filtri vuoti (o una query di soli spazi) non contano come attivi', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters(filters({ query: '   ' }))).toBe(false)
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
  })

  it('conta ogni sport selezionato più i toggle e la ricerca', () => {
    const f = filters({ types: ['corsa', 'bici'], gpsOnly: true, query: 'parco' })
    expect(hasActiveFilters(f)).toBe(true)
    expect(activeFilterCount(f)).toBe(4)
  })
})

describe('filterActivities', () => {
  const activities = [
    act({ id: 'run-gps', type: 'corsa', gps_tracked: true, notes: 'Giro del Parco' }),
    act({ id: 'run-plain', type: 'corsa', notes: 'pioggia battente' }),
    act({ id: 'gym-photo', type: 'palestra', photo_url: 'https://x/1.jpg' }),
    act({ id: 'bike', type: 'bici', notes: null }),
  ]

  it('senza filtri attivi ritorna la lista intatta', () => {
    expect(filterActivities(activities, EMPTY_FILTERS)).toBe(activities)
  })

  it('filtra per sport (più sport = unione)', () => {
    expect(filterActivities(activities, filters({ types: ['corsa'] })).map((a) => a.id))
      .toEqual(['run-gps', 'run-plain'])
    expect(filterActivities(activities, filters({ types: ['palestra', 'bici'] })).map((a) => a.id))
      .toEqual(['gym-photo', 'bike'])
  })

  it('i toggle GPS e foto tengono solo le attività che li hanno', () => {
    expect(filterActivities(activities, filters({ gpsOnly: true })).map((a) => a.id)).toEqual(['run-gps'])
    expect(filterActivities(activities, filters({ photoOnly: true })).map((a) => a.id)).toEqual(['gym-photo'])
  })

  it('il toggle preferiti tiene solo le attività marcate is_favorite', () => {
    const withFavorite = [...activities, act({ id: 'run-favorite', type: 'nuoto', is_favorite: true })]
    expect(filterActivities(withFavorite, filters({ favoritesOnly: true })).map((a) => a.id)).toEqual(['run-favorite'])
  })

  it('la ricerca nelle note è case-insensitive e ignora chi non ha note', () => {
    expect(filterActivities(activities, filters({ query: 'parco' })).map((a) => a.id)).toEqual(['run-gps'])
    expect(filterActivities(activities, filters({ query: '  PIOGGIA ' })).map((a) => a.id)).toEqual(['run-plain'])
    expect(filterActivities(activities, filters({ query: 'inesistente' }))).toEqual([])
  })

  it('i filtri si combinano in AND', () => {
    expect(filterActivities(activities, filters({ types: ['corsa'], gpsOnly: true })).map((a) => a.id))
      .toEqual(['run-gps'])
    expect(filterActivities(activities, filters({ types: ['corsa'], photoOnly: true }))).toEqual([])
  })
})

describe('typesInActivities', () => {
  it('elenca solo gli sport presenti, dal più praticato', () => {
    expect(typesInActivities([
      act({ type: 'palestra' }),
      act({ type: 'corsa' }),
      act({ type: 'palestra' }),
    ])).toEqual(['palestra', 'corsa'])
    expect(typesInActivities([])).toEqual([])
  })
})
