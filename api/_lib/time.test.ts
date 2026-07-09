import { describe, it, expect } from 'vitest'
import { getRomeHour, getRomeTodayRange } from './time'

describe('getRomeHour', () => {
  it('converte un istante UTC in ora locale di Roma (estate, CEST +02:00)', () => {
    expect(getRomeHour(new Date('2026-07-09T20:00:00Z'))).toBe(22)
  })

  it('converte un istante UTC in ora locale di Roma (inverno, CET +01:00)', () => {
    expect(getRomeHour(new Date('2026-01-09T20:00:00Z'))).toBe(21)
  })

  it('gestisce il giro di mezzanotte', () => {
    expect(getRomeHour(new Date('2026-01-09T23:30:00Z'))).toBe(0)
  })
})

describe('getRomeTodayRange', () => {
  it('costruisce i limiti della giornata locale di Roma', () => {
    const { start, end } = getRomeTodayRange(new Date('2026-07-09T10:00:00Z'))
    expect(start).toBe('2026-07-09T00:00:00+02:00')
    expect(end).toBe('2026-07-09T23:59:59.999+02:00')
  })
})
