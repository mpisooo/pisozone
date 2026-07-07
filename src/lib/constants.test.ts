import { describe, it, expect } from 'vitest'
import { calcCalories, MET, ACTIVITY_OPTIONS } from './constants'

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

describe('coerenza costanti attività', () => {
  it('ogni tipo di attività ha il suo valore MET', () => {
    for (const opt of ACTIVITY_OPTIONS) {
      expect(MET[opt.value], `manca il MET per "${opt.value}"`).toBeGreaterThan(0)
    }
  })
})
