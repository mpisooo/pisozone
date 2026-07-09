import { describe, it, expect } from 'vitest'
import { calcCalories, calcCaloriesFromSpeed, MET, ACTIVITY_OPTIONS, GPS_TRACKABLE_TYPES } from './constants'

describe('calcCalories', () => {
  it('applica la formula MET × kg × ore', () => {
    // corsa: MET 9.8 → 9.8 × 70 × 1h = 686
    expect(calcCalories('corsa', 60, 70)).toBe(686)
    expect(calcCalories('corsa', 30, 70)).toBe(343)
  })

  it('riduce del 10% per il genere femminile', () => {
    expect(calcCalories('corsa', 60, 70, 'female')).toBe(617) // 686 × 0.9
    expect(calcCalories('corsa', 60, 70, 'male')).toBe(686)
    expect(calcCalories('corsa', 60, 70, null)).toBe(686)
  })

  it('arrotonda al numero intero', () => {
    // yoga: 2.5 × 68 × 0.5h = 85
    expect(Number.isInteger(calcCalories('yoga', 30, 68))).toBe(true)
  })
})

describe('calcCaloriesFromSpeed', () => {
  it('sceglie il MET della fascia di velocità corretta', () => {
    // corsa 10 km/h → fascia 9.6-10.8, MET 9.0 → 9.0 × 70 × 1h = 630
    expect(calcCaloriesFromSpeed('corsa', 60, 10, 70)).toBe(630)
    // corsa lenta 5 km/h → fascia <8.0, MET 6.0 → 6.0 × 70 × 0.5h = 210
    expect(calcCaloriesFromSpeed('corsa', 30, 5, 70)).toBe(210)
  })

  it('usa l\'ultima fascia per velocità oltre la soglia massima', () => {
    // bici 40 km/h → oltre 30.6, MET 15.8 → 15.8 × 80 × 1h = 1264
    expect(calcCaloriesFromSpeed('bici', 60, 40, 80)).toBe(1264)
  })

  it('riduce del 10% per il genere femminile', () => {
    expect(calcCaloriesFromSpeed('corsa', 60, 10, 70, 'female')).toBe(567) // 630 × 0.9
  })

  it('ricade sul MET fisso se la velocità non è valida', () => {
    expect(calcCaloriesFromSpeed('corsa', 60, 0, 70)).toBe(calcCalories('corsa', 60, 70))
    expect(calcCaloriesFromSpeed('corsa', 60, NaN, 70)).toBe(calcCalories('corsa', 60, 70))
    expect(calcCaloriesFromSpeed('corsa', 60, -5, 70)).toBe(calcCalories('corsa', 60, 70))
  })
})

describe('GPS_TRACKABLE_TYPES', () => {
  it('contiene solo attività outdoor con telefono trasportabile', () => {
    expect(GPS_TRACKABLE_TYPES).toEqual(['corsa', 'bici', 'camminata'])
  })
})

describe('coerenza costanti attività', () => {
  it('ogni tipo di attività ha il suo valore MET', () => {
    for (const opt of ACTIVITY_OPTIONS) {
      expect(MET[opt.value], `manca il MET per "${opt.value}"`).toBeGreaterThan(0)
    }
  })
})
