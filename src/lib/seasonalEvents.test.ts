import { describe, it, expect } from 'vitest'
import {
  SEASONAL_EVENTS,
  SEASONAL_MAX_WINDOW_DAYS,
  getCurrentSeasonalEvent,
  getUpcomingSeasonalEvent,
  getRecentlyEndedEvents,
  seasonalDaysLeft,
} from './seasonalEvents'
import { ACTIVITY_OPTIONS } from './constants'

describe('integrità di SEASONAL_EVENTS', () => {
  it('chiavi uniche', () => {
    const keys = SEASONAL_EVENTS.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('metrica valida, finestra coerente ed entro il tetto DB', () => {
    const validMetrics = new Set(['sessions', 'minutes', 'km', 'kcal'])
    const validTypes = new Set(ACTIVITY_OPTIONS.map((o) => o.value))
    for (const e of SEASONAL_EVENTS) {
      expect(validMetrics.has(e.metric)).toBe(true)
      expect(e.endsOn >= e.startsOn).toBe(true)
      const days = (new Date(e.endsOn).getTime() - new Date(e.startsOn).getTime()) / 86400000
      expect(days).toBeLessThanOrEqual(SEASONAL_MAX_WINDOW_DAYS)
      if (e.activityType) expect(validTypes.has(e.activityType)).toBe(true)
    }
  })
})

describe('getCurrentSeasonalEvent', () => {
  it('trova l\'evento la cui finestra contiene la data', () => {
    expect(getCurrentSeasonalEvent(new Date('2026-07-15T10:00:00'))?.key).toBe('estate-2026')
    expect(getCurrentSeasonalEvent(new Date('2026-09-15T10:00:00'))?.key).toBe('rientro-2026')
  })

  it('nessun evento fuori da ogni finestra', () => {
    expect(getCurrentSeasonalEvent(new Date('2026-01-15T10:00:00'))).toBeNull()
  })

  it('include l\'intero ultimo giorno della finestra', () => {
    expect(getCurrentSeasonalEvent(new Date('2026-08-31T23:30:00'))?.key).toBe('estate-2026')
    expect(getCurrentSeasonalEvent(new Date('2026-09-01T00:00:01'))?.key).toBe('rientro-2026')
  })

  // La ragione d'essere degli eventi d'autunno/inverno (roadmap v3, pilastro
  // 03): la catena non deve avere buchi da luglio 2026 a fine gennaio 2027.
  it('autunno e inverno coprono senza buchi fino a fine gennaio 2027', () => {
    expect(getCurrentSeasonalEvent(new Date('2026-10-01T08:00:00'))?.key).toBe('autunno-2026')
    expect(getCurrentSeasonalEvent(new Date('2026-11-30T22:00:00'))?.key).toBe('autunno-2026')
    expect(getCurrentSeasonalEvent(new Date('2026-12-25T10:00:00'))?.key).toBe('inverno-2026')
    expect(getCurrentSeasonalEvent(new Date('2027-01-31T22:00:00'))?.key).toBe('inverno-2026')
  })
})

describe('getUpcomingSeasonalEvent', () => {
  it('propone il prossimo evento solo entro la finestra di anteprima', () => {
    expect(getUpcomingSeasonalEvent(new Date('2026-08-25T10:00:00'))?.key).toBe('rientro-2026')
    expect(getUpcomingSeasonalEvent(new Date('2026-06-01T10:00:00'))).toBeNull()
  })
})

describe('getRecentlyEndedEvents', () => {
  it('include un evento chiuso da pochi giorni, esclude quelli lontani', () => {
    expect(getRecentlyEndedEvents(new Date('2026-09-05T10:00:00')).map((e) => e.key)).toEqual(['estate-2026'])
    expect(getRecentlyEndedEvents(new Date('2026-10-20T10:00:00')).map((e) => e.key)).toEqual([])
  })
})

describe('seasonalDaysLeft', () => {
  it('conta i giorni rimanenti, mai negativi', () => {
    expect(seasonalDaysLeft({ endsOn: '2026-08-31' }, new Date('2026-08-29T10:00:00'))).toBe(2)
    expect(seasonalDaysLeft({ endsOn: '2026-08-31' }, new Date('2026-09-10T10:00:00'))).toBe(0)
  })
})
