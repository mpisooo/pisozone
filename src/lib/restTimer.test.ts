import { describe, it, expect } from 'vitest'
import { clampRestSeconds, remainingMs, formatRestClock, REST_TIMER_MIN_SEC, REST_TIMER_MAX_SEC } from './restTimer'

describe('clampRestSeconds', () => {
  it('lascia invariati i valori nel range', () => {
    expect(clampRestSeconds(90)).toBe(90)
  })
  it('impone il minimo', () => {
    expect(clampRestSeconds(5)).toBe(REST_TIMER_MIN_SEC)
    expect(clampRestSeconds(-10)).toBe(REST_TIMER_MIN_SEC)
  })
  it('impone il massimo', () => {
    expect(clampRestSeconds(9999)).toBe(REST_TIMER_MAX_SEC)
  })
  it('arrotonda i decimali', () => {
    expect(clampRestSeconds(90.6)).toBe(91)
  })
})

describe('remainingMs', () => {
  it('calcola la differenza da un istante di fine reale', () => {
    expect(remainingMs(1000, 400)).toBe(600)
  })
  it('non scende mai sotto zero', () => {
    expect(remainingMs(1000, 1500)).toBe(0)
  })
})

describe('formatRestClock', () => {
  it('formatta sotto il minuto', () => {
    expect(formatRestClock(45000)).toBe('0:45')
  })
  it('formatta oltre il minuto', () => {
    expect(formatRestClock(90000)).toBe('1:30')
  })
  it('arrotonda per eccesso i millisecondi residui', () => {
    expect(formatRestClock(1200)).toBe('0:02')
  })
  it('zero resta 0:00', () => {
    expect(formatRestClock(0)).toBe('0:00')
  })
})
