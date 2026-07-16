import { describe, it, expect } from 'vitest'
import { ZONES, getZoneByMet, getZoneForActivity, getZoneByPercent, zoneForSpeed } from './zones'
import { MET } from './constants'
import type { ActivityType } from '../types'

describe('getZoneByMet', () => {
  it('assegna Recupero ai MET bassi', () => {
    expect(getZoneByMet(2.5).id).toBe(1)
  })
  it('rispetta i confini superiori inclusi', () => {
    expect(getZoneByMet(3.9).id).toBe(1)
    expect(getZoneByMet(3.91).id).toBe(2)
    expect(getZoneByMet(6.4).id).toBe(2)
    expect(getZoneByMet(6.41).id).toBe(3)
    expect(getZoneByMet(8.4).id).toBe(3)
    expect(getZoneByMet(8.41).id).toBe(4)
  })
  it('assegna Picco ai MET molto alti', () => {
    expect(getZoneByMet(20).id).toBe(4)
  })
  it('non va mai fuori scala (0-4 zone, sempre una definita)', () => {
    for (const met of [0, 1, 5, 9.8, 100]) {
      const z = getZoneByMet(met)
      expect(ZONES.map((zz) => zz.id)).toContain(z.id)
    }
  })
})

describe('getZoneForActivity', () => {
  it('mappa la corsa (MET più alto) in Picco', () => {
    expect(getZoneForActivity('corsa').id).toBe(4)
  })
  it('mappa lo yoga (MET più basso) in Recupero', () => {
    expect(getZoneForActivity('yoga').id).toBe(1)
  })
  it('ogni tipo di attività con un MET definito ha una zona valida', () => {
    // Guardia di regressione: se in futuro si aggiunge un tipo di attività a
    // MET senza aggiornare le soglie qui, il test lo intercetta.
    for (const type of Object.keys(MET) as ActivityType[]) {
      const z = getZoneForActivity(type)
      expect(z.id).toBeGreaterThanOrEqual(1)
      expect(z.id).toBeLessThanOrEqual(4)
    }
  })
})

describe('zoneForSpeed', () => {
  it('da fermi o con velocità non valida si è in Recupero', () => {
    expect(zoneForSpeed('corsa', 0).id).toBe(1)
    expect(zoneForSpeed('corsa', -1).id).toBe(1)
    expect(zoneForSpeed('corsa', NaN).id).toBe(1)
  })
  it('la camminata lenta resta in Recupero, la corsa veloce va in Picco', () => {
    expect(zoneForSpeed('camminata', 4).id).toBe(1) // MET 2.8
    expect(zoneForSpeed('corsa', 12).id).toBe(4) // MET 10.5
  })
  it('le fasce intermedie seguono la tabella velocità→MET', () => {
    expect(zoneForSpeed('bici', 15).id).toBe(2) // MET 4.0
    expect(zoneForSpeed('bici', 21).id).toBe(3) // MET 8.0
    expect(zoneForSpeed('corsa', 7).id).toBe(2) // MET 6.0
    expect(zoneForSpeed('trekking', 5).id).toBe(2) // MET 6.0
  })
})

describe('getZoneByPercent', () => {
  it('rispetta le soglie 35/70/100', () => {
    expect(getZoneByPercent(0).id).toBe(1)
    expect(getZoneByPercent(34).id).toBe(1)
    expect(getZoneByPercent(35).id).toBe(2)
    expect(getZoneByPercent(69).id).toBe(2)
    expect(getZoneByPercent(70).id).toBe(3)
    expect(getZoneByPercent(99).id).toBe(3)
    expect(getZoneByPercent(100).id).toBe(4)
  })
  it('gestisce il superamento oltre il 100%', () => {
    expect(getZoneByPercent(150).id).toBe(4)
  })
})
