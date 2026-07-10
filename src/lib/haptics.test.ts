import { describe, it, expect } from 'vitest'
import { HAPTIC_PATTERNS, iosTickDelays, type HapticKind } from './haptics'

describe('HAPTIC_PATTERNS', () => {
  it('ogni pattern è non vuoto e fatto di durate positive intere', () => {
    for (const [kind, pattern] of Object.entries(HAPTIC_PATTERNS)) {
      expect(pattern.length, kind).toBeGreaterThan(0)
      for (const ms of pattern) {
        expect(Number.isInteger(ms), `${kind}: ${ms}`).toBe(true)
        expect(ms, kind).toBeGreaterThan(0)
      }
    }
  })

  it('ogni pattern inizia con una vibrazione (lunghezza dispari o pari, mai pausa iniziale implicita)', () => {
    // Il formato [vibra, pausa, vibra...] parte sempre da un segmento di
    // vibrazione: un pattern sensato ha quindi lunghezza dispari.
    for (const [kind, pattern] of Object.entries(HAPTIC_PATTERNS)) {
      expect(pattern.length % 2, kind).toBe(1)
    }
  })
})

describe('iosTickDelays', () => {
  it('un segmento singolo → un tick immediato', () => {
    expect(iosTickDelays([30])).toEqual([0])
  })

  it('emette un tick all-attacco di ogni segmento di vibrazione', () => {
    // [80 vibra, 40 pausa, 80 vibra, 40 pausa, 200 vibra]
    expect(iosTickDelays([80, 40, 80, 40, 200])).toEqual([0, 120, 240])
  })

  it('pattern vuoto → nessun tick', () => {
    expect(iosTickDelays([])).toEqual([])
  })

  it('i tick di ogni pattern predefinito sono crescenti e partono da 0', () => {
    for (const kind of Object.keys(HAPTIC_PATTERNS) as HapticKind[]) {
      const delays = iosTickDelays(HAPTIC_PATTERNS[kind])
      expect(delays[0], kind).toBe(0)
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i], kind).toBeGreaterThan(delays[i - 1])
      }
    }
  })
})
