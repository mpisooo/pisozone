import { describe, it, expect } from 'vitest'
import {
  decomposeDurationMin, composeDurationMin,
  decomposeDurationSeconds, composeDurationSeconds,
  durationMinFromSeconds,
} from './duration'

describe('decomposeDurationMin', () => {
  it('decompone minuti interi', () => {
    expect(decomposeDurationMin(90)).toEqual({ hours: 1, minutes: 30, seconds: 0 })
  })

  it('un duration_min già arrotondato produce sempre 0 secondi', () => {
    expect(decomposeDurationMin(24)).toEqual({ hours: 0, minutes: 24, seconds: 0 })
  })

  it('non produce mai un numero negativo', () => {
    expect(decomposeDurationMin(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('composeDurationMin', () => {
  it('ricompone ore/minuti/secondi in minuti totali (frazionari)', () => {
    expect(composeDurationMin(1, 30, 0)).toBe(90)
    expect(composeDurationMin(0, 23, 38)).toBeCloseTo(23 + 38 / 60, 10)
  })
})

describe('decomposeDurationSeconds / composeDurationSeconds', () => {
  it('fa il giro completo', () => {
    expect(decomposeDurationSeconds(composeDurationSeconds(0, 23, 38))).toEqual({ hours: 0, minutes: 23, seconds: 38 })
    expect(decomposeDurationSeconds(composeDurationSeconds(1, 5, 9))).toEqual({ hours: 1, minutes: 5, seconds: 9 })
  })

  it('arrotonda secondi frazionari', () => {
    expect(decomposeDurationSeconds(59.6)).toEqual({ hours: 0, minutes: 1, seconds: 0 })
  })
})

describe('durationMinFromSeconds', () => {
  it('arrotonda al minuto più vicino', () => {
    expect(durationMinFromSeconds(composeDurationSeconds(0, 23, 38))).toBe(24)
    expect(durationMinFromSeconds(composeDurationSeconds(0, 23, 20))).toBe(23)
  })

  it('non scende mai sotto 1 (vincolo DB duration_min > 0)', () => {
    expect(durationMinFromSeconds(10)).toBe(1)
    expect(durationMinFromSeconds(0)).toBe(1)
  })
})
