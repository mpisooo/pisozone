import { describe, it, expect } from 'vitest'
import { badgeTotal } from './appBadge'

describe('badgeTotal', () => {
  it('somma i conteggi delle diverse fonti', () => {
    expect(badgeTotal([2, 3])).toBe(5)
    expect(badgeTotal([0, 0])).toBe(0)
    expect(badgeTotal([])).toBe(0)
  })

  it('ignora valori negativi o non numerici e tronca i decimali', () => {
    expect(badgeTotal([-4, 3])).toBe(3)
    expect(badgeTotal([NaN, Infinity, 2])).toBe(2)
    expect(badgeTotal([1.9, 2.2])).toBe(3)
  })
})
