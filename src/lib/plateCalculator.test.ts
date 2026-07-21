import { describe, it, expect } from 'vitest'
import { calcPlateLoad, DEFAULT_BAR_WEIGHT_KG } from './plateCalculator'

describe('calcPlateLoad', () => {
  it('carica 100kg su bilanciere da 20kg con le piastre standard (greedy dalla più pesante)', () => {
    const r = calcPlateLoad(100)
    expect(r.perSideKg).toEqual([25, 15])
    expect(r.achievedKg).toBe(100)
    expect(r.remainderKg).toBe(0)
  })

  it('bilanciere vuoto se il target è pari o sotto il peso del bilanciere', () => {
    expect(calcPlateLoad(20).perSideKg).toEqual([])
    expect(calcPlateLoad(15).perSideKg).toEqual([])
    expect(calcPlateLoad(20).achievedKg).toBe(20)
  })

  it('resto quando il peso non è raggiungibile esattamente', () => {
    const r = calcPlateLoad(21) // (21-20)/2 = 0.5 per lato, sotto la piastra più leggera (1.25)
    expect(r.perSideKg).toEqual([])
    expect(r.achievedKg).toBe(20)
    expect(r.remainderKg).toBe(1)
  })

  it('rispetta un bilanciere personalizzato', () => {
    const r = calcPlateLoad(60, 10)
    expect(r.achievedKg).toBe(60)
    expect(r.perSideKg.reduce((s, p) => s + p, 0)).toBe(25)
  })

  it('rispetta un set di piastre personalizzato', () => {
    const r = calcPlateLoad(50, DEFAULT_BAR_WEIGHT_KG, [10, 5])
    expect(r.perSideKg).toEqual([10, 5])
    expect(r.achievedKg).toBe(50)
  })

  it('gestisce target frazionari con la tolleranza in virgola mobile', () => {
    const r = calcPlateLoad(22.5)
    expect(r.perSideKg).toEqual([1.25])
    expect(r.achievedKg).toBeCloseTo(22.5, 2)
    expect(r.remainderKg).toBe(0)
  })
})
